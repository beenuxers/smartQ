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

Copy `.env.example` to `.env`. Set `WHATSAPP_*` to send real messages; otherwise joins/notify log to the server console. Set `ADMIN_EMAILS` for platform access.
