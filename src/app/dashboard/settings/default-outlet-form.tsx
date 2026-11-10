"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDefaultOutlet } from "../team-actions";

export function DefaultOutletForm({
  outlets,
  defaultOutletId,
  labels,
}: {
  outlets: Array<{ id: string; name: string }>;
  defaultOutletId: string | null;
  labels: {
    title: string;
    hint: string;
    save: string;
    saved: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultOutletId || outlets[0]?.id || "");
  const [message, setMessage] = useState("");

  if (outlets.length <= 1) return null;

  return (
    <form
      className="panel space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("outletId", value);
        setMessage("");
        startTransition(async () => {
          const res = await setDefaultOutlet(fd);
          if (!res.ok) {
            setMessage("Could not save");
            return;
          }
          setMessage(labels.saved);
          router.refresh();
        });
      }}
    >
      <div>
        <h2 className="display text-xl font-semibold">{labels.title}</h2>
        <p className="mt-1 text-sm text-muted">{labels.hint}</p>
      </div>
      <label className="field">
        <span>{labels.title}</span>
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
        >
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "…" : labels.save}
      </button>
    </form>
  );
}
