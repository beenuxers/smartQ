import type { CurrencyCode, PlanId } from "./product";
import { PLANS } from "./pricing";

/** Stripe-like test cards for the mock checkout. */
export const TEST_CARDS = {
  success: "4242424242424242",
  decline: "4000000000000002",
} as const;

export function normalizeCardNumber(raw: string) {
  return raw.replace(/\D/g, "");
}

export function amountForPlan(
  plan: PlanId,
  billingCycle: "monthly" | "annual",
  currency: CurrencyCode,
) {
  const price = PLANS[plan].prices[currency];
  if (billingCycle === "annual") {
    // Charge 12 × annualMonthly equivalent
    return Math.round(price.annualMonthly * 12);
  }
  return price.monthly;
}

export function simulateCardCharge(cardNumber: string): {
  ok: boolean;
  reason?: string;
  last4: string;
} {
  const digits = normalizeCardNumber(cardNumber);
  const last4 = digits.slice(-4) || "0000";

  if (digits.length < 13) {
    return { ok: false, reason: "Card number too short", last4 };
  }
  if (digits === TEST_CARDS.decline) {
    return { ok: false, reason: "Card declined (test)", last4 };
  }
  if (digits === TEST_CARDS.success || digits.startsWith("4242")) {
    return { ok: true, last4 };
  }
  // Any other plausible number succeeds in test mode
  if (digits.length >= 15) {
    return { ok: true, last4 };
  }
  return { ok: false, reason: "Invalid card", last4 };
}
