import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAccess } from "@/lib/access";
import { prisma } from "@/lib/db";
import { planHasFloor } from "@/lib/floor";
import { canSendWhatsApp, recordWhatsApp } from "@/lib/usage";
import { sendWhatsApp } from "@/lib/whatsapp";

const schema = z.object({
  action: z.enum(["notify", "seated", "no_show", "cancel", "restore", "finish"]),
  tableId: z.string().min(1).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = schema.parse(await req.json());

  const party = await prisma.party.findUnique({
    where: { id },
    include: {
      outlet: { include: { organization: { select: { plan: true } } } },
      diningTable: true,
    },
  });

  if (!party) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = await requireOrgAccess(party.outlet.organizationId);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const now = new Date();

    if (body.tableId) {
      if (!planHasFloor(party.outlet.organization.plan)) {
        return NextResponse.json(
          { error: "Table floor requires Starter or Growth" },
          { status: 403 },
        );
      }

      const table = await prisma.diningTable.findFirst({
        where: { id: body.tableId, outletId: party.outletId },
      });
      if (!table) {
        return NextResponse.json({ error: "Table not found" }, { status: 404 });
      }
      if (table.status !== "free") {
        return NextResponse.json({ error: "Table is not free" }, { status: 400 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const p = await tx.party.update({
          where: { id },
          data: {
            status: "seated",
            seatedAt: now,
            completedAt: null,
          },
        });
        await tx.diningTable.update({
          where: { id: table.id },
          data: {
            status: "occupied",
            partyId: p.id,
            seatedAt: now,
            clearedAt: null,
          },
        });
        return p;
      });
      return NextResponse.json(updated);
    }

    // Seat without table — still dining until host taps Finish.
    const updated = await prisma.party.update({
      where: { id },
      data: {
        status: "seated",
        seatedAt: now,
        completedAt: null,
      },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "finish") {
    // End dining from waitlist (no Floor required). Linked table → dirty.
    if (party.status !== "seated") {
      return NextResponse.json(
        { error: "Party is not seated" },
        { status: 400 },
      );
    }
    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      if (party.diningTable) {
        await tx.diningTable.update({
          where: { id: party.diningTable.id },
          data: {
            status: "dirty",
            partyId: null,
            clearedAt: now,
            seatedAt: null,
          },
        });
      }
      return tx.party.update({
        where: { id },
        data: {
          status: "finished",
          completedAt: now,
          seatedAt: party.seatedAt ?? now,
        },
      });
    });
    return NextResponse.json(updated);
  }

  if (body.action === "no_show" || body.action === "cancel") {
    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      if (party.diningTable) {
        await tx.diningTable.update({
          where: { id: party.diningTable.id },
          data: {
            status: "dirty",
            partyId: null,
            clearedAt: now,
            seatedAt: null,
          },
        });
      }
      return tx.party.update({
        where: { id },
        data: {
          status: body.action === "no_show" ? "no_show" : "cancelled",
          completedAt: now,
        },
      });
    });
    return NextResponse.json(updated);
  }

  // restore → back to waiting; release table if still linked
  if (party.diningTable) {
    await prisma.diningTable.update({
      where: { id: party.diningTable.id },
      data: {
        status: "free",
        partyId: null,
        seatedAt: null,
        clearedAt: null,
      },
    });
  }

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
