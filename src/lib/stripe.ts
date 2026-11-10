import Stripe from "stripe";
import type { CurrencyCode } from "./product";

let stripe: Stripe | null = null;

export function getStripe() {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (key.includes("…") || /\.\.\.$/.test(key) || key.length < 20) {
    throw new Error(
      "STRIPE_SECRET_KEY looks truncated/placeholder — paste the full sk_test_ key from Stripe",
    );
  }
  if (!stripe) {
    stripe = new Stripe(key, {
      apiVersion: "2025-10-29.clover" as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return stripe;
}

/** Stripe expects the smallest currency unit (cents), except zero-decimal currencies like IDR. */
export function toStripeUnitAmount(amount: number, currency: CurrencyCode) {
  if (currency === "IDR") return Math.round(amount);
  return Math.round(amount * 100);
}

export function appBaseUrl() {
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
