-- ============================================================
-- FinGram — Transfers Module Schema & Initial Setup
-- ============================================================

-- 1. Create transfers table
CREATE TABLE IF NOT EXISTS public.transfers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    to_wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    admin_fee NUMERIC(15, 2) DEFAULT 0.00 CHECK (admin_fee >= 0),
    notes TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_transfers_from ON public.transfers(from_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON public.transfers(to_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON public.transfers(transaction_date DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_all_transfers ON public.transfers;
CREATE POLICY "allow_all_transfers"
  ON public.transfers FOR ALL USING (true) WITH CHECK (true);

-- 4. RPC Function for Atomic Database Transaction
CREATE OR REPLACE FUNCTION public.create_transfer_v1(
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
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
  v_to_wallet_name text;
  v_tx_id uuid;
BEGIN
  -- Get wallet names
  SELECT name INTO v_from_wallet_name FROM public.wallets WHERE id = p_from_wallet_id;
  SELECT name INTO v_to_wallet_name FROM public.wallets WHERE id = p_to_wallet_id;

  IF v_from_wallet_name IS NULL OR v_to_wallet_name IS NULL THEN
    RAISE EXCEPTION 'Source or destination wallet not found';
  END IF;

  -- Insert transfer record
  INSERT INTO public.transfers (
    from_wallet_id,
    to_wallet_id,
    amount,
    admin_fee,
    notes,
    transaction_date
  ) VALUES (
    p_from_wallet_id,
    p_to_wallet_id,
    p_amount,
    p_admin_fee,
    p_notes,
    COALESCE(p_transaction_date, now())
  ) RETURNING id INTO v_transfer_id;

  -- Deduct from source wallet
  UPDATE public.wallets
  SET balance = balance - (p_amount + COALESCE(p_admin_fee, 0))
  WHERE id = p_from_wallet_id;

  -- Add to destination wallet
  UPDATE public.wallets
  SET balance = balance + p_amount
  WHERE id = p_to_wallet_id;

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
      'Biaya admin transfer dari ' || v_from_wallet_name || ' ke ' || v_to_wallet_name,
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
