import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  COUNTRY_DEFAULTS,
  type CountryCode,
  type CurrencyCode,
} from "@/lib/product";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { makeOutletSlug } from "@/lib/slug";
import { turnstileEnabled, verifyTurnstileToken } from "@/lib/turnstile";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  outletName: z.string().min(2),
  country: z.enum(["SG", "ID", "MY"]),
  /** Prefer USD; pass local or "auto" to use territory currency. */
  currency: z.enum(["USD", "SGD", "IDR", "MYR", "auto"]).default("USD"),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = await rateLimit({
      key: `register:ip:${ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: `Too many signups from this network. Try again in ${limited.retryAfterSec}s.`,
        },
        { status: 429 },
      );
    }

    const body = schema.parse(await req.json());

    const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!captcha.ok) {
      return NextResponse.json(
        { error: captcha.error || "Bot check failed" },
        { status: 400 },
      );
    }

    const email = body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    const country = body.country as CountryCode;
    const defaults = COUNTRY_DEFAULTS[country];
    const currency: CurrencyCode =
      body.currency === "auto" ? defaults.localCurrency : (body.currency as CurrencyCode);
    const passwordHash = await bcrypt.hash(body.password, 10);
    const slug = makeOutletSlug(body.outletName);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email,
        passwordHash,
        memberships: {
          create: {
            role: "owner",
            organization: {
              create: {
                name: body.outletName,
                country,
                locale: defaults.locale,
                currency,
                plan: "free",
                usageMonth: new Date().toISOString().slice(0, 7),
                outlets: {
                  create: {
                    name: body.outletName,
                    slug,
                    timezone: defaults.timezone,
                  },
                },
              },
            },
          },
        },
      },
      include: {
        memberships: {
          include: {
            organization: { include: { outlets: true } },
          },
        },
      },
    });

    const org = user.memberships[0].organization;
    return NextResponse.json({
      ok: true,
      email: user.email,
      organizationId: org.id,
      outletSlug: org.outlets[0]?.slug,
      turnstileRequired: turnstileEnabled(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Registration failed" }, { status: 400 });
  }
}
