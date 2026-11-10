"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

export function DashboardNav({
  items,
  showAdmin,
  signOutLabel,
  outletSlot,
}: {
  items: NavItem[];
  showAdmin: boolean;
  signOutLabel: string;
  outletSlot?: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  const linkClass =
    "rounded-[10px] px-2.5 py-1.5 text-muted hover:bg-[var(--accent-soft)] hover:text-foreground";
  const mobileLinkClass =
    "block rounded-[10px] px-3 py-3 text-foreground hover:bg-[var(--accent-soft)]";

  return (
    <div ref={rootRef} className="app-header sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 md:gap-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="display shrink-0 text-lg font-semibold tracking-tight"
          >
            SmartQ
          </Link>
          {outletSlot}
        </div>

        <nav
          className="hidden items-center gap-2 text-sm md:flex"
          aria-label="Dashboard"
        >
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
          {showAdmin ? (
            <Link
              href="/admin"
              className="rounded-[10px] px-2.5 py-1.5 font-semibold text-accent hover:bg-[var(--accent-soft)]"
            >
              Admin
            </Link>
          ) : null}
          <button
            type="button"
            className="rounded-[10px] px-2.5 py-1.5 text-muted hover:text-foreground"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            {signOutLabel}
          </button>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-foreground hover:bg-[var(--accent-soft)] md:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="flex w-5 flex-col gap-1.5" aria-hidden>
            <span
              className={`h-0.5 w-full rounded-full bg-current transition ${open ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`h-0.5 w-full rounded-full bg-current transition ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`h-0.5 w-full rounded-full bg-current transition ${open ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      {open ? (
        <nav
          id={panelId}
          className="border-t border-line bg-[rgba(255,255,255,0.98)] px-4 py-2 md:hidden"
          aria-label="Dashboard"
        >
          <div className="mx-auto flex max-w-6xl flex-col text-sm">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={mobileLinkClass}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {showAdmin ? (
              <Link
                href="/admin"
                className={`${mobileLinkClass} font-semibold text-accent`}
                onClick={() => setOpen(false)}
              >
                Admin
              </Link>
            ) : null}
            <button
              type="button"
              className={`${mobileLinkClass} w-full text-left text-muted`}
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              {signOutLabel}
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
