"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CheckoutForm({
  plan,
  billingCycle,
  amountLabel,
  provider,
}: {
  plan: "starter" | "growth";
  billingCycle: "monthly" | "annual";
  amountLabel: string;
  provider: "local" | "stripe";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startStripeCheckout() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/billing/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billingCycle }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok || !data.url) {
      setError(data.error || "Could not start Stripe Checkout");
      return;
    }

    window.location.href = data.url as string;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (provider === "stripe") {
      await startStripeCheckout();
      return;
    }

    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/billing/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        billingCycle,
        cardNumber: form.get("cardNumber"),
        cardName: form.get("cardName"),
        expiry: form.get("expiry"),
        cvc: form.get("cvc"),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Payment failed");
      return;
    }

    router.push(
      `/dashboard/billing/success?paymentId=${data.paymentId}&plan=${data.plan}`,
    );
    router.refresh();
  }

  if (provider === "stripe") {
    return (
      <div className="panel space-y-4">
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={loading}
          onClick={startStripeCheckout}
        >
          {loading ? "Redirecting to Stripe…" : `Pay ${amountLabel} with Stripe`}
        </button>
        <p className="text-xs text-muted">
          You&apos;ll complete payment on Stripe&apos;s secure checkout page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4">
      <label className="field">
        <span>Name on card</span>
        <input name="cardName" required placeholder="Ada Host" autoComplete="cc-name" />
      </label>
      <label className="field">
        <span>Card number</span>
        <input
          name="cardNumber"
          required
          inputMode="numeric"
          placeholder="4242 4242 4242 4242"
          autoComplete="cc-number"
          defaultValue="4242424242424242"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="field">
          <span>Expiry</span>
          <input name="expiry" required placeholder="12/30" autoComplete="cc-exp" defaultValue="12/30" />
        </label>
        <label className="field">
          <span>CVC</span>
          <input name="cvc" required placeholder="123" autoComplete="cc-csc" defaultValue="123" />
        </label>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Processing…" : `Pay ${amountLabel}`}
      </button>
    </form>
  );
}
