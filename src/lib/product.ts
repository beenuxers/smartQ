/**
 * SmartQ product positioning (locked)
 * SEA F&B WhatsApp + QR virtual waitlist — per-outlet subscription.
 */
export const PRODUCT = {
  name: "SmartQ",
  tagline: "Tables ready on WhatsApp",
  oneLiner:
    "Guests scan a QR, join a waitlist, and get called back on WhatsApp when their table is ready — no guest app, no hardware.",
  markets: ["SG", "ID", "MY"] as const,
  vertical: "fnb" as const,
  channels: ["qr", "whatsapp"] as const,
  /** List prices are authored in USD; local currencies are display options. */
  defaultCurrency: "USD" as const,
} as const;

export type CountryCode = (typeof PRODUCT.markets)[number];
export type LocaleCode = "en" | "ms" | "id";
export type PlanId = "free" | "starter" | "growth";
export type CurrencyCode = "USD" | "MYR" | "SGD" | "IDR";

export const CURRENCIES: CurrencyCode[] = ["USD", "SGD", "IDR", "MYR"];

/** Prefer this order in UI selects: Singapore → Indonesia → Malaysia. */
export const MARKET_ORDER: CountryCode[] = ["SG", "ID", "MY"];

export const COUNTRY_DEFAULTS: Record<
  CountryCode,
  {
    locale: LocaleCode;
    /** Suggested local currency for the territory (user can keep USD). */
    localCurrency: Exclude<CurrencyCode, "USD">;
    timezone: string;
    label: string;
  }
> = {
  SG: {
    locale: "en",
    localCurrency: "SGD",
    timezone: "Asia/Singapore",
    label: "Singapore",
  },
  ID: {
    locale: "id",
    localCurrency: "IDR",
    timezone: "Asia/Jakarta",
    label: "Indonesia",
  },
  MY: {
    locale: "en",
    localCurrency: "MYR",
    timezone: "Asia/Kuala_Lumpur",
    label: "Malaysia",
  },
};

/** Map timezone / country → suggested billing currency. Falls back to USD. */
export function currencyForTerritory(input: {
  country?: string | null;
  timeZone?: string | null;
}): CurrencyCode {
  const country = (input.country || "").toUpperCase();
  if (country === "SG") return "SGD";
  if (country === "ID") return "IDR";
  if (country === "MY") return "MYR";

  const tz = input.timeZone || "";
  if (tz === "Asia/Singapore") return "SGD";
  if (
    tz === "Asia/Jakarta" ||
    tz === "Asia/Makassar" ||
    tz === "Asia/Jayapura" ||
    tz === "Asia/Pontianak"
  ) {
    return "IDR";
  }
  if (tz === "Asia/Kuala_Lumpur" || tz === "Asia/Kuching") return "MYR";

  return "USD";
}
