"use client";

import { useEffect, useState } from "react";

type Snapshot = {
  queueNumber: number;
  status: string;
  partiesAhead: number;
  guestName: string;
};

export function PositionClient({
  token,
  initial,
  labels,
}: {
  token: string;
  initial: Snapshot;
  labels: {
    yourNumber: string;
    position: string;
    waiting: string;
    notified: string;
    tableReady: string;
    seated: string;
    noShow: string;
    cancelled: string;
    queueFinished: string;
  };
}) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch(`/api/q/${token}`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    }, 5000);
    return () => clearInterval(id);
  }, [token]);

  const finished =
    data.status === "seated" ||
    data.status === "finished" ||
    data.status === "no_show" ||
    data.status === "cancelled";

  const statusLabel =
    data.status === "notified"
      ? labels.tableReady
      : data.status === "finished"
        ? labels.seated
        : data.status === "seated"
          ? labels.seated
          : data.status === "no_show"
            ? labels.noShow
            : data.status === "cancelled"
              ? labels.cancelled
              : labels.waiting;

  const ready = data.status === "notified";

  return (
    <div className="panel mt-8">
      <p className="text-sm text-muted">Hi {data.guestName}</p>
      <div className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {labels.yourNumber}
      </div>
      <div className="display mt-1 text-6xl font-semibold tracking-tight">
        #{data.queueNumber}
      </div>

      {finished ? (
        <div
          className="mt-6 px-4 py-4 text-center text-sm font-semibold"
          style={{
            borderRadius: "var(--radius-sm)",
            background: "var(--accent-soft)",
          }}
        >
          <div>{statusLabel}</div>
          <p className="mt-2 font-normal text-muted">{labels.queueFinished}</p>
        </div>
      ) : (
        <>
          <div
            className="mt-6 flex items-center justify-between px-4 py-3"
            style={{
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-soft)",
            }}
          >
            <span className="text-sm text-muted">{labels.position}</span>
            <strong className="display text-2xl font-semibold">{data.partiesAhead}</strong>
          </div>
          <div
            className={`mt-4 px-4 py-3 text-center text-sm font-semibold ${
              ready ? "text-accent-dark" : "text-foreground"
            }`}
            style={{
              borderRadius: "var(--radius-sm)",
              background: ready ? "var(--accent-soft)" : "var(--background)",
              border: ready ? "1px solid transparent" : "1px solid var(--line)",
            }}
          >
            {statusLabel}
          </div>
        </>
      )}
    </div>
  );
}
