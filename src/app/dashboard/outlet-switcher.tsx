"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setActiveOutlet } from "./team-actions";

export function OutletSwitcher({
  outlets,
  activeId,
  label,
}: {
  outlets: Array<{ id: string; name: string }>;
  activeId: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (outlets.length <= 1) {
    return (
      <span className="hidden text-sm text-muted sm:inline">{outlets[0]?.name}</span>
    );
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted md:inline">{label}</span>
      <select
        className="rounded-[10px] border border-line bg-background px-2 py-1.5"
        value={activeId}
        disabled={pending}
        onChange={(e) => {
          const fd = new FormData();
          fd.set("outletId", e.target.value);
          startTransition(async () => {
            await setActiveOutlet(fd);
            router.refresh();
          });
        }}
      >
        {outlets.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}
