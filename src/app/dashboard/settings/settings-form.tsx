"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsForm({
  outlet,
  labels,
}: {
  outlet: {
    id: string;
    name: string;
    activeSession: string;
    lunchStart: string;
    lunchEnd: string;
    dinnerStart: string;
    dinnerEnd: string;
  };
  labels: {
    sessionHours: string;
    lunch: string;
    dinner: string;
    allDay: string;
  };
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/outlet-settings/${outlet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        activeSession: form.get("activeSession"),
        lunchStart: form.get("lunchStart"),
        lunchEnd: form.get("lunchEnd"),
        dinnerStart: form.get("dinnerStart"),
        dinnerEnd: form.get("dinnerEnd"),
      }),
    });
    setMessage(res.ok ? "Saved" : "Could not save");
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4">
      <label className="field">
        <span>Outlet name</span>
        <input name="name" defaultValue={outlet.name} required />
      </label>
      <label className="field">
        <span>{labels.sessionHours}</span>
        <select name="activeSession" defaultValue={outlet.activeSession}>
          <option value="all">{labels.allDay}</option>
          <option value="lunch">{labels.lunch}</option>
          <option value="dinner">{labels.dinner}</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="field">
          <span>Lunch start</span>
          <input name="lunchStart" defaultValue={outlet.lunchStart} />
        </label>
        <label className="field">
          <span>Lunch end</span>
          <input name="lunchEnd" defaultValue={outlet.lunchEnd} />
        </label>
        <label className="field">
          <span>Dinner start</span>
          <input name="dinnerStart" defaultValue={outlet.dinnerStart} />
        </label>
        <label className="field">
          <span>Dinner end</span>
          <input name="dinnerEnd" defaultValue={outlet.dinnerEnd} />
        </label>
      </div>
      {message ? <p className="text-sm text-success">{message}</p> : null}
      <button className="btn btn-primary">Save settings</button>
    </form>
  );
}
