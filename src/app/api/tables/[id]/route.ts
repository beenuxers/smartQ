import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAccess } from "@/lib/access";
import { prisma } from "@/lib/db";
import { planHasFloor, serializeTable } from "@/lib/floor";

const patchSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  seats: z.coerce.number().int().min(1).max(50).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  action: z.enum(["clear", "ready"]).optional(),
});

async function loadTable(id: string) {
  return prisma.diningTable.findUnique({
    where: { id },
    include: {
      outlet: { include: { organization: { select: { id: true, plan: true } } } },
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
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    const body = patchSchema.parse(await req.json());
    const table = await loadTable(id);
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

    if (body.action === "clear") {
      if (table.status !== "occupied") {
        return NextResponse.json(
          { error: "Table is not occupied" },
          { status: 400 },
        );
      }

      const now = new Date();
      await prisma.$transaction(async (tx) => {
        if (table.partyId) {
          await tx.party.update({
            where: { id: table.partyId },
            data: { completedAt: now },
          });
        }
        await tx.diningTable.update({
          where: { id: table.id },
          data: {
            status: "dirty",
            partyId: null,
            clearedAt: now,
            seatedAt: null,
          },
        });
      });

      const updated = await loadTable(id);
      return NextResponse.json(serializeTable(updated!));
    }

    if (body.action === "ready") {
      if (table.status !== "dirty" && table.status !== "free") {
        return NextResponse.json(
          { error: "Clear the table before marking ready" },
          { status: 400 },
        );
      }
      const updated = await prisma.diningTable.update({
        where: { id: table.id },
        data: {
          status: "free",
          partyId: null,
          seatedAt: null,
          clearedAt: null,
        },
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
      return NextResponse.json(serializeTable(updated));
    }

    const updated = await prisma.diningTable.update({
      where: { id: table.id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.seats !== undefined ? { seats: body.seats } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
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
    return NextResponse.json(serializeTable(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update table" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const table = await loadTable(id);
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
  if (table.status === "occupied") {
    return NextResponse.json(
      { error: "Cannot delete an occupied table" },
      { status: 400 },
    );
  }

  await prisma.diningTable.delete({ where: { id: table.id } });
  return NextResponse.json({ ok: true });
}
