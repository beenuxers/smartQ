"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TableRow = {
  id: string;
  name: string;
  seats: number;
  status: string;
  sortOrder: number;
};

export function TablesPanel({
  outletId,
  initialTables,
  floorEnabled,
  labels,
}: {
  outletId: string;
  initialTables: TableRow[];
  floorEnabled: boolean;
  labels: {
    title: string;
    add: string;
    name: string;
    seats: string;
    save: string;
    remove: string;
    upgrade: string;
    upgradeHint: string;
    free: string;
    occupied: string;
    dirty: string;
    actionFailed: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tables, setTables] = useState(initialTables);
  const [message, setMessage] = useState("");

  if (!floorEnabled) {
    return (
      <section className="panel space-y-3">
        <h2 className="text-xl display">{labels.title}</h2>
        <p className="text-sm text-muted">{labels.upgradeHint}</p>
        <Link href="/dashboard/billing" className="btn btn-primary inline-flex">
          {labels.upgrade}
        </Link>
      </section>
    );
  }

  async function refresh() {
    const res = await fetch(`/api/tables?outletId=${outletId}`);
    if (!res.ok) return;
    const json = await res.json();
    setTables(
      json.tables.map((t: TableRow) => ({
        id: t.id,
        name: t.name,
        seats: t.seats,
        status: t.status,
        sortOrder: t.sortOrder,
      })),
    );
    startTransition(() => router.refresh());
  }

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setMessage("");
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId,
        name: String(fd.get("name") || ""),
        seats: Number(fd.get("seats") || 2),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || labels.actionFailed);
      return;
    }
    form.reset();
    await refresh();
  }

  async function onSave(table: TableRow, form: HTMLFormElement) {
    const fd = new FormData(form);
    setMessage("");
    const res = await fetch(`/api/tables/${table.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name") || ""),
        seats: Number(fd.get("seats") || 2),
        sortOrder: Number(fd.get("sortOrder") || 0),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || labels.actionFailed);
      return;
    }
    await refresh();
  }

  async function onRemove(id: string) {
    setMessage("");
    const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || labels.actionFailed);
      return;
    }
    await refresh();
  }

  function statusLabel(status: string) {
    if (status === "occupied") return labels.occupied;
    if (status === "dirty") return labels.dirty;
    return labels.free;
  }

  return (
    <section className="panel space-y-4">
      <h2 className="text-xl display">{labels.title}</h2>
      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <ul className="space-y-3">
        {tables.map((table) => (
          <li key={table.id} className="rounded-[10px] border border-line p-3">
            <form
              className="grid gap-2 sm:grid-cols-[1fr_5rem_4rem_auto] sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                void onSave(table, e.currentTarget);
              }}
            >
              <label className="field">
                <span>{labels.name}</span>
                <input name="name" defaultValue={table.name} required />
              </label>
              <label className="field">
                <span>{labels.seats}</span>
                <input
                  name="seats"
                  type="number"
                  min={1}
                  max={50}
                  defaultValue={table.seats}
                  required
                />
              </label>
              <label className="field">
                <span>#</span>
                <input
                  name="sortOrder"
                  type="number"
                  min={0}
                  defaultValue={table.sortOrder}
                  required
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn btn-secondary" disabled={pending}>
                  {labels.save}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={pending || table.status === "occupied"}
                  onClick={() => onRemove(table.id)}
                >
                  {labels.remove}
                </button>
              </div>
            </form>
            <div className="mt-2 text-xs text-muted">{statusLabel(table.status)}</div>
          </li>
        ))}
      </ul>

      <form onSubmit={onAdd} className="flex flex-wrap gap-3 border-t border-line pt-4">
        <input
          name="name"
          required
          placeholder={labels.name}
          className="min-w-[8rem] flex-1 rounded-[10px] border border-line bg-background px-3 py-2"
        />
        <input
          name="seats"
          type="number"
          min={1}
          max={50}
          defaultValue={2}
          className="w-24 rounded-[10px] border border-line bg-background px-3 py-2"
        />
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {labels.add}
        </button>
      </form>
    </section>
  );
}
