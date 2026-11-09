"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n";

export function JoinForm({
  slug,
  labels,
}: {
  slug: string;
  labels: Messages;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/outlets/${slug}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestName: form.get("guestName"),
        partySize: form.get("partySize"),
        phone: form.get("phone"),
        notes: form.get("notes") || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not join");
      return;
    }
    router.push(`/q/${data.token}`);
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4">
      <label className="field">
        <span>{labels.guestName}</span>
        <input name="guestName" required autoComplete="name" />
      </label>
      <label className="field">
        <span>{labels.partySize}</span>
        <input name="partySize" type="number" min={1} max={30} defaultValue={2} required />
      </label>
      <label className="field">
        <span>{labels.phone}</span>
        <input
          name="phone"
          type="tel"
          required
          placeholder="60123456789"
          inputMode="tel"
        />
      </label>
      <label className="field">
        <span>{labels.notes}</span>
        <textarea name="notes" rows={2} placeholder="High chair, window seat…" />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? "…" : labels.joinQueue}
      </button>
    </form>
  );
}
