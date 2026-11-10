import { NextResponse } from "next/server";
import { requireOutletAccess } from "@/lib/access";
import { getQueueBoard, serializeParty } from "@/lib/queue";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const { outlet, access } = await requireOutletAccess({ slug });
  if (!outlet || !access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const board = await getQueueBoard(outlet.id, {
    timezone: outlet.timezone,
    queueDayCutoff: outlet.queueDayCutoff,
  });
  return NextResponse.json({
    outletId: outlet.id,
    waiting: board.waiting.map(serializeParty),
    called: board.called.map(serializeParty),
    dining: board.dining.map(serializeParty),
    doneToday: board.doneToday.map(serializeParty),
  });
}
