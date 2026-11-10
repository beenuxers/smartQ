import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { serializeParty } from "@/lib/queue";

const patchSchema = z.object({
  guestName: z.string().min(1).max(80).optional(),
  partySize: z.coerce.number().int().min(1).max(30).optional(),
  phone: z.string().min(8).max(20).optional(),
  notes: z.string().max(200).nullable().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const party = await prisma.party.findUnique({
    where: { id },
    include: { outlet: true },
  });

  if (!party || party.outlet.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = patchSchema.parse(await req.json());
    const updated = await prisma.party.update({
      where: { id },
      data: {
        ...(body.guestName !== undefined
          ? { guestName: body.guestName.trim() }
          : {}),
        ...(body.partySize !== undefined ? { partySize: body.partySize } : {}),
        ...(body.phone !== undefined ? { phone: body.phone.trim() } : {}),
        ...(body.notes !== undefined
          ? { notes: body.notes?.trim() || null }
          : {}),
      },
    });
    return NextResponse.json(serializeParty(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update party" }, { status: 400 });
  }
}
