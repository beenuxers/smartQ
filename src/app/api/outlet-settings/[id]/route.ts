import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2).optional(),
  activeSession: z.enum(["lunch", "dinner", "all"]).optional(),
  lunchStart: z.string().optional(),
  lunchEnd: z.string().optional(),
  dinnerStart: z.string().optional(),
  dinnerEnd: z.string().optional(),
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
  const outlet = await prisma.outlet.findUnique({ where: { id } });
  if (!outlet || outlet.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = schema.parse(await req.json());
  const updated = await prisma.outlet.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(updated);
}
