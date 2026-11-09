import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const outlet = await prisma.outlet.findUnique({ where: { slug } });
  if (!outlet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const origin = new URL(req.url).origin;
  const joinUrl = `${origin}/join/${slug}`;
  const png = await QRCode.toBuffer(joinUrl, {
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#14352a", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
