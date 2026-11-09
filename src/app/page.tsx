import Image from "next/image";
import Link from "next/link";
import { PRODUCT } from "@/lib/product";
import { PLANS, formatMoney } from "@/lib/pricing";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const STEPS = [
  {
    n: "01",
    title: "Scan QR",
    body: "Guests join on mobile web. No app download, no kiosk hardware.",
    image: "/images/step-qr.jpg",
    alt: "Guest scanning a QR code at a cafe entrance",
  },
  {
    n: "02",
    title: "Wait elsewhere",
    body: "Live position link and WhatsApp ticket so they can leave the doorway.",
    image: "/images/step-wait-v2.jpg",
    alt: "Guest waiting nearby while checking their phone",
    objectPosition: "center 30%",
  },
  {
    n: "03",
    title: "Table ready",
    body: "Host taps Notify. WhatsApp brings them back. Seated or no-show in one tap.",
    image: "/images/step-ready.jpg",
    alt: "Guests being seated at a cafe table",
  },
] as const;

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/images/hero-cafe.jpg"
            alt="Cafe entrance with guests waiting"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `
              linear-gradient(165deg, rgba(11, 61, 54, 0.72) 0%, rgba(22, 53, 47, 0.62) 45%, rgba(15, 107, 92, 0.55) 100%),
              linear-gradient(to top, rgba(11, 61, 54, 0.45), transparent 45%)
            `,
          }}
        />

        <SiteHeader variant="hero" />

        <div className="mx-auto max-w-5xl px-6 pb-16 pt-10 md:pb-24 md:pt-16">
          <p className="rise-in display text-4xl font-semibold tracking-tight md:text-5xl">
            {PRODUCT.name}
          </p>
          <h1 className="rise-in-delay mt-5 max-w-2xl text-3xl font-medium leading-tight text-white/95 md:text-5xl">
            {PRODUCT.tagline}
          </h1>
          <p className="rise-in-delay mt-5 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
            {PRODUCT.oneLiner}
          </p>
          <div className="rise-in-delay-2 mt-9 flex flex-wrap gap-3">
            <Link href="/register" className="btn btn-primary">
              Start free
            </Link>
            <Link href="/pricing" className="btn btn-ghost">
              See pricing
            </Link>
          </div>
          <div className="rise-in-delay-2 trust-strip mt-10">
            <span>No guest app</span>
            <span>WhatsApp alerts</span>
            <span>QR only</span>
            <span>Live in minutes</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-accent">How it works</p>
        <h2 className="display mt-2 text-2xl font-semibold md:text-3xl">
          From door queue to seated — three steps
        </h2>
        <div className="step-rail mt-10">
          {STEPS.map((item) => (
            <article key={item.n} className="step-item">
              <div className="step-image">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  style={{
                    objectPosition:
                      "objectPosition" in item && item.objectPosition
                        ? item.objectPosition
                        : "center",
                  }}
                />
              </div>
              <div className="step-num">{item.n}</div>
              <h3 className="display text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-accent">Pricing</p>
              <h2 className="display mt-2 text-2xl font-semibold md:text-3xl">
                Clear per-outlet plans
              </h2>
              <p className="mt-2 max-w-lg text-muted">
                USD list prices, with SGD / IDR / MYR or auto-detect by territory.
              </p>
            </div>
            <Link href="/pricing" className="btn btn-secondary">
              Compare plans
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {(["free", "starter", "growth"] as const).map((id) => {
              const plan = PLANS[id];
              return (
                <div
                  key={id}
                  className="border border-line bg-[var(--background)] p-5"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <div className="badge">{plan.name}</div>
                  <div className="display mt-4 text-3xl font-semibold">
                    {formatMoney(plan.prices.USD.monthly, "USD")}
                    <span className="text-base font-normal text-muted">/mo</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{plan.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
