-- ============================================================
-- FinGram — Financial Goals (Saving Pocket) Schema & Setup
-- ============================================================

-- 1. Create financial_goals table
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT auth.uid(),
    name TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (current_amount >= 0),
    target_date DATE NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Performance Indexes for Goals
CREATE INDEX IF NOT EXISTS idx_financial_goals_status ON public.financial_goals(status);
CREATE INDEX IF NOT EXISTS idx_financial_goals_date ON public.financial_goals(target_date ASC);

-- 3. Row Level Security (RLS) for Goals
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_all_goals ON public.financial_goals;
CREATE POLICY "allow_all_goals"
  ON public.financial_goals FOR ALL USING (true) WITH CHECK (true);

-- 4. Alter transfers table to support polymorphic destinations
-- A. Make to_wallet_id nullable
ALTER TABLE public.transfers ALTER COLUMN to_wallet_id DROP NOT NULL;

-- B. Add to_goal_id column
ALTER TABLE public.transfers ADD COLUMN IF NOT EXISTS to_goal_id uuid REFERENCES public.financial_goals(id) ON DELETE CASCADE;

-- C. Add index for to_goal_id
CREATE INDEX IF NOT EXISTS idx_transfers_to_goal ON public.transfers(to_goal_id);

-- D. Drop existing check constraints on transfers if needed, then add the polymorphic check constraint
ALTER TABLE public.transfers DROP CONSTRAINT IF EXISTS check_transfer_destination;
ALTER TABLE public.transfers ADD CONSTRAINT check_transfer_destination
  CHECK (
    (to_wallet_id IS NOT NULL AND to_goal_id IS NULL) OR
    (to_wallet_id IS NULL AND to_goal_id IS NOT NULL)
  );

-- 5. Trigger Function & Trigger for Syncing saving pocket balance
CREATE OR REPLACE FUNCTION public.update_financial_goals_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF NEW.to_goal_id IS NOT NULL THEN
      UPDATE public.financial_goals
      SET current_amount = current_amount + NEW.amount
      WHERE id = NEW.to_goal_id;
    END IF;
  
  -- Handle UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- 1. Deduct old amount from old goal if it was a goal transfer
    IF OLD.to_goal_id IS NOT NULL THEN
      UPDATE public.financial_goals
      SET current_amount = current_amount - OLD.amount
      WHERE id = OLD.to_goal_id;
    END IF;
    -- 2. Add new amount to new goal if it is a goal transfer
    IF NEW.to_goal_id IS NOT NULL THEN
      UPDATE public.financial_goals
      SET current_amount = current_amount + NEW.amount
      WHERE id = NEW.to_goal_id;
    END IF;

  -- Handle DELETE
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.to_goal_id IS NOT NULL THEN
      UPDATE public.financial_goals
      SET current_amount = current_amount - OLD.amount
      WHERE id = OLD.to_goal_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_financial_goals_amount ON public.transfers;
CREATE TRIGGER trg_update_financial_goals_amount
AFTER INSERT OR UPDATE OR DELETE ON public.transfers
FOR EACH ROW
EXECUTE FUNCTION public.update_financial_goals_amount();

-- 6. RPC Function for Atomic Polymorphic Transfer
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
