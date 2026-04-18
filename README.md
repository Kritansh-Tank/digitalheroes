# 🏌️ Digital Heroes

> Golf. Give. Win. — A subscription-driven platform combining Stableford score tracking, charity fundraising, and monthly prize draws.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Custom bcrypt + JWT (httpOnly cookie) |
| Payments | Stripe (Subscriptions) |
| Language | TypeScript |
| Deployment | Vercel |

---

## Features

- **Auth** — Email/password signup & login with bcrypt hashing and JWT sessions
- **Subscriptions** — Monthly (£9.99) and Yearly (£89.99) plans via Stripe Checkout
- **Score Tracking** — Rolling 5-score system in Stableford format (1–45), unique per date
- **Monthly Draw** — Random or algorithmic draw engine with 3/4/5-number matching
- **Prize Pool** — Fixed split: 40% (5-match jackpot) / 35% (4-match) / 25% (3-match)
- **Jackpot Rollover** — 5-match prize carries forward if unclaimed
- **Charity Module** — 10%+ of subscription donated to user's chosen charity
- **Winner Verification** — Proof upload → admin approve → mark paid flow
- **Admin Panel** — Full CRUD: users, draws (simulate + publish), charities, winners, reports

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Kritansh-Tank/digitalheroes
cd digitalheroes
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
JWT_SECRET=your_random_secret_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up the Database

1. Open the [Supabase SQL Editor](https://supabase.com/dashboard)
2. Paste and run `supabase/schema.sql`

> **Fresh install?** If you have existing tables, wipe first:
> ```sql
> DROP SCHEMA public CASCADE;
> CREATE SCHEMA public;
> GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
> GRANT ALL ON SCHEMA public TO postgres;
> ```

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@digitalheroes.co.in` | `Admin@123` |

> To create a regular user, go to `/signup`.

---

## Project Structure

```
app/
├── page.tsx                  # Landing page
├── login/                    # Login page
├── signup/                   # Signup page
├── dashboard/                # User dashboard (scores, charity, winnings)
├── admin/                    # Admin panel (users, draws, charities, winners)
├── charities/                # Public charity listing
├── pricing/                  # Pricing plans
└── api/
    ├── auth/                 # signup · login · logout
    ├── scores/               # CRUD + rolling-5 logic
    ├── charities/            # Public charity listing
    ├── winners/              # Proof upload + admin verify
    ├── stripe/               # Checkout session + webhook
    └── admin/                # users · draws · charities

lib/
├── auth.ts                   # bcrypt + JWT helpers
├── supabase.ts               # Supabase clients (anon + service role)
├── stripe.ts                 # Stripe client + plan config
└── draw-engine.ts            # Draw logic + prize distribution

supabase/
└── schema.sql                # Full DB schema + seed data
```

---

## Draw Engine

Located in `lib/draw-engine.ts`

| Mode | Logic |
|---|---|
| **Random** | 5 unique numbers 1–45 via Fisher-Yates shuffle |
| **Algorithmic** | Numbers weighted by score frequency across all users |

Admin flow: **Create → Simulate → Publish**. Publishing detects winners, distributes prizes, and handles jackpot rollover automatically.

---

## Score Logic

- Max **5 scores** stored per user at any time
- One score per date (duplicate dates rejected)
- Adding a 6th score **auto-removes the oldest**
- Displayed in reverse chronological order

---

## Stripe Webhooks (Production)

Register `https://your-domain.com/api/stripe/webhook` in the [Stripe Dashboard](https://dashboard.stripe.com/webhooks) listening for:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Then add `STRIPE_WEBHOOK_SECRET=whsec_...` to your environment variables.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import into a **new** Vercel project
3. Add all `.env.local` variables to Vercel → Settings → Environment Variables
4. Set `NEXT_PUBLIC_APP_URL` to your production URL
5. Deploy

---

## 📜 License

MIT License - See LICENSE file for details
