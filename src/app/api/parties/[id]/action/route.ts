import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canSendWhatsApp, recordWhatsApp } from "@/lib/usage";
import { sendWhatsApp } from "@/lib/whatsapp";

const schema = z.object({
  action: z.enum(["notify", "seated", "no_show", "cancel", "restore"]),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = schema.parse(await req.json());

  const party = await prisma.party.findUnique({
    where: { id },
    include: { outlet: true },
  });

  if (!party || party.outlet.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.action === "notify") {
    const wa = await canSendWhatsApp(party.outlet.organizationId);
    let whatsapp: { ok: boolean; provider: string; skipped?: boolean } = {
      ok: false,
      provider: "none",
      skipped: true,
    };
    if (wa.allowed) {
      const sent = await sendWhatsApp({
        to: party.phone,
        kind: "table_ready",
        outletName: party.outlet.name,
        queueNumber: party.queueNumber,
        positionUrl: party.positionLink,
      });
      if (sent.ok) await recordWhatsApp(party.outlet.organizationId);
      whatsapp = { ok: sent.ok, provider: sent.provider };
    }

    const updated = await prisma.party.update({
      where: { id },
      data: { status: "notified", notifiedAt: new Date(), completedAt: null },
    });
    return NextResponse.json({ ...updated, whatsapp });
  }

  if (body.action === "seated") {
    const updated = await prisma.party.update({
      where: { id },
      data: {
        status: "seated",
        seatedAt: new Date(),
        completedAt: new Date(),
      },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "no_show") {
    const updated = await prisma.party.update({
      where: { id },
      data: { status: "no_show", completedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "cancel") {
    const updated = await prisma.party.update({
      where: { id },
      data: { status: "cancelled", completedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  // restore → back to waiting
  const updated = await prisma.party.update({
    where: { id },
    data: {
      status: "waiting",
      notifiedAt: null,
      seatedAt: null,
      completedAt: null,
    },
  });
  return NextResponse.json(updated);
}
