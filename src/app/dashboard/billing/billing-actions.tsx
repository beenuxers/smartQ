"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BillingActions({
  plan,
  active,
}: {
  plan: "free" | "starter" | "growth";
  active: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function moveToFree() {
    setLoading(true);
    const res = await fetch("/api/billing/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "free", billingCycle: "monthly" }),
    });
    const data = await res.json();
    setLoading(false);
    setMsg(data.message || (res.ok ? "Updated" : data.error || "Failed"));
    if (res.ok) router.refresh();
  }

  if (active) {
    return <p className="mt-4 text-sm text-success">Active plan</p>;
  }

  if (plan === "free") {
    return (
      <div className="mt-4 space-y-2">
        <button className="btn btn-secondary w-full" disabled={loading} onClick={moveToFree}>
          Switch to Free
        </button>
        {msg ? <p className="text-xs text-muted">{msg}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <Link
        className="btn btn-primary w-full"
        href={`/dashboard/billing/checkout?plan=${plan}&cycle=monthly`}
      >
        Pay monthly
      </Link>
      <Link
        className="btn btn-secondary w-full"
        href={`/dashboard/billing/checkout?plan=${plan}&cycle=annual`}
      >
        Pay annual (−20%)
      </Link>
    </div>
  );
}
