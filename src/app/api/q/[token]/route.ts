import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPartiesAhead } from "@/lib/analytics";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const party = await prisma.party.findUnique({ where: { token } });
  if (!party) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const partiesAhead = await getPartiesAhead(party.outletId, party.queueNumber);
  return NextResponse.json({
    queueNumber: party.queueNumber,
    status: party.status,
    partiesAhead,
    guestName: party.guestName,
  });
}
