"use client";

import Link from "next/link";
import { PLANS, WHATSAPP_OVERAGE, formatMoney } from "@/lib/pricing";
import { CurrencySwitcher, useDisplayCurrency } from "@/components/currency-switcher";

export function PricingCards() {
  const { currency, setCurrency, useAutoDetect, source } = useDisplayCurrency("USD");

  return (
    <>
      <div className="mt-8 panel">
        <CurrencySwitcher
          currency={currency}
          onChange={setCurrency}
          onAuto={useAutoDetect}
          source={source}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {(["free", "starter", "growth"] as const).map((id) => {
          const plan = PLANS[id];
          const price = plan.prices[currency];
          const featured = id === "starter";
          return (
            <article
              key={id}
              className={`panel flex flex-col ${featured ? "ring-2 ring-[var(--accent)]" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="badge">{plan.name}</div>
                {featured ? (
                  <span className="text-xs font-medium text-accent">Most common</span>
                ) : null}
              </div>
              <h2 className="display mt-4 text-xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-sm text-muted">{plan.description}</p>
              <div className="mt-6">
                <div className="display text-3xl font-semibold">
                  {formatMoney(price.monthly, currency)}
                  <span className="text-base font-normal text-muted">/mo</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  or {formatMoney(price.annualMonthly, currency)}/mo billed annually
                </p>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-muted">
                <li>Up to {plan.limits.outlets} outlet(s)</li>
                <li>{plan.limits.staffSeats} staff seats</li>
                <li>{plan.limits.seatingsPerMonth.toLocaleString()} seatings / mo</li>
                <li>{plan.limits.whatsappPerMonth.toLocaleString()} WhatsApp msgs / mo</li>
              </ul>
              <Link href="/register" className="btn btn-primary mt-auto w-full pt-6">
                Choose {plan.name}
              </Link>
            </article>
          );
        })}
      </div>

      <div className="panel mt-6">
        <h3 className="display text-lg font-semibold">WhatsApp overage</h3>
        <p className="mt-2 text-sm text-muted">
          After your monthly allowance: {formatMoney(WHATSAPP_OVERAGE[currency], currency)} per
          message in {currency}.
        </p>
      </div>
    </>
  );
}
