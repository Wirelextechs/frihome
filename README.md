# AfriHome

Real-estate crowd-investment platform for African markets. Users sign up,
complete a lightweight KYC check, browse investment projects, and invest in
GHS-denominated real estate deals — with amounts displayed in their local
currency.

## Stack

- **Backend**: Express + TypeScript, Drizzle ORM, PostgreSQL (Supabase),
  JWT auth, Zod validation.
- **Frontend**: React 18 + Vite + TypeScript, Tailwind CSS, Zustand,
  React Router, Axios.

## Project structure

```
backend/
  src/
    db/          schema.ts (8 tables), index.ts (drizzle client)
    lib/         auth.ts (JWT/bcrypt helpers)
    middleware/  auth.ts (requireAuth, requireAdmin)
    routes/      auth, kyc, projects, investments, payments, users
    index.ts     Express app entry point
frontend/
  src/
    lib/         api.ts (axios client), store.ts (zustand auth store),
                 currency.ts (GHS conversion helpers)
    components/  Layout.tsx
    pages/       Login, Signup, Kyc, Dashboard, Projects, ProjectDetail,
                 Portfolio, NotFound
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, etc.
npm install
npm run db:push        # creates tables in your Postgres/Supabase instance
npm run dev            # http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev             # http://localhost:5173
```

## Notes

- `backend/.env` and `frontend/.env.local` are gitignored — never commit
  real credentials. If a database password was ever shared in a chat or
  doc, rotate it in Supabase before using it.
- Paystack and crypto payment routes (`backend/src/routes/payments.ts`) are
  stubbed — wire up the live Paystack API call and webhook signature
  verification before accepting real payments.
- Currency conversion rates in `frontend/src/lib/currency.ts` are static
  placeholders; swap in a live FX feed for production.
