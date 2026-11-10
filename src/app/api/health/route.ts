import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Public readiness probe — booleans only, never secret values.
 * Used to diagnose Vercel Configuration / env issues.
 */
export async function GET() {
  const env = {
    AUTH_SECRET: Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    AUTH_URL: Boolean(process.env.AUTH_URL || process.env.NEXTAUTH_URL),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    UPSTASH: Boolean(
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
    ),
    TURNSTILE: Boolean(
      process.env.TURNSTILE_SECRET_KEY &&
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    ),
  };

  let database: "ok" | "error" = "error";
  let databaseError: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch (err) {
    databaseError =
      err instanceof Error ? err.name : "unknown";
    console.error("health database check failed", err);
  }

  const ok = env.AUTH_SECRET && env.DATABASE_URL && database === "ok";
  return NextResponse.json(
    {
      ok,
      env,
      database,
      ...(databaseError ? { databaseError } : {}),
    },
    { status: ok ? 200 : 503 },
  );
}
