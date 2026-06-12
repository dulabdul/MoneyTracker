-- ============================================================
-- FinGram — Supabase Schema Migration (Supabase-safe)
-- Paste seluruh isi ini ke SQL Editor → Run
-- ============================================================

-- 1. Drop existing tables (clean slate, urut dari yang paling bergantung)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories   CASCADE;
DROP TABLE IF EXISTS public.wallets      CASCADE;

-- 2. Wallets table
CREATE TABLE public.wallets (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  balance    numeric(18, 0) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Categories table
CREATE TABLE public.categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  type       text NOT NULL CHECK (type IN ('INCOME','EXPENSE','INVESTMENT_BUY','INVESTMENT_SELL')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Transactions table
CREATE TABLE public.transactions (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id   uuid           NOT NULL REFERENCES public.wallets(id)     ON DELETE CASCADE,
  category_id uuid           NOT NULL REFERENCES public.categories(id)  ON DELETE RESTRICT,
  amount      numeric(18, 0) NOT NULL CHECK (amount > 0),
  type        text           NOT NULL CHECK (type IN ('INCOME','EXPENSE','INVESTMENT_BUY','INVESTMENT_SELL')),
  description text           NOT NULL DEFAULT '',
  created_at  timestamptz    NOT NULL DEFAULT now()
);

-- 5. Indexes
CREATE INDEX idx_tx_wallet   ON public.transactions(wallet_id);
CREATE INDEX idx_tx_category ON public.transactions(category_id);
CREATE INDEX idx_tx_date     ON public.transactions(created_at DESC);
CREATE INDEX idx_tx_type     ON public.transactions(type);

-- 6. Enable RLS
ALTER TABLE public.wallets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (permissive for demo — tighten in production)
CREATE POLICY "allow_all_wallets"
  ON public.wallets FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_categories"
  ON public.categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_transactions"
  ON public.transactions FOR ALL USING (true) WITH CHECK (true);
