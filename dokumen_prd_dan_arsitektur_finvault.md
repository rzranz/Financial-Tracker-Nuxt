# FinVault Nuxt Fullstack: PRD, Technical Scope, & Architecture Blueprint

---

## 1. Product Requirement Document (PRD)

### 1.1 Problem Statement & Value Proposition
Banyak individu yang mencampuradukkan antara **Kas Likuid (Uang Riil)** dengan **Aset Berjalan / Janji Imbal Hasil (Accrued ROI)**. Ketidakjelasan pemisahan ini memicu bias akuntansi pribadi, di mana pengguna merasa memiliki likuiditas lebih besar dari realitas kas sesungguhnya.

**FinVault** hadir sebagai *personal finance engine* berbasis *real-time ledger* dan *contract-based investment tracking*. Sistem ini secara otomatis memisahkan antara arus kas nyata dan proyeksi keuntungan investasi berjangka, lengkap dengan penagihan klaim otomatis berbasis serverless cron.

### 1.2 User Personas & Target Audience
- **Retail Investor / Fixed-Yield Investor**: Pengguna yang menempatkan dana pada instrumen dengan imbal hasil tetap/terjadwal (seperti Deposito Digital, SBN, P2P Lending, atau obligasi jangka pendek).
- **Disciplined Budgeter**: Pengguna yang membutuhkan visibilitas tinggi terhadap arus masuk dan keluar kas riil tanpa terdistorsi oleh estimasi keuntungan di masa depan.

### 1.3 Key Functional Requirements (FR)

| ID | Module | Feature Description | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **FR-01** | **Auth & RLS** | Autentikasi berbasis Supabase Auth (Email/Password). | Setiap *request* database terisolasi total menggunakan Row Level Security (RLS) berdasarkan `auth.uid()`. |
| **FR-02** | **Cash Ledger** | Pencatatan transaksi harian (*income* & *expense*). | Mengubah nilai *Liquid Cash* secara *atomic transaction*. Menggunakan format angka presisi `NUMERIC(15, 2)`. |
| **FR-03** | **Investment Calc** | Simulator & pencatat kontrak investasi. | Menghitung estimasi imbal hasil secara otomatis di level DB via *Generated Stored Columns*. |
| **FR-04** | **Cron Notifier** | Eksekusi otomatis pengecekan jatuh tempo harian. | Vercel Cron menembak Nitro Endpoint setiap pukul 00:00 UTC, memperbarui status investasi yang matang, dan menerbitkan notifikasi. |
| **FR-05** | **Claim Engine** | Pencairan modal + profit ke kas riil. | Pengguna mengonfirmasi manual pencairan instrumen; dana modal dan profit dimasukkan sebagai mutasi kas *investment_in*. |

### 1.4 Non-Functional Requirements (NFR)
- **Financial Precision**: Batas toleransi presisi desimal matematika keuangan adalah $0.00$. Seluruh perhitungan desimal wajib dihitung pada backend/database tanpa *floating-point drift*.
- **Performance**: *Initial Page Load* $< 1.5$ detik pada jaringan 4G. Waktu respons Nitro Serverless API $< 300\text{ ms}$.
- **Security**: Proteksi endpoint API terhadap Cron unauthorized access menggunakan *Bearer Token Signature Validation*.

### 1.5 Financial Mathematical Model

1. **Persamaan Liquid Cash Balance ($C_l$)**:
   $$C_l = \sum T_{\text{income}} + \sum T_{\text{investment\_in}} - \sum T_{\text{expense}} - \sum T_{\text{investment\_out}}$$

2. **Persamaan Locked Principal ($P_l$)**:
   $$P_l = \sum I_{\text{active.principal}} + \sum I_{\text{matured.principal}}$$

3. **Persamaan Projected Profit ($R_p$)**:
   $$R_p = \sum \left( I_{\text{active.principal}} \times \frac{I_{\text{active.return\_pct}}}{100} \right)$$

4. **Persamaan Total Projected Net Worth ($N_p$)**:
   $$N_p = C_l + P_l + R_p$$

---

## 2. Project Scope

```
+-----------------------------------------------------------------------+
|                              PROJECT SCOPE                            |
+-----------------------------------------------------------------------+
|  IN-SCOPE (Phase 1 MVP)                | OUT-OF-SCOPE (Future Expansion)|
|----------------------------------------+------------------------------|
| [x] Multi-user Auth (Supabase)         | [ ] Auto-sync API Bank / Open|
| [x] Ledger Kas (In/Out)                |     Banking API (Midtrans)   |
| [x] Investment Contract Engine         | [ ] Variable ROI (Crypto /    |
| [x] Stored Statically Generated Return |     Saham fluktuatif)        |
| [x] Serverless Daily Cron via Vercel   | [ ] Notifikasi WA/Email Push |
| [x] Modern Banking Dark UI             | [ ] Multi-currency (IDR only)|
| [x] Manual Settlement / Claim Flow     | [ ] Export PDF / CSV Report  |
+-----------------------------------------------------------------------+
```

---

## 3. Tech Stack & Developer Skill Matrix

### 3.1 Architecture Tech Stack Matrix

- **Frontend Framework**: Nuxt 3 (Vue 3 Composition API + Script Setup)
- **Styling & UI**: Tailwind CSS + Lucide Icons (Design System Banking Dark Mode)
- **Backend Framework**: Nuxt Nitro Engine (Serverless Engine)
- **Database Engine**: PostgreSQL (Supabase Managed Instance)
- **Security Layer**: Supabase Row Level Security (RLS) & JWT
- **Deployment Platform**: Vercel Serverless Functions + Vercel Cron

### 3.2 Required Developer Skill Matrix

```text
[Frontend & State]
├── Vue 3 Composition API & Reactive Ref Management
├── Nuxt 3 Data Fetching (useAsyncData, $fetch)
└── Tailwind CSS Architecture (CSS Variables, Dark Scheme Optimization)

[Backend & Serverless Engine]
├── Nitro Event Handler Router & Middleware Validation
├── Vercel Cron Automation & Headers Verification
└── TypeScript Type Guarding & Numeric Serialization

[Database & Financial Logic]
├── PostgreSQL Data Types (NUMERIC vs FLOAT)
├── SQL Generated Always Columns (Postgres 12+)
└── Row Level Security (RLS) Policy Crafting
```

---

## 4. System Architecture & Engineering Specifications

### 4.1 High-Level Component Flow Diagram

```text
+-------------------+           +-------------------+          +---------------------+
|   Client Browser  | <-------> |  Nuxt 3 App Engine| <------> |  Supabase Postgres  |
| (Vue 3 UI State)  |  Web App  |  (SSR / Nitro)    | SQL API  | (Auth + RLS Engine) |
+-------------------+           +-------------------+          +---------------------+
                                          ^
                                          | Trigger Daily HTTP GET
                                          | (Bearer Secret)
                                +-------------------+
                                | Vercel Cron Engine|
                                | (Scheduled 00:00) |
                                +-------------------+
```

### 4.2 State Machine: Investment Lifecycle

```text
  [ Contract Form Submitted ]
              |
              v
       ( Status: ACTIVE )  <--- (Modal dipotong dari Liquid Cash jika opsi dicentang)
              |
              | Hari H Jatuh Tempo dicapai (Cron / Client Check)
              v
      ( Status: MATURED )  <--- (Notification Log Diterbitkan)
              |
              | User Menekan Tombol "Cairkan / Claim"
              v
      ( Status: CLAIMED )  ---> (Modal + Profit Masuk ke Cash Ledger: investment_in)
```

### 4.3 Database Schema Specification (DDL)

```sql
-- Extensi UUID untuk primary key otomatis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Transaksi Kas Riil
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'investment_out', 'investment_in')),
  category TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  note TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Kontrak Investasi & Return Automation
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  principal_amount NUMERIC(15, 2) NOT NULL CHECK (principal_amount > 0),
  expected_return_pct NUMERIC(6, 2) NOT NULL CHECK (expected_return_pct >= 0),
  expected_profit_amount NUMERIC(15, 2) GENERATED ALWAYS AS (
    ROUND(principal_amount * (expected_return_pct / 100.0), 2)
  ) STORED,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  maturity_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matured', 'claimed')),
  reminder_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Pengingat & Log Notifikasi Internal
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Definisi Kebijakan RLS (Security Boundary)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trans_User_Isolation" ON public.transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Inv_User_Isolation" ON public.investments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Notif_User_Isolation" ON public.notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 4.4 Cron Job & Serverless Infrastructure Strategy

1. **Cold Start & Statelessness Handling**:
   - Vercel Cron mengeksekusi `/api/cron/check-investments` melalui metode HTTP `GET`.
   - Karena Nitro Serverless berjalan tanpa state, request dikirim bersama header `Authorization: Bearer <CRON_SECRET>`.

2. **Supabase Service Role Access**:
   - Cron Job berjalan di luar konteks session user individual. Endpoint Cron menggunakan `serverSupabaseServiceRole` untuk mendapatkan bypass RLS khusus query *cross-user scan* pada investasi yang jatuh tempo hari ini.

### 4.5 Security Architecture & Threat Vector Analysis

| Threat Vector | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| **Unauthorized Cron Triggering** | High | Pengecekan wajib pada header HTTP Authorization terhadap `CRON_SECRET` di Nitro Middleware. |
| **Cross-User Data Leakage** | Critical | RLS Supabase dikonfigurasi di level tabel database (`auth.uid() = user_id`), bukan sekadar filter aplikasi. |
| **Double Claiming Vulnerability** | Critical | Endpoint `/api/investments/claim` memverifikasi status `status != 'claimed'` sebelum melakukan mutasi kas, dijalankan secara parsial dalam urutan validasi server. |
| **Floating Point Imprecision** | Medium | Penggunaan tipe data Postgres `NUMERIC(15,2)` secara konsisten di seluruh tabel dan kalkulator Vue. |

---
*Dokumen ini dirancang sebagai acuan teknis standar FinVault Nuxt Fullstack Engine.*