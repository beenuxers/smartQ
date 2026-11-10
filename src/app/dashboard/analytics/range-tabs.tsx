"use client";

import Link from "next/link";

export function RangeTabs({
  current,
  labels,
}: {
  current: "day" | "week" | "month";
  labels: { day: string; week: string; month: string };
}) {
  const items = [
    { key: "day" as const, label: labels.day },
    { key: "week" as const, label: labels.week },
    { key: "month" as const, label: labels.month },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.key}
          href={`/dashboard/analytics?range=${item.key}`}
          className={`btn ${current === item.key ? "btn-primary" : "btn-secondary"}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
