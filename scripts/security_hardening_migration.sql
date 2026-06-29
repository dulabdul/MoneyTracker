-- =========================================================================
-- MONTY — PRODUCTION DATABASE RLS HARDENING & RPC SECURITY INTERCEPTION MIGRATION
-- Safe, Idempotent, and production-grade SQL script.
-- Paste this script into your Supabase SQL Editor and run it.
-- =========================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- PHASE 1: LEGACY POLICY PURGE
-- Cleanly eliminate all prototype/permissive filters to prevent conflicts.
-- ─────────────────────────────────────────────────────────────────────────

-- Wallets
DROP POLICY IF EXISTS allow_all_wallets ON public.wallets;
DROP POLICY IF EXISTS allow_user_wallets ON public.wallets;

-- Categories
DROP POLICY IF EXISTS allow_all_categories ON public.categories;
DROP POLICY IF EXISTS allow_user_categories ON public.categories;
DROP POLICY IF EXISTS allow_select_categories ON public.categories;
DROP POLICY IF EXISTS allow_write_categories ON public.categories;

-- Transactions
DROP POLICY IF EXISTS allow_all_transactions ON public.transactions;
DROP POLICY IF EXISTS allow_user_transactions ON public.transactions;

-- Budgets
DROP POLICY IF EXISTS allow_all_budgets ON public.budgets;
DROP POLICY IF EXISTS allow_user_budgets ON public.budgets;

-- Transfers
DROP POLICY IF EXISTS allow_all_transfers ON public.transfers;
DROP POLICY IF EXISTS allow_user_transfers ON public.transfers;

-- Financial Goals
DROP POLICY IF EXISTS allow_all_goals ON public.financial_goals;
DROP POLICY IF EXISTS allow_user_goals ON public.financial_goals;


-- ─────────────────────────────────────────────────────────────────────────
-- PHASE 1.5: ADD user_id TO ALL TABLES IF NOT EXISTS (SAFE FOR EXISTING DATA)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.transfers ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.financial_goals ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

-- ─────────────────────────────────────────────────────────────────────────
-- PHASE 2: ENABLE ROW LEVEL SECURITY (RLS) FOR ALL CORE TABLES
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────
-- PHASE 3: PRODUCTION RLS POLICY DEPLOYMENT
-- Restrict operations strictly to auth.uid() or verify ownership via relationships.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. public.wallets (Direct user_id ownership)
CREATE POLICY "allow_user_wallets" ON public.wallets
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. public.financial_goals (Direct user_id ownership)
CREATE POLICY "allow_user_goals" ON public.financial_goals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. public.categories (Read global categories OR user categories; write user categories only)
CREATE POLICY "allow_select_categories" ON public.categories
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "allow_write_categories" ON public.categories
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. public.transactions (Direct user_id ownership OR inherited via parent wallet ownership)
CREATE POLICY "allow_user_transactions" ON public.transactions
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.wallets
      WHERE wallets.id = transactions.wallet_id AND wallets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.wallets
      WHERE wallets.id = transactions.wallet_id AND wallets.user_id = auth.uid()
    )
  );

-- 5. public.budgets (Direct user_id ownership OR inherited via parent category ownership)
CREATE POLICY "allow_user_budgets" ON public.budgets
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid() OR
    (user_id IS NULL AND EXISTS (
      SELECT 1 FROM public.categories
      WHERE categories.id = budgets.category_id AND categories.user_id = auth.uid()
    ))
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- 6. public.transfers (Direct user_id ownership AND ownership of all referenced wallets/goals)
CREATE POLICY "allow_user_transfers" ON public.transfers
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid() AND
    (from_wallet_id IS NULL OR EXISTS (SELECT 1 FROM public.wallets WHERE wallets.id = transfers.from_wallet_id AND wallets.user_id = auth.uid())) AND
    (from_goal_id IS NULL OR EXISTS (SELECT 1 FROM public.financial_goals WHERE financial_goals.id = transfers.from_goal_id AND financial_goals.user_id = auth.uid())) AND
    (to_wallet_id IS NULL OR EXISTS (SELECT 1 FROM public.wallets WHERE wallets.id = transfers.to_wallet_id AND wallets.user_id = auth.uid())) AND
    (to_goal_id IS NULL OR EXISTS (SELECT 1 FROM public.financial_goals WHERE financial_goals.id = transfers.to_goal_id AND financial_goals.user_id = auth.uid()))
  )
  WITH CHECK (
    user_id = auth.uid() AND
    (from_wallet_id IS NULL OR EXISTS (SELECT 1 FROM public.wallets WHERE wallets.id = transfers.from_wallet_id AND wallets.user_id = auth.uid())) AND
    (from_goal_id IS NULL OR EXISTS (SELECT 1 FROM public.financial_goals WHERE financial_goals.id = transfers.from_goal_id AND financial_goals.user_id = auth.uid())) AND
    (to_wallet_id IS NULL OR EXISTS (SELECT 1 FROM public.wallets WHERE wallets.id = transfers.to_wallet_id AND wallets.user_id = auth.uid())) AND
    (to_goal_id IS NULL OR EXISTS (SELECT 1 FROM public.financial_goals WHERE financial_goals.id = transfers.to_goal_id AND financial_goals.user_id = auth.uid()))
  );


-- ─────────────────────────────────────────────────────────────────────────
-- PHASE 4: SECURITY DEFINER RPC HARDENING & INTERCEPTION
-- Hardening transfer functions to explicitly enforce ownership check queries.
-- ─────────────────────────────────────────────────────────────────────────

-- Hardened public.create_transfer_v2 RPC function
CREATE OR REPLACE FUNCTION public.create_transfer_v2(
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
  p_to_goal_id uuid,
  p_amount numeric,
  p_admin_fee numeric,
  p_notes text,
  p_transaction_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transfer_id uuid;
  v_category_id uuid;
  v_from_wallet_name text;
  v_to_name text;
  v_tx_id uuid;
BEGIN
  -- 🛡️ Mandatory security guard clause inside RPC (bypassed only if auth.uid() is null, e.g., service role tasks)
  IF auth.uid() IS NOT NULL THEN
    IF p_from_wallet_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = p_from_wallet_id AND user_id = auth.uid()) THEN
      RAISE EXCEPTION 'Access Denied: Unauthorized source wallet asset ownership';
    END IF;

    IF p_to_wallet_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = p_to_wallet_id AND user_id = auth.uid()) THEN
      RAISE EXCEPTION 'Access Denied: Unauthorized target wallet asset ownership';
    END IF;

    IF p_to_goal_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.financial_goals WHERE id = p_to_goal_id AND user_id = auth.uid()) THEN
      RAISE EXCEPTION 'Access Denied: Unauthorized target goal asset ownership';
    END IF;
  END IF;

  -- Get wallet name
  SELECT name INTO v_from_wallet_name FROM public.wallets WHERE id = p_from_wallet_id;
  IF v_from_wallet_name IS NULL THEN
    RAISE EXCEPTION 'Source wallet not found';
  END IF;

  -- Get destination name (either wallet or goal)
  IF p_to_wallet_id IS NOT NULL THEN
    SELECT name INTO v_to_name FROM public.wallets WHERE id = p_to_wallet_id;
    IF v_to_name IS NULL THEN
      RAISE EXCEPTION 'Destination wallet not found';
    END IF;
  ELSIF p_to_goal_id IS NOT NULL THEN
    SELECT name INTO v_to_name FROM public.financial_goals WHERE id = p_to_goal_id;
    IF v_to_name IS NULL THEN
      RAISE EXCEPTION 'Financial goal not found';
    END IF;
  ELSE
    RAISE EXCEPTION 'Destination wallet or goal must be specified';
  END IF;

  -- Insert transfer record
  INSERT INTO public.transfers (
    from_wallet_id,
    to_wallet_id,
    to_goal_id,
    amount,
    admin_fee,
    notes,
    transaction_date
  ) VALUES (
    p_from_wallet_id,
    p_to_wallet_id,
    p_to_goal_id,
    p_amount,
    p_admin_fee,
    p_notes,
    COALESCE(p_transaction_date, now())
  ) RETURNING id INTO v_transfer_id;

  -- Deduct from source wallet
  UPDATE public.wallets
  SET balance = balance - (p_amount + COALESCE(p_admin_fee, 0))
  WHERE id = p_from_wallet_id;

  -- Add to destination wallet if it's a wallet transfer
  IF p_to_wallet_id IS NOT NULL THEN
    UPDATE public.wallets
    SET balance = balance + p_amount
    WHERE id = p_to_wallet_id;
  END IF;

  -- If admin fee exists, write expense transaction
  IF p_admin_fee > 0 THEN
    SELECT id INTO v_category_id FROM public.categories WHERE name = 'Admin/Transfer Fee' AND type = 'EXPENSE' LIMIT 1;
    IF v_category_id IS NULL THEN
      INSERT INTO public.categories (name, type)
      VALUES ('Admin/Transfer Fee', 'EXPENSE')
      RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO public.transactions (
      wallet_id,
      category_id,
      amount,
      type,
      description,
      created_at
    ) VALUES (
      p_from_wallet_id,
      v_category_id,
      p_admin_fee,
      'EXPENSE',
      'Biaya admin transfer dari ' || v_from_wallet_name || ' ke ' || v_to_name,
      COALESCE(p_transaction_date, now())
    ) RETURNING id INTO v_tx_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'tx_id', v_tx_id
  );
END;
$$;


-- Hardened public.create_transfer_v3 RPC function (used by active client frontend code)
CREATE OR REPLACE FUNCTION public.create_transfer_v3(
  p_user_id uuid,

  p_from_wallet_id uuid,
  p_from_goal_id uuid,
  p_to_wallet_id uuid,
  p_to_goal_id uuid,
  p_amount numeric,
  p_admin_fee numeric,
  p_notes text,
  p_transaction_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transfer_id uuid;
  v_category_id uuid;
  v_from_name text;
  v_to_name text;
  v_tx_id uuid;
BEGIN
  -- 🛡️ Mandatory security guard clause inside RPC (bypassed only if p_user_id is null, e.g., service role tasks)
  IF p_user_id IS NOT NULL THEN
    IF p_from_wallet_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = p_from_wallet_id AND user_id = p_user_id) THEN
      RAISE EXCEPTION 'Access Denied: Unauthorized source wallet asset ownership';
    END IF;

    IF p_from_goal_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.financial_goals WHERE id = p_from_goal_id AND user_id = p_user_id) THEN
      RAISE EXCEPTION 'Access Denied: Unauthorized source goal asset ownership';
    END IF;

    IF p_to_wallet_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = p_to_wallet_id AND user_id = p_user_id) THEN
      RAISE EXCEPTION 'Access Denied: Unauthorized destination wallet asset ownership';
    END IF;

    IF p_to_goal_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.financial_goals WHERE id = p_to_goal_id AND user_id = p_user_id) THEN
      RAISE EXCEPTION 'Access Denied: Unauthorized destination goal asset ownership';
    END IF;
  END IF;

  -- Get source name
  IF p_from_wallet_id IS NOT NULL THEN
    SELECT name INTO v_from_name FROM public.wallets WHERE id = p_from_wallet_id;
  ELSIF p_from_goal_id IS NOT NULL THEN
    SELECT name INTO v_from_name FROM public.financial_goals WHERE id = p_from_goal_id;
  END IF;

  IF v_from_name IS NULL THEN
    RAISE EXCEPTION 'Source wallet or goal not found';
  END IF;

  -- Get destination name
  IF p_to_wallet_id IS NOT NULL THEN
    SELECT name INTO v_to_name FROM public.wallets WHERE id = p_to_wallet_id;
  ELSIF p_to_goal_id IS NOT NULL THEN
    SELECT name INTO v_to_name FROM public.financial_goals WHERE id = p_to_goal_id;
  END IF;

  IF v_to_name IS NULL THEN
    RAISE EXCEPTION 'Destination wallet or goal not found';
  END IF;

  -- Insert transfer record
  INSERT INTO public.transfers (
    from_wallet_id,
    from_goal_id,
    to_wallet_id,
    to_goal_id,
    amount,
    admin_fee,
    notes,
    transaction_date
  ) VALUES (
    p_from_wallet_id,
    p_from_goal_id,
    p_to_wallet_id,
    p_to_goal_id,
    p_amount,
    p_admin_fee,
    p_notes,
    COALESCE(p_transaction_date, now())
  ) RETURNING id INTO v_transfer_id;

  -- If admin fee exists, write expense transaction
  IF p_admin_fee > 0 AND p_from_wallet_id IS NOT NULL THEN
    SELECT id INTO v_category_id FROM public.categories WHERE name = 'Admin/Transfer Fee' AND type = 'EXPENSE' LIMIT 1;
    IF v_category_id IS NULL THEN
      INSERT INTO public.categories (name, type)
      VALUES ('Admin/Transfer Fee', 'EXPENSE')
      RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO public.transactions (
      wallet_id,
      category_id,
      amount,
      type,
      description,
      transfer_id,
      created_at
    ) VALUES (
      p_from_wallet_id,
      v_category_id,
      p_admin_fee,
      'EXPENSE',
      'Biaya admin transfer dari ' || v_from_name || ' ke ' || v_to_name,
      v_transfer_id,
      COALESCE(p_transaction_date, now())
    ) RETURNING id INTO v_tx_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'tx_id', v_tx_id
  );
END;
$$;

COMMIT;
