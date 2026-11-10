export type BillingProvider = "local" | "stripe" | "xendit" | "ipay88";

export function getBillingProvider(): BillingProvider {
  const raw = (process.env.BILLING_PROVIDER || "local").toLowerCase();
  if (raw === "stripe" || raw === "xendit" || raw === "ipay88") return raw;
  return "local";
}

export function isStripeBilling() {
  return getBillingProvider() === "stripe";
}
