"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type PartyRow = {
  id: string;
  queueNumber: number;
  guestName: string;
  partySize: number;
  phone: string;
  notes: string | null;
  status: string;
  joinedAt: string;
};

export function HostWaitlist({
  initial,
  labels,
}: {
  initial: PartyRow[];
  labels: {
    notify: string;
    markSeated: string;
    markNoShow: string;
    emptyQueue: string;
    waiting: string;
    notified: string;
  };
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();

  async function act(id: string, action: "notify" | "seated" | "no_show") {
    const res = await fetch(`/api/parties/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) return;
    if (action === "notify") {
      setRows((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "notified" } : p)),
      );
    } else {
      setRows((prev) => prev.filter((p) => p.id !== id));
    }
    startTransition(() => router.refresh());
  }

  if (rows.length === 0) {
    return <div className="panel text-sm text-muted">{labels.emptyQueue}</div>;
  }

  return (
    <div className="space-y-3">
      {rows.map((party) => (
        <article
          key={party.id}
          className="panel flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="display text-2xl font-semibold tracking-tight">
                #{party.queueNumber}
              </span>
              <span className="badge">
                {party.status === "notified" ? labels.notified : labels.waiting}
              </span>
            </div>
            <div className="mt-1.5 font-medium">
              {party.guestName} · {party.partySize} pax
            </div>
            <div className="mt-0.5 text-sm text-muted">
              {party.phone}
              {party.notes ? ` · ${party.notes}` : ""}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-primary"
              disabled={pending}
              onClick={() => act(party.id, "notify")}
            >
              {labels.notify}
            </button>
            <button
              className="btn btn-secondary"
              disabled={pending}
              onClick={() => act(party.id, "seated")}
            >
              {labels.markSeated}
            </button>
            <button
              className="btn btn-secondary"
              disabled={pending}
              onClick={() => act(party.id, "no_show")}
            >
              {labels.markNoShow}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
