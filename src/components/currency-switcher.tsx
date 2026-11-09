"use client";

import { useEffect, useState } from "react";
import { CURRENCIES, type CurrencyCode } from "@/lib/product";
import { CURRENCY_LABELS, resolveDisplayCurrency } from "@/lib/pricing";

const STORAGE_KEY = "smartq.currency";

export function useDisplayCurrency(initial?: CurrencyCode) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(initial ?? "USD");
  const [source, setSource] = useState<"manual" | "territory" | "default">(
    initial ? "default" : "default",
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (saved && CURRENCIES.includes(saved)) {
      setCurrencyState(saved);
      setSource("manual");
      return;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const detected = resolveDisplayCurrency({ timeZone });
    setCurrencyState(detected);
    setSource(detected === "USD" ? "default" : "territory");
  }, []);

  function setCurrency(next: CurrencyCode) {
    setCurrencyState(next);
    setSource("manual");
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  function useAutoDetect() {
    window.localStorage.removeItem(STORAGE_KEY);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const detected = resolveDisplayCurrency({ timeZone });
    setCurrencyState(detected);
    setSource(detected === "USD" ? "default" : "territory");
  }

  return { currency, setCurrency, useAutoDetect, source };
}

export function CurrencySwitcher({
  currency,
  onChange,
  onAuto,
  source,
}: {
  currency: CurrencyCode;
  onChange: (c: CurrencyCode) => void;
  onAuto: () => void;
  source: "manual" | "territory" | "default";
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="field min-w-[11rem]">
        <span className="text-xs uppercase tracking-[0.14em] text-muted">Currency</span>
        <select
          value={currency}
          onChange={(e) => onChange(e.target.value as CurrencyCode)}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {CURRENCY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="btn btn-secondary text-sm" onClick={onAuto}>
        Auto by territory
      </button>
      <span className="text-xs text-muted">
        {source === "manual"
          ? "Manual selection"
          : source === "territory"
            ? "Detected from your region"
            : "Default USD"}
      </span>
    </div>
  );
}
