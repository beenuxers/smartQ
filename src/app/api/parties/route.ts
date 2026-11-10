import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAccess } from "@/lib/access";
import { getPartiesAhead } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { serializeParty } from "@/lib/queue";
import { canAcceptSeating, canSendWhatsApp, recordSeating, recordWhatsApp } from "@/lib/usage";
import { isWithinSession } from "@/lib/session-hours";
import { allocateNextQueueNumber } from "@/lib/next-queue-number";
import { makePartyToken } from "@/lib/slug";
import { sendWhatsApp } from "@/lib/whatsapp";

const schema = z.object({
  outletId: z.string().min(1),
  guestName: z.string().min(1).max(80),
  partySize: z.coerce.number().int().min(1).max(30),
  phone: z.string().min(8).max(20),
  notes: z.string().max(200).optional(),
  sendJoinedMessage: z.boolean().optional().default(true),
});

/** Host walk-in: create a party on an owned outlet (or platform admin support). */
export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const outlet = await prisma.outlet.findUnique({
      where: { id: body.outletId },
      include: { organization: true },
    });

    if (!outlet) {
      return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
    }

    const access = await requireOrgAccess(outlet.organizationId);
    if (!access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!outlet.isActive) {
      return NextResponse.json({ error: "Outlet is inactive" }, { status: 403 });
    }

    if (
      !isWithinSession({
        activeSession: outlet.activeSession,
        lunchStart: outlet.lunchStart,
        lunchEnd: outlet.lunchEnd,
        dinnerStart: outlet.dinnerStart,
        dinnerEnd: outlet.dinnerEnd,
      })
    ) {
      return NextResponse.json(
        { error: "Waitlist is closed for this session" },
        { status: 403 },
      );
    }

    const seating = await canAcceptSeating(outlet.organizationId);
    if (!seating.allowed) {
      return NextResponse.json(
        { error: "Monthly seating limit reached" },
        { status: 402 },
      );
    }

    const { queueNumber } = await allocateNextQueueNumber(outlet);
    const token = makePartyToken();
    const origin = new URL(req.url).origin;
    const positionUrl = `${origin}/q/${token}`;

    const party = await prisma.party.create({
      data: {
        token,
        queueNumber,
        guestName: body.guestName.trim(),
        partySize: body.partySize,
        phone: body.phone.trim(),
        notes: body.notes?.trim() || null,
        positionLink: positionUrl,
        outletId: outlet.id,
      },
    });

    await recordSeating(outlet.organizationId);

    if (body.sendJoinedMessage) {
      const ahead = await getPartiesAhead(outlet.id, queueNumber);
      const wa = await canSendWhatsApp(outlet.organizationId);
      if (wa.allowed) {
        await sendWhatsApp({
          to: party.phone,
          kind: "joined",
          outletName: outlet.name,
          queueNumber,
          positionUrl,
          partiesAhead: ahead,
        });
        await recordWhatsApp(outlet.organizationId);
      }
    }

    return NextResponse.json(serializeParty(party), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not add walk-in" }, { status: 400 });
  }
}
