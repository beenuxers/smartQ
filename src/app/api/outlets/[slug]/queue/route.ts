import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getQueueBoard, serializeParty } from "@/lib/queue";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await ctx.params;
  const outlet = await prisma.outlet.findUnique({ where: { slug } });
  if (!outlet || outlet.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const board = await getQueueBoard(outlet.id);
  return NextResponse.json({
    outletId: outlet.id,
    waiting: board.waiting.map(serializeParty),
    called: board.called.map(serializeParty),
    doneToday: board.doneToday.map(serializeParty),
  });
}
