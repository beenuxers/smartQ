import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAccess } from "@/lib/access";
import { prisma } from "@/lib/db";
import { planHasFloor, serializeTable } from "@/lib/floor";
import { allocateNextQueueNumber } from "@/lib/next-queue-number";
import { makePartyToken } from "@/lib/slug";
import { canAcceptSeating, recordSeating } from "@/lib/usage";

const schema = z.object({
  guestName: z.string().min(1).max(80),
  partySize: z.coerce.number().int().min(1).max(30),
  phone: z.string().min(8).max(20).optional(),
  notes: z.string().max(200).optional(),
});

/** Seat a walk-in directly onto a free table (no queue wait). */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    const body = schema.parse(await req.json());
    const table = await prisma.diningTable.findUnique({
      where: { id },
      include: {
        outlet: { include: { organization: { select: { id: true, plan: true } } } },
      },
    });
    if (!table) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const access = await requireOrgAccess(table.outlet.organizationId);
    if (!access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!planHasFloor(table.outlet.organization.plan)) {
      return NextResponse.json(
        { error: "Table floor requires Starter or Growth" },
        { status: 403 },
      );
    }
    if (table.status !== "free") {
      return NextResponse.json({ error: "Table is not free" }, { status: 400 });
    }

    const seating = await canAcceptSeating(table.outlet.organizationId);
    if (!seating.allowed) {
      return NextResponse.json(
        { error: "Monthly seating limit reached" },
        { status: 402 },
      );
    }

    const { queueNumber } = await allocateNextQueueNumber(table.outlet);
    const token = makePartyToken();
    const origin = new URL(req.url).origin;
    const positionUrl = `${origin}/q/${token}`;
    const now = new Date();

    const party = await prisma.$transaction(async (tx) => {
      const created = await tx.party.create({
        data: {
          token,
          queueNumber,
          guestName: body.guestName.trim(),
          partySize: body.partySize,
          phone: (body.phone || "walk-in").trim(),
          notes: body.notes?.trim() || null,
          status: "seated",
          seatedAt: now,
          positionLink: positionUrl,
          outletId: table.outletId,
        },
      });
      await tx.diningTable.update({
        where: { id: table.id },
        data: {
          status: "occupied",
          partyId: created.id,
          seatedAt: now,
          clearedAt: null,
        },
      });
      return created;
    });

    await recordSeating(table.outlet.organizationId);

    const updated = await prisma.diningTable.findUniqueOrThrow({
      where: { id: table.id },
      include: {
        party: {
          select: {
            id: true,
            queueNumber: true,
            guestName: true,
            partySize: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(
      { table: serializeTable(updated), partyId: party.id },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not seat walk-in" }, { status: 400 });
  }
}
