"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createOutlet,
  inviteStaff,
  removeStaffMember,
} from "../team-actions";

type Member = {
  id: string;
  role: string;
  user: { name: string; email: string };
};

export function TeamPanel({
  members,
  canInvite,
  canCreateOutlet,
  seatsUsed,
  seatsMax,
  outletsUsed,
  outletsMax,
  labels,
}: {
  members: Member[];
  canInvite: boolean;
  canCreateOutlet: boolean;
  seatsUsed: number;
  seatsMax: number;
  outletsUsed: number;
  outletsMax: number;
  labels: {
    team: string;
    invite: string;
    remove: string;
    name: string;
    email: string;
    password: string;
    passwordHint: string;
    role: string;
    owner: string;
    staff: string;
    seats: string;
    outlets: string;
    addOutlet: string;
    outletName: string;
    limitReached: string;
    upgrade: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [inviteMsg, setInviteMsg] = useState("");
  const [outletMsg, setOutletMsg] = useState("");

  function onInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setInviteMsg("");
    startTransition(async () => {
      const res = await inviteStaff(fd);
      if (!res.ok) {
        setInviteMsg(res.error || "Failed");
        return;
      }
      form.reset();
      setInviteMsg("Added");
      router.refresh();
    });
  }

  function onCreateOutlet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setOutletMsg("");
    startTransition(async () => {
      const res = await createOutlet(fd);
      if (!res.ok) {
        setOutletMsg(res.error || "Failed");
        return;
      }
      form.reset();
      setOutletMsg("Created");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="panel space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl display">{labels.team}</h2>
            <p className="mt-1 text-sm text-muted">
              {labels.seats}: {seatsUsed}/{seatsMax}
            </p>
          </div>
        </div>

        <ul className="divide-y divide-line text-sm">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div>
                <div className="font-medium">{m.user.name}</div>
                <div className="text-muted">{m.user.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge">
                  {m.role === "owner" ? labels.owner : labels.staff}
                </span>
                {m.role !== "owner" ? (
                  <form
                    action={(fd) => {
                      startTransition(async () => {
                        await removeStaffMember(fd);
                        router.refresh();
                      });
                    }}
                  >
                    <input type="hidden" name="membershipId" value={m.id} />
                    <button
                      type="submit"
                      className="text-sm text-muted hover:text-foreground"
                      disabled={pending}
                    >
                      {labels.remove}
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {canInvite ? (
          <form onSubmit={onInvite} className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder={labels.name}
              className="rounded-[10px] border border-line bg-background px-3 py-2"
            />
            <input
              name="email"
              type="email"
              required
              placeholder={labels.email}
              className="rounded-[10px] border border-line bg-background px-3 py-2"
            />
            <input
              name="password"
              type="password"
              minLength={6}
              placeholder={labels.password}
              className="rounded-[10px] border border-line bg-background px-3 py-2 sm:col-span-2"
            />
            <p className="text-xs text-muted sm:col-span-2">{labels.passwordHint}</p>
            <div className="flex items-center gap-3 sm:col-span-2">
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {labels.invite}
              </button>
              {inviteMsg ? <span className="text-sm text-muted">{inviteMsg}</span> : null}
            </div>
          </form>
        ) : (
          <p className="border-t border-line pt-4 text-sm text-muted">
            {labels.limitReached}{" "}
            <a href="/dashboard/billing" className="text-accent underline">
              {labels.upgrade}
            </a>
          </p>
        )}
      </section>

      <section className="panel space-y-4">
        <div>
          <h2 className="text-xl display">{labels.outlets}</h2>
          <p className="mt-1 text-sm text-muted">
            {labels.outlets}: {outletsUsed}/{outletsMax}
          </p>
        </div>

        {canCreateOutlet ? (
          <form onSubmit={onCreateOutlet} className="flex flex-wrap gap-3">
            <input
              name="name"
              required
              minLength={2}
              placeholder={labels.outletName}
              className="min-w-[12rem] flex-1 rounded-[10px] border border-line bg-background px-3 py-2"
            />
            <button type="submit" className="btn btn-secondary" disabled={pending}>
              {labels.addOutlet}
            </button>
            {outletMsg ? <span className="w-full text-sm text-muted">{outletMsg}</span> : null}
          </form>
        ) : (
          <p className="text-sm text-muted">
            {labels.limitReached}{" "}
            <a href="/dashboard/billing" className="text-accent underline">
              {labels.upgrade}
            </a>
          </p>
        )}
      </section>
    </div>
  );
}
