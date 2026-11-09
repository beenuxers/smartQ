"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMarketSettings } from "./actions";

export function MarketForm({
  locale,
  country,
  currency,
  labels,
}: {
  locale: string;
  country: string;
  currency: string;
  labels: {
    title: string;
    billingCurrency: string;
    uiLanguage: string;
    save: string;
    saved: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateMarketSettings(formData);
      if (!result.ok) {
        setError(result.error || "Could not save");
        return;
      }
      setMessage(
        `${labels.saved}: ${result.locale.toUpperCase()} · ${result.country} · ${result.currency}`,
      );
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4">
      <h2 className="text-xl display">
        {labels.title}
      </h2>
      <label className="field">
        <span>Country / territory</span>
        <select name="country" defaultValue={country} key={`country-${country}`}>
          <option value="SG">Singapore</option>
          <option value="ID">Indonesia</option>
          <option value="MY">Malaysia</option>
        </select>
      </label>
      <label className="field">
        <span>{labels.billingCurrency}</span>
        <select name="currency" defaultValue={currency} key={`currency-${currency}`}>
          <option value="USD">USD (default)</option>
          <option value="SGD">SGD — Singapore</option>
          <option value="IDR">IDR — Indonesia</option>
          <option value="MYR">MYR — Malaysia</option>
          <option value="auto">Auto from territory</option>
        </select>
      </label>
      <label className="field">
        <span>{labels.uiLanguage}</span>
        <select name="locale" defaultValue={locale} key={`locale-${locale}`}>
          <option value="en">English</option>
          <option value="ms">Bahasa Melayu</option>
          <option value="id">Bahasa Indonesia</option>
        </select>
      </label>
      <p className="text-xs text-muted">
        Country preference order is Singapore → Indonesia → Malaysia. Language updates the host
        dashboard, guest join page, and settings labels.
      </p>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "…" : labels.save}
      </button>
    </form>
  );
}
