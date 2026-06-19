-- ============================================================
-- Monty — PayLater & Credit Card Schema Migration
-- Paste seluruh isi ini ke Supabase SQL Editor → Run
-- SAFE: Additive only (ALTER TABLE ADD COLUMN IF NOT EXISTS)
-- Existing data is preserved — all rows default to account_type='cash'
-- ============================================================

-- ── Step 1: Add new columns to wallets ──────────────────────
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS account_type         text NOT NULL DEFAULT 'cash'
    CHECK (account_type IN ('cash', 'bank', 'ewallet', 'paylater', 'credit_card')),
  ADD COLUMN IF NOT EXISTS credit_limit         numeric(18, 0) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_date         int CHECK (billing_date BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS due_date             int CHECK (due_date BETWEEN 1 AND 31),
  -- Month offset: 0 = bulan berjalan (same month), 1 = bulan berikutnya (next month)
  ADD COLUMN IF NOT EXISTS billing_month_offset int NOT NULL DEFAULT 0
    CHECK (billing_month_offset IN (0, 1)),
  ADD COLUMN IF NOT EXISTS due_month_offset     int NOT NULL DEFAULT 0
    CHECK (due_month_offset IN (0, 1));

-- ── Step 2: Add index for account_type filtering ─────────────
CREATE INDEX IF NOT EXISTS idx_wallets_account_type ON public.wallets(account_type);

-- ── Step 3: Verify migration ─────────────────────────────────
-- Run this SELECT to confirm columns were added:
-- SELECT id, name, balance, account_type, credit_limit,
--        billing_date, billing_month_offset,
--        due_date, due_month_offset
-- FROM public.wallets LIMIT 10;
