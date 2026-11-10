/**
 * Neon + Vercel: migrate deploy can hit P1002 advisory-lock timeouts when
 * multiple builds race or the DB is waking from cold start. Retry with a
 * longer lock wait.
 */
import { spawnSync } from "node:child_process";

process.env.PRISMA_SCHEMA_ENGINE_LOCK_TIMEOUT ??= "60000";

const maxAttempts = 5;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  console.log(
    `prisma migrate deploy (attempt ${attempt}/${maxAttempts}, lock timeout ${process.env.PRISMA_SCHEMA_ENGINE_LOCK_TIMEOUT}ms)`,
  );

  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  if (result.status === 0) {
    process.exit(0);
  }

  if (attempt === maxAttempts) {
    console.error("prisma migrate deploy failed after retries");
    process.exit(result.status ?? 1);
  }

  const waitMs = 3000 * attempt;
  console.warn(`migrate failed; waiting ${waitMs}ms before retry…`);
  await new Promise((r) => setTimeout(r, waitMs));
}
