import Link from "next/link";
import { PRODUCT } from "@/lib/product";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="display text-lg font-semibold">{PRODUCT.name}</div>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Virtual waitlist for F&amp;B outlets. Guests join by QR and return on WhatsApp.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-muted">
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Start free
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-4 text-xs text-muted sm:flex-row sm:justify-between">
          <span>Built for F&amp;B in Singapore · Indonesia · Malaysia</span>
          <span>No guest app · WhatsApp alerts · QR check-in</span>
        </div>
      </div>
    </footer>
  );
}
