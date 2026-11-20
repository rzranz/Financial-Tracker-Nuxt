# FinVault Nuxt Fullstack

**Personal Finance Engine** berbasis *real-time cash ledger* dan *contract-based investment tracking*. Dibangun dengan **Nuxt 3**, **Nitro Serverless**, **Tailwind CSS**, **Supabase PostgreSQL (RLS)**, dan **Vercel Cron**.

## Core Capabilities

- **Zero-Bias Financial Separation (FR-01 – FR-05)**
  - **Liquid Cash ($C_l$)**: $\sum T_{\text{income}} + \sum T_{\text{investment\_in}} - \sum T_{\text{expense}} - \sum T_{\text{investment\_out}}$
  - **Locked Principal ($P_l$)**: $\sum I_{\text{active.principal}} + \sum I_{\text{matured.principal}}$
  - **Projected Profit ($R_p$)**: $\sum \left( I_{\text{active.principal}} \times \frac{I_{\text{active.return\_pct}}}{100} \right)$
  - **Projected Net Worth ($N_p$)**: $C_l + P_l + R_p$
- **NUMERIC(15, 2) Precision**: Perhitungan finansial server & client menggunakan `decimal.js` serta tipe data PostgreSQL `NUMERIC(15, 2)` & `GENERATED ALWAYS AS (...) STORED`.
- **Supabase Auth & RLS Isolation**: Seluruh tabel (`transactions`, `investments`, `notifications`) dilindungi kebijakan Row Level Security berbasis `auth.uid() = user_id`.
- **Daily Vercel Cron (`0 0 * * *`)**: Menjalankan `GET /api/cron/check-investments` dengan verifikasi `Authorization: Bearer <CRON_SECRET>` melalui Nitro Middleware (`timingSafeEqual`) dan `serverSupabaseServiceRole`.
- **Anti Double-Claim Settlement**: Endpoint `POST /api/investments/claim` melakukan atomic conditional update (`status = 'matured'` & `status != 'claimed'`) sebelum mencatat mutasi `investment_in`.

## Setup & Deployment

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables** (`.env`):
   ```bash
   cp .env.example .env
   ```
   Isi `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`, dan `CRON_SECRET`.

3. **Apply Supabase Database Schema**:
   Jalankan isi [`supabase/migrations/001_finvault_schema.sql`](./supabase/migrations/001_finvault_schema.sql) di **Supabase SQL Editor**.

4. **Run Development Server / Tests / Build**:
   ```bash
   npm run dev
   npm run test
   npm run typecheck
   npm run build
   ```
