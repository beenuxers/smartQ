import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAccess } from "@/lib/access";
import { prisma } from "@/lib/db";
import { planHasFloor, serializeTable } from "@/lib/floor";

const createSchema = z.object({
  outletId: z.string().min(1),
  name: z.string().min(1).max(40),
  seats: z.coerce.number().int().min(1).max(50).default(2),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

export async function GET(req: Request) {
  const outletId = new URL(req.url).searchParams.get("outletId");
  if (!outletId) {
    return NextResponse.json({ error: "outletId required" }, { status: 400 });
  }

  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    include: { organization: { select: { plan: true } } },
  });
  if (!outlet) {
    return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
  }

  const access = await requireOrgAccess(outlet.organizationId);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!planHasFloor(outlet.organization.plan)) {
    return NextResponse.json(
      { error: "Table floor requires Starter or Growth" },
      { status: 403 },
    );
  }

  const tables = await prisma.diningTable.findMany({
    where: { outletId },
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
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ tables: tables.map(serializeTable) });
}

export async function POST(req: Request) {
  try {
    const body = createSchema.parse(await req.json());
    const outlet = await prisma.outlet.findUnique({
      where: { id: body.outletId },
      include: { organization: { select: { plan: true } } },
    });
    if (!outlet) {
      return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
    }

    const access = await requireOrgAccess(outlet.organizationId);
    if (!access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!planHasFloor(outlet.organization.plan)) {
      return NextResponse.json(
        { error: "Table floor requires Starter or Growth" },
        { status: 403 },
      );
    }

    const maxSort = await prisma.diningTable.aggregate({
      where: { outletId: outlet.id },
      _max: { sortOrder: true },
    });

    const table = await prisma.diningTable.create({
      data: {
        outletId: outlet.id,
        name: body.name.trim(),
        seats: body.seats,
        sortOrder: body.sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1,
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

    return NextResponse.json(serializeTable(table), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create table" }, { status: 400 });
  }
}
