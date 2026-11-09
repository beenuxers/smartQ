import type { CurrencyCode, PlanId } from "./product";
import { currencyForTerritory } from "./product";

export type { PlanId, CurrencyCode };

export type PlanLimits = {
  outlets: number;
  staffSeats: number;
  seatingsPerMonth: number;
  whatsappPerMonth: number;
};

export type PlanPrice = {
  monthly: number;
  annualMonthly: number; // billed annually, shown as per-month equivalent (~20% off)
};

/**
 * USD is the source-of-truth list price.
 * Local amounts are fixed marketing prices (not live FX).
 */
export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    name: string;
    description: string;
    limits: PlanLimits;
    prices: Record<CurrencyCode, PlanPrice>;
  }
> = {
  free: {
    id: "free",
    name: "Free",
    description: "Try SmartQ at quiet cafes — limited seatings & WhatsApp.",
    limits: {
      outlets: 1,
      staffSeats: 1,
      seatingsPerMonth: 100,
      whatsappPerMonth: 50,
    },
    prices: {
      USD: { monthly: 0, annualMonthly: 0 },
      MYR: { monthly: 0, annualMonthly: 0 },
      SGD: { monthly: 0, annualMonthly: 0 },
      IDR: { monthly: 0, annualMonthly: 0 },
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "Single cafe or restaurant — fair-use WhatsApp included.",
    limits: {
      outlets: 1,
      staffSeats: 3,
      seatingsPerMonth: 1500,
      whatsappPerMonth: 3000,
    },
    prices: {
      USD: { monthly: 19, annualMonthly: 15 },
      MYR: { monthly: 79, annualMonthly: 63 },
      SGD: { monthly: 29, annualMonthly: 23 },
      IDR: { monthly: 149000, annualMonthly: 119000 },
    },
  },
  growth: {
    id: "growth",
    name: "Growth",
    description: "Busy outlets & small chains — more seats and WhatsApp.",
    limits: {
      outlets: 5,
      staffSeats: 10,
      seatingsPerMonth: 8000,
      whatsappPerMonth: 15000,
    },
    prices: {
      USD: { monthly: 39, annualMonthly: 31 },
      MYR: { monthly: 149, annualMonthly: 119 },
      SGD: { monthly: 49, annualMonthly: 39 },
      IDR: { monthly: 299000, annualMonthly: 239000 },
    },
  },
};

export const WHATSAPP_OVERAGE: Record<CurrencyCode, number> = {
  USD: 0.02,
  MYR: 0.08,
  SGD: 0.03,
  IDR: 250,
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  USD: "USD ($)",
  MYR: "MYR (RM)",
  SGD: "SGD (S$)",
  IDR: "IDR (Rp)",
};

export function formatMoney(amount: number, currency: CurrencyCode): string {
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US")}`;
  }
  if (currency === "IDR") {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  }
  if (currency === "SGD") {
    return `S$${amount.toLocaleString("en-SG")}`;
  }
  return `RM ${amount.toLocaleString("en-MY")}`;
}

export function getPlan(planId: string) {
  return PLANS[(planId as PlanId) in PLANS ? (planId as PlanId) : "free"];
}

export function resolveDisplayCurrency(input: {
  preferred?: string | null;
  country?: string | null;
  timeZone?: string | null;
}): CurrencyCode {
  const preferred = (input.preferred || "").toUpperCase();
  if (
    preferred === "USD" ||
    preferred === "MYR" ||
    preferred === "SGD" ||
    preferred === "IDR"
  ) {
    return preferred;
  }
  return currencyForTerritory({
    country: input.country,
    timeZone: input.timeZone,
  });
}
