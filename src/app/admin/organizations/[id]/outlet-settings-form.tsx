"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="rounded-[10px] bg-[#0f6b5c] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Saving…" : "Save outlet settings"}
    </button>
  );
}

export function OutletSettingsForm({
  action,
  outlet,
  organizationId,
}: {
  action: (formData: FormData) => Promise<void>;
  organizationId: string;
  outlet: {
    id: string;
    name: string;
    activeSession: string;
    lunchStart: string;
    lunchEnd: string;
    dinnerStart: string;
    dinnerEnd: string;
    queueDayCutoff: string;
    timezone: string;
    isActive: boolean;
  };
}) {
  return (
    <form action={action} className="mt-4 space-y-3 text-sm">
      <input type="hidden" name="outletId" value={outlet.id} />
      <input type="hidden" name="organizationId" value={organizationId} />
      <label className="block">
        <span className="mb-1 block text-white/50">Name</span>
        <input
          name="name"
          defaultValue={outlet.name}
          required
          className="w-full rounded-xl border border-white/15 bg-[#0d1411] px-3 py-2"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-white/50">Session</span>
          <select
            name="activeSession"
            defaultValue={outlet.activeSession}
            className="w-full rounded-xl border border-white/15 bg-[#0d1411] px-3 py-2"
          >
            <option value="all">All day</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-white/50">Timezone</span>
          <input
            name="timezone"
            defaultValue={outlet.timezone}
            className="w-full rounded-xl border border-white/15 bg-[#0d1411] px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-white/50">Lunch start</span>
          <input
            name="lunchStart"
            defaultValue={outlet.lunchStart}
            className="w-full rounded-xl border border-white/15 bg-[#0d1411] px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-white/50">Lunch end</span>
          <input
            name="lunchEnd"
            defaultValue={outlet.lunchEnd}
            className="w-full rounded-xl border border-white/15 bg-[#0d1411] px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-white/50">Dinner start</span>
          <input
            name="dinnerStart"
            defaultValue={outlet.dinnerStart}
            className="w-full rounded-xl border border-white/15 bg-[#0d1411] px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-white/50">Dinner end</span>
          <input
            name="dinnerEnd"
            defaultValue={outlet.dinnerEnd}
            className="w-full rounded-xl border border-white/15 bg-[#0d1411] px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-white/50">Queue day cutoff</span>
          <input
            name="queueDayCutoff"
            type="time"
            defaultValue={outlet.queueDayCutoff || "04:00"}
            className="w-full rounded-xl border border-white/15 bg-[#0d1411] px-3 py-2"
          />
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            name="isActive"
            value="true"
            defaultChecked={outlet.isActive}
            className="mt-1"
          />
          <span className="text-white/70">Outlet active</span>
        </label>
      </div>
      <SubmitButton />
    </form>
  );
}
