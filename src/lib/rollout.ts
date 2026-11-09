import type { CountryCode, LocaleCode } from "./product";
import { COUNTRY_DEFAULTS, MARKET_ORDER } from "./product";

/**
 * Country preference / rollout order: Singapore → Indonesia → Malaysia.
 */
export const ROLLOUT_ORDER: CountryCode[] = [...MARKET_ORDER];

export const PAYMENT_PROVIDERS: Record<
  CountryCode,
  { primary: string; notes: string }
> = {
  SG: {
    primary: "stripe",
    notes: "Stripe for SGD cards",
  },
  ID: {
    primary: "xendit",
    notes: "Xendit / Midtrans for IDR",
  },
  MY: {
    primary: "ipay88",
    notes: "iPay88 / local FPX for MYR subscriptions",
  },
};

export function defaultsForCountry(country: CountryCode) {
  return COUNTRY_DEFAULTS[country];
}

export function supportedLocales(): LocaleCode[] {
  return ["en", "ms", "id"];
}
