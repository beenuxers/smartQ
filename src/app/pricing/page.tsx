import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PricingCards } from "./pricing-cards";

export default function PricingPage() {
  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-8">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-accent">Pricing</p>
        <h1 className="display mt-2 text-3xl font-semibold md:text-5xl">
          Simple per-outlet pricing
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          List prices start in <strong className="text-foreground">USD</strong>. Switch to SGD, IDR,
          or MYR anytime — or auto-detect from your territory. Annual billing saves about 20%.
        </p>
        <PricingCards />
      </div>
      <SiteFooter />
    </main>
  );
}
