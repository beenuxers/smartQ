"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type PartyRow = {
  id: string;
  queueNumber: number;
  guestName: string;
  partySize: number;
  phone: string;
  notes: string | null;
  status: string;
  joinedAt: string;
  notifiedAt?: string | null;
  seatedAt?: string | null;
  completedAt?: string | null;
  positionLink?: string;
  waitMinutes: number;
};

type Tab = "waiting" | "called" | "dining" | "done";

export type HostQueueLabels = {
  notify: string;
  notifyAgain: string;
  markSeated: string;
  markNoShow: string;
  cancel: string;
  restore: string;
  emptyQueue: string;
  emptyCalled: string;
  emptyDone: string;
  emptyDining: string;
  waiting: string;
  notified: string;
  seated: string;
  noShow: string;
  cancelled: string;
  tabWaiting: string;
  tabCalled: string;
  tabDining: string;
  tabDone: string;
  waitMins: string;
  addWalkIn: string;
  viewEdit: string;
  save: string;
  close: string;
  guestName: string;
  partySize: string;
  phone: string;
  notes: string;
  notifyOk: string;
  notifySkipped: string;
  notifyFailed: string;
  actionFailed: string;
  assignTable: string;
  seatToTable: string;
  seatWithoutTable: string;
  finishDining: string;
  tableSeats: string;
  preferredFit: string;
  noFreeTables: string;
};

type FreeTableOption = {
  id: string;
  name: string;
  seats: number;
};

export function HostWaitlist({
  outletId,
  outletSlug,
  initialWaiting,
  initialCalled,
  initialDining = [],
  initialDone,
  floorEnabled = false,
  labels,
}: {
  outletId: string;
  outletSlug: string;
  initialWaiting: PartyRow[];
  initialCalled: PartyRow[];
  initialDining?: PartyRow[];
  initialDone: PartyRow[];
  floorEnabled?: boolean;
  labels: HostQueueLabels;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("waiting");
  const [waiting, setWaiting] = useState(initialWaiting);
  const [called, setCalled] = useState(initialCalled);
  const [dining, setDining] = useState(initialDining);
  const [done, setDone] = useState(initialDone);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [seatParty, setSeatParty] = useState<PartyRow | null>(null);
  const [freeTables, setFreeTables] = useState<FreeTableOption[]>([]);

  const applyBoard = useCallback(
    (board: {
      waiting: PartyRow[];
      called: PartyRow[];
      dining?: PartyRow[];
      doneToday: PartyRow[];
    }) => {
      setWaiting(board.waiting);
      setCalled(board.called);
      setDining(board.dining ?? []);
      setDone(board.doneToday);
    },
    [],
  );

  const refreshBoard = useCallback(async () => {
    const res = await fetch(`/api/outlets/${outletSlug}/queue`);
    if (!res.ok) return;
    const json = await res.json();
    applyBoard(json);
    startTransition(() => router.refresh());
  }, [applyBoard, outletSlug, router]);

  useEffect(() => {
    setWaiting(initialWaiting);
    setCalled(initialCalled);
    setDining(initialDining);
    setDone(initialDone);
  }, [initialWaiting, initialCalled, initialDining, initialDone]);

  useEffect(() => {
    const id = setInterval(() => {
      void refreshBoard();
    }, 5000);
    return () => clearInterval(id);
  }, [refreshBoard]);

  const selected = useMemo(() => {
    const all = [...waiting, ...called, ...dining, ...done];
    return all.find((p) => p.id === selectedId) ?? null;
  }, [waiting, called, dining, done, selectedId]);

  const rows =
    tab === "waiting"
      ? waiting
      : tab === "called"
        ? called
        : tab === "dining"
          ? dining
          : done;

  async function act(
    id: string,
    action: "notify" | "seated" | "no_show" | "cancel" | "restore" | "finish",
    tableId?: string,
  ) {
    setMessage("");
    const res = await fetch(`/api/parties/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...(tableId ? { tableId } : {}) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || labels.actionFailed);
      return;
    }
    if (action === "notify") {
      if (data.whatsapp?.skipped) setMessage(labels.notifySkipped);
      else if (data.whatsapp?.ok) setMessage(labels.notifyOk);
      else setMessage(labels.notifyFailed);
    }
    setSeatParty(null);
    await refreshBoard();
  }

  /** Optional: seat onto a free table (Starter+ with tables configured). */
  async function openSeatPicker(party: PartyRow) {
    const res = await fetch(`/api/tables?outletId=${outletId}`);
    if (!res.ok) {
      setMessage(labels.actionFailed);
      return;
    }
    const json = await res.json();
    const free = (json.tables as Array<{ id: string; name: string; seats: number; status: string }>)
      .filter((t) => t.status === "free")
      .map((t) => ({ id: t.id, name: t.name, seats: t.seats }));
    if (free.length === 0) {
      setMessage(labels.noFreeTables);
      return;
    }
    setFreeTables(free);
    setSeatParty(party);
  }

  async function saveParty(payload: {
    guestName: string;
    partySize: number;
    phone: string;
    notes: string;
  }) {
    if (!selectedId) return;
    const res = await fetch(`/api/parties/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestName: payload.guestName,
        partySize: payload.partySize,
        phone: payload.phone,
        notes: payload.notes || null,
      }),
    });
    if (!res.ok) {
      setMessage(labels.actionFailed);
      return;
    }
    await refreshBoard();
    setMessage(labels.save);
  }

  async function addWalkIn(payload: {
    guestName: string;
    partySize: number;
    phone: string;
    notes: string;
  }) {
    setMessage("");
    const res = await fetch("/api/parties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId,
        guestName: payload.guestName,
        partySize: payload.partySize,
        phone: payload.phone,
        notes: payload.notes || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || labels.actionFailed);
      return;
    }
    setShowWalkIn(false);
    setTab("waiting");
    await refreshBoard();
  }

  function statusLabel(status: string) {
    if (status === "notified") return labels.notified;
    if (status === "seated") return labels.seated;
    if (status === "no_show") return labels.noShow;
    if (status === "cancelled") return labels.cancelled;
    return labels.waiting;
  }

  const empty =
    tab === "waiting"
      ? labels.emptyQueue
      : tab === "called"
        ? labels.emptyCalled
        : tab === "dining"
          ? labels.emptyDining
          : labels.emptyDone;

  const tabs: Array<[Tab, string, number]> = [
    ["waiting", labels.tabWaiting, waiting.length],
    ["called", labels.tabCalled, called.length],
  ];
  if (floorEnabled || dining.length > 0) {
    tabs.push(["dining", labels.tabDining, dining.length]);
  }
  tabs.push(["done", labels.tabDone, done.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              className={`btn ${tab === key ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setTab(key)}
            >
              {label} ({count})
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowWalkIn(true)}>
          {labels.addWalkIn}
        </button>
      </div>

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      {rows.length === 0 ? (
        <div className="panel text-sm text-muted">{empty}</div>
      ) : (
        <div className="space-y-3">
          {rows.map((party) => (
            <article
              key={party.id}
              className="panel flex flex-wrap items-center justify-between gap-4"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => setSelectedId(party.id)}
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="display text-2xl font-semibold tracking-tight">
                    #{party.queueNumber}
                  </span>
                  <span className="badge">{statusLabel(party.status)}</span>
                  <span className="text-xs text-muted">
                    {party.waitMinutes}m {labels.waitMins}
                  </span>
                </div>
                <div className="mt-1.5 font-medium">
                  {party.guestName} · {party.partySize} pax
                </div>
                <div className="mt-0.5 text-sm text-muted">
                  {party.phone}
                  {party.notes ? ` · ${party.notes}` : ""}
                </div>
                <div className="mt-1 text-xs text-accent-dark">{labels.viewEdit}</div>
              </button>
              <div className="flex flex-wrap gap-2">
                {tab === "done" ? (
                  <button
                    className="btn btn-secondary"
                    disabled={pending}
                    onClick={() => act(party.id, "restore")}
                  >
                    {labels.restore}
                  </button>
                ) : tab === "dining" ? (
                  <>
                    <button
                      className="btn btn-primary"
                      disabled={pending}
                      onClick={() => act(party.id, "finish")}
                    >
                      {labels.finishDining}
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={pending}
                      onClick={() => act(party.id, "restore")}
                    >
                      {labels.restore}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-primary"
                      disabled={pending}
                      onClick={() => act(party.id, "notify")}
                    >
                      {party.status === "notified" ? labels.notifyAgain : labels.notify}
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={pending}
                      onClick={() => act(party.id, "seated")}
                    >
                      {labels.markSeated}
                    </button>
                    {floorEnabled ? (
                      <button
                        className="btn btn-secondary"
                        disabled={pending}
                        onClick={() => openSeatPicker(party)}
                      >
                        {labels.seatToTable}
                      </button>
                    ) : null}
                    <button
                      className="btn btn-secondary"
                      disabled={pending}
                      onClick={() => act(party.id, "no_show")}
                    >
                      {labels.markNoShow}
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={pending}
                      onClick={() => act(party.id, "cancel")}
                    >
                      {labels.cancel}
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {selected ? (
        <PartyDrawer
          party={selected}
          labels={labels}
          onClose={() => setSelectedId(null)}
          onSave={saveParty}
        />
      ) : null}

      {showWalkIn ? (
        <WalkInModal
          labels={labels}
          onClose={() => setShowWalkIn(false)}
          onSubmit={addWalkIn}
        />
      ) : null}

      {seatParty ? (
        <TablePickerModal
          party={seatParty}
          tables={freeTables}
          labels={labels}
          onClose={() => setSeatParty(null)}
          onPick={(tableId) => act(seatParty.id, "seated", tableId)}
          onSkip={() => act(seatParty.id, "seated")}
        />
      ) : null}
    </div>
  );
}

function TablePickerModal({
  party,
  tables,
  labels,
  onClose,
  onPick,
  onSkip,
}: {
  party: PartyRow;
  tables: FreeTableOption[];
  labels: HostQueueLabels;
  onClose: () => void;
  onPick: (tableId: string) => Promise<void>;
  onSkip: () => Promise<void>;
}) {
  const preferred = tables.filter((t) => t.seats >= party.partySize);
  const others = tables.filter((t) => t.seats < party.partySize);
  const [busy, setBusy] = useState(false);

  async function pick(id: string) {
    setBusy(true);
    await onPick(id);
    setBusy(false);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div className="panel w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="display text-2xl font-semibold">{labels.assignTable}</h2>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {labels.close}
          </button>
        </div>
        <p className="text-sm text-muted">
          #{party.queueNumber} · {party.guestName} · {party.partySize} pax
        </p>

        {preferred.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-muted">
              {labels.preferredFit}
            </div>
            {preferred.map((t) => (
              <button
                key={t.id}
                type="button"
                className="btn btn-primary w-full justify-between"
                disabled={busy}
                onClick={() => pick(t.id)}
              >
                <span>{t.name}</span>
                <span className="text-sm opacity-80">
                  {labels.tableSeats}: {t.seats}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {others.length > 0 ? (
          <div className="space-y-2">
            {others.map((t) => (
              <button
                key={t.id}
                type="button"
                className="btn btn-secondary w-full justify-between"
                disabled={busy}
                onClick={() => pick(t.id)}
              >
                <span>{t.name}</span>
                <span className="text-sm opacity-80">
                  {labels.tableSeats}: {t.seats}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          className="btn btn-secondary w-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onSkip();
            setBusy(false);
          }}
        >
          {labels.seatWithoutTable}
        </button>
      </div>
    </div>
  );
}

function PartyDrawer({
  party,
  labels,
  onClose,
  onSave,
}: {
  party: PartyRow;
  labels: HostQueueLabels;
  onClose: () => void;
  onSave: (payload: {
    guestName: string;
    partySize: number;
    phone: string;
    notes: string;
  }) => Promise<void>;
}) {
  const [guestName, setGuestName] = useState(party.guestName);
  const [partySize, setPartySize] = useState(String(party.partySize));
  const [phone, setPhone] = useState(party.phone);
  const [notes, setNotes] = useState(party.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGuestName(party.guestName);
    setPartySize(String(party.partySize));
    setPhone(party.phone);
    setNotes(party.notes ?? "");
  }, [party]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      guestName,
      partySize: Number(partySize),
      phone,
      notes,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        className="panel m-0 h-full w-full max-w-md overflow-y-auto rounded-none border-0 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display text-2xl font-semibold">#{party.queueNumber}</h2>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {labels.close}
          </button>
        </div>
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="field">
            <span>{labels.guestName}</span>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
          </label>
          <label className="field">
            <span>{labels.partySize}</span>
            <input
              type="number"
              min={1}
              max={30}
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>{labels.phone}</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>
          <label className="field">
            <span>{labels.notes}</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </label>
          <p className="text-xs text-muted">
            {party.waitMinutes}m {labels.waitMins} · {party.status}
          </p>
          <button className="btn btn-primary w-full" disabled={saving}>
            {saving ? "…" : labels.save}
          </button>
        </form>
      </aside>
    </div>
  );
}

function WalkInModal({
  labels,
  onClose,
  onSubmit,
}: {
  labels: HostQueueLabels;
  onClose: () => void;
  onSubmit: (payload: {
    guestName: string;
    partySize: number;
    phone: string;
    notes: string;
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
      phone: String(form.get("phone") || ""),
      notes: String(form.get("notes") || ""),
    });
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="panel w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display text-2xl font-semibold">{labels.addWalkIn}</h2>
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
            <input name="phone" required placeholder="+65…" />
          </label>
          <label className="field">
            <span>{labels.notes}</span>
            <input name="notes" />
          </label>
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "…" : labels.addWalkIn}
          </button>
        </form>
      </div>
    </div>
  );
}
