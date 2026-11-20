-- ============================================================================
-- FinVault Nuxt Fullstack: Database Schema Specification (DDL) & RLS
-- ============================================================================
-- Execute this script in Supabase SQL Editor or via Supabase CLI migrations.

-- Extensi UUID untuk primary key otomatis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Transaksi Kas Riil
CREATE TABLE IF NOT EXISTS public.transactions (
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
CREATE TABLE IF NOT EXISTS public.investments (
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
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON public.transactions (user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_investments_user_status
  ON public.investments (user_id, status, maturity_date ASC);

CREATE INDEX IF NOT EXISTS idx_investments_cron_due
  ON public.investments (status, maturity_date)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications (user_id, is_read, created_at DESC);

-- 5. Definisi Kebijakan RLS (Security Boundary)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trans_User_Isolation" ON public.transactions;
CREATE POLICY "Trans_User_Isolation" ON public.transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Inv_User_Isolation" ON public.investments;
CREATE POLICY "Inv_User_Isolation" ON public.investments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Notif_User_Isolation" ON public.notifications;
CREATE POLICY "Notif_User_Isolation" ON public.notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
