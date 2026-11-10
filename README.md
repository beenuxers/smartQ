# SmartQ — SEA F&B Virtual Waitlist

WhatsApp + QR waitlist for cafes and restaurants in **Singapore, Indonesia, and Malaysia**.

Guests scan a QR, join on mobile web, and get called back on WhatsApp when their table is ready. Hosts run the queue from a browser with three actions: **Notify**, **Seated**, **No-show**.

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite (swap `DATABASE_URL` to Postgres for production)
- NextAuth (credentials)
- WhatsApp Cloud API provider (console fallback in dev)
- Local subscription upgrades (hook for Stripe / Xendit / iPay88)

## Quick start

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an outlet, download the QR, and join as a guest.

## Plans (per outlet)

List prices are **USD-first**. Visitors can switch to MYR / SGD / IDR, or auto-detect from territory (timezone / country).

| Plan    | USD/mo | SGD/mo | IDR/mo | MYR/mo | Seatings | WhatsApp |
|---------|--------|--------|--------|--------|----------|----------|
| Free    | 0      | 0      | 0      | 0      | 100      | 50       |
| Starter | 19     | 29     | 149k   | 79     | 1,500    | 3,000    |
| Growth  | 39     | 49     | 299k   | 149    | 8,000    | 15,000   |

Annual billing ≈ 20% off. WhatsApp overage is a transparent top-up after allowance.

## Rollout preference

1. Singapore (EN, SGD)
2. Indonesia (ID, IDR, PDPL)
3. Malaysia (EN + MS, MYR, PDPA)

## Platform admin

Founders use `/admin` (not the customer `/dashboard`) to see **all** organizations and payments.

1. Set `ADMIN_EMAILS` in `.env` to your login email(s), comma-separated  
   Example: `ADMIN_EMAILS=you@example.com,cofounder@example.com`
2. Register or log in with that email
3. Open [http://localhost:3000/admin](http://localhost:3000/admin) (or click **Admin** in the host nav)

From admin you can:

- Overview KPIs (orgs by plan, paid/failed payments, revenue this month)
- Search all organizations and open any customer
- Change a customer’s plan, activate/deactivate outlets
- View global payment history (success vs failed) without logging into each account

Non-allowlisted users who hit `/admin` are redirected to `/dashboard`.

## Env

Copy `.env.example` to `.env`. Set `ADMIN_EMAILS` for platform access.

### WhatsApp Cloud API

Without credentials, joins/notify **log to the server console** (no Meta charge).

For real messages on Vercel:

1. Create a Meta Business + WhatsApp Cloud API app; add a phone number.
2. Set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`.
3. Cold outreach usually needs **approved utility templates**. Create e.g. `smartq_joined` and `smartq_table_ready`, then set:
   - `WHATSAPP_TEMPLATE_JOINED`
   - `WHATSAPP_TEMPLATE_TABLE_READY`
   - `WHATSAPP_TEMPLATE_LANG` (default `en`)
4. Template body params (must match approval):
   - **joined:** outlet name, queue #, parties ahead, track URL
   - **table_ready:** outlet name, queue #, track URL

If templates are unset but token/id are set, SmartQ falls back to plain text (often blocked outside a customer session).

## Auth (required on Vercel)

Auth.js needs these on every environment:

1. `AUTH_SECRET` — long random string (`openssl rand -base64 32`). **Required**; missing secret → `/api/auth/error?error=Configuration`.
2. `AUTH_URL` — full origin of that environment. Local: `http://localhost:3000`. Production: `https://smartq-flax.vercel.app` (or your custom domain). **Do not** set localhost on Vercel.

## Auth hardening

Signup and login are rate-limited. Signup also supports **Cloudflare Turnstile**.

1. Create a Turnstile widget in the [Cloudflare dashboard](https://dash.cloudflare.com/) (Managed / non-interactive is fine).
2. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` on Vercel (and locally if you want to test the widget).
3. If keys are unset, the bot check is skipped (convenient for local DX).
4. Optional but recommended in production: create a free [Upstash Redis](https://upstash.com/) database and set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` so rate limits are shared across serverless instances.

Limits (defaults): register **5 / IP / hour**; login **30 / IP / 15 min** and **10 failed attempts / email / 15 min**.

## Pilot checklist

Before putting SmartQ in front of a real cafe:

**Env (Vercel Production)**

- [ ] `AUTH_SECRET` set (non-empty)
- [ ] `AUTH_URL` = production origin (not localhost)
- [ ] `DATABASE_URL` = Neon/Postgres
- [ ] Turnstile keys (optional but recommended)
- [ ] Upstash Redis (optional; shared rate limits)
- [ ] WhatsApp token + phone number id + templates (for real Notify)
- [ ] `BILLING_PROVIDER=local` is fine for a pilot (Stripe later)

**Dry-run**

1. Open `/api/health` → `ok: true`
2. Register / log in on phone
3. Guest QR join with your WhatsApp number
4. Host **Notify** → real WhatsApp arrives
5. **Seated** → party in Dining; **Dining now** increments
6. **Finish dining** → Done shows **Finished**; Dining now back to 0

On mobile, list cards show one primary action (Notify / Finish / Restore); open **View / edit** for Seated, No-show, Cancel, etc.
