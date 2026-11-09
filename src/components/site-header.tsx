import Link from "next/link";
import { PRODUCT } from "@/lib/product";

export function SiteHeader({
  variant = "light",
}: {
  variant?: "light" | "hero";
}) {
  const onHero = variant === "hero";

  return (
    <header className="relative z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className={`display text-xl font-semibold tracking-tight ${onHero ? "text-white" : "text-foreground"}`}
        >
          {PRODUCT.name}
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <Link
            href="/pricing"
            className={`hidden px-3 py-2 sm:inline ${onHero ? "text-white/75 hover:text-white" : "text-muted hover:text-foreground"}`}
          >
            Pricing
          </Link>
          <Link href="/login" className={onHero ? "btn btn-ghost" : "btn btn-secondary"}>
            Sign in
          </Link>
          <Link href="/register" className="btn btn-primary">
            Start free
          </Link>
        </nav>
      </div>
    </header>
  );
}
