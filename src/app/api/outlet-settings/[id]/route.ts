import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAccess } from "@/lib/access";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2).optional(),
  activeSession: z.enum(["lunch", "dinner", "all"]).optional(),
  lunchStart: z.string().optional(),
  lunchEnd: z.string().optional(),
  dinnerStart: z.string().optional(),
  dinnerEnd: z.string().optional(),
  queueDayCutoff: z
    .string()
    .regex(/^\d{1,2}:\d{2}$/, "Use HH:mm")
    .optional(),
  timezone: z.string().min(3).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const outlet = await prisma.outlet.findUnique({ where: { id } });
  if (!outlet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = await requireOrgAccess(outlet.organizationId);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await req.json());
  const updated = await prisma.outlet.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(updated);
}
