"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type FloorTable = {
  id: string;
  outletId: string;
  name: string;
  seats: number;
  status: string;
  sortOrder: number;
  partyId: string | null;
  seatedAt: string | null;
  clearedAt: string | null;
  party: {
    id: string;
    queueNumber: number;
    guestName: string;
    partySize: number;
    phone: string;
  } | null;
};

export function FloorBoard({
  outletId,
  initialTables,
  labels,
}: {
  outletId: string;
  initialTables: FloorTable[];
  labels: {
    free: string;
    occupied: string;
    dirty: string;
    clear: string;
    ready: string;
    seatWalkIn: string;
    guestName: string;
    partySize: string;
    phone: string;
    close: string;
    seats: string;
    emptyFloor: string;
    actionFailed: string;
  };
}) {
  const router = useRouter();
  const [tables, setTables] = useState(initialTables);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [seatTableId, setSeatTableId] = useState<string | null>(null);

  useEffect(() => {
    setTables(initialTables);
  }, [initialTables]);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/tables?outletId=${outletId}`);
    if (!res.ok) return;
    const json = await res.json();
    setTables(json.tables);
  }, [outletId]);

  useEffect(() => {
    const id = setInterval(() => {
      void refresh();
    }, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  async function runAction(tableId: string, action: "clear" | "ready") {
    setMessage("");
    setBusy(true);
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || labels.actionFailed);
        return;
      }
      await refresh();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function seatWalkIn(payload: {
    guestName: string;
    partySize: number;
    phone: string;
  }) {
    if (!seatTableId) return;
    setMessage("");
    setBusy(true);
    try {
      const res = await fetch(`/api/tables/${seatTableId}/seat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || labels.actionFailed);
        return;
      }
      setSeatTableId(null);
      await refresh();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function statusLabel(status: string) {
    if (status === "occupied") return labels.occupied;
    if (status === "dirty") return labels.dirty;
    return labels.free;
  }

  if (tables.length === 0) {
    return <div className="panel text-sm text-muted">{labels.emptyFloor}</div>;
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => (
          <article
            key={table.id}
            className={`panel flex flex-col gap-3 ${
              table.status === "occupied"
                ? "ring-1 ring-[var(--accent)]"
                : table.status === "dirty"
                  ? "opacity-90"
                  : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="display text-2xl font-semibold">{table.name}</div>
                <div className="text-sm text-muted">
                  {labels.seats}: {table.seats}
                </div>
              </div>
              <span className="badge">{statusLabel(table.status)}</span>
            </div>

            {table.party ? (
              <div className="text-sm">
                <div className="font-medium">
                  #{table.party.queueNumber} · {table.party.guestName}
                </div>
                <div className="text-muted">
                  {table.party.partySize} pax · {table.party.phone}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted">—</div>
            )}

            <div className="mt-auto flex flex-wrap gap-2">
              {table.status === "occupied" ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => runAction(table.id, "clear")}
                >
                  {labels.clear}
                </button>
              ) : null}
              {table.status === "dirty" ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => runAction(table.id, "ready")}
                >
                  {labels.ready}
                </button>
              ) : null}
              {table.status === "free" ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => setSeatTableId(table.id)}
                >
                  {labels.seatWalkIn}
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {seatTableId ? (
        <SeatWalkInModal
          labels={labels}
          onClose={() => setSeatTableId(null)}
          onSubmit={seatWalkIn}
        />
      ) : null}
    </div>
  );
}

function SeatWalkInModal({
  labels,
  onClose,
  onSubmit,
}: {
  labels: {
    seatWalkIn: string;
    guestName: string;
    partySize: string;
    phone: string;
    close: string;
  };
  onClose: () => void;
  onSubmit: (payload: {
    guestName: string;
    partySize: number;
    phone: string;
  }) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    await onSubmit({
      guestName: String(form.get("guestName") || ""),
      partySize: Number(form.get("partySize") || 2),
      phone: String(form.get("phone") || "walk-in"),
    });
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div className="panel w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display text-2xl font-semibold">{labels.seatWalkIn}</h2>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {labels.close}
          </button>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="field">
            <span>{labels.guestName}</span>
            <input name="guestName" required />
          </label>
          <label className="field">
            <span>{labels.partySize}</span>
            <input name="partySize" type="number" min={1} max={30} defaultValue={2} required />
          </label>
          <label className="field">
            <span>{labels.phone}</span>
            <input name="phone" placeholder="+65…" />
          </label>
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "…" : labels.seatWalkIn}
          </button>
        </form>
      </div>
    </div>
  );
}
