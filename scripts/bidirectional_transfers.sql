-- ============================================================
-- FinGram — Bidirectional Transfers & Deletion Synchronization
-- ============================================================

-- 1. Alter transfers table to support from_goal_id (nullable) and nullable from_wallet_id
ALTER TABLE public.transfers ALTER COLUMN from_wallet_id DROP NOT NULL;
ALTER TABLE public.transfers ADD COLUMN IF NOT EXISTS from_goal_id uuid REFERENCES public.financial_goals(id) ON DELETE CASCADE;

-- 2. Performance index for from_goal_id
CREATE INDEX IF NOT EXISTS idx_transfers_from_goal ON public.transfers(from_goal_id);

-- 3. Add column transfer_id in transactions for cascade delete
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transfer_id uuid REFERENCES public.transfers(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON public.transactions(transfer_id);

-- 4. Drop old constraints on transfers and recreate source/destination checks
ALTER TABLE public.transfers DROP CONSTRAINT IF EXISTS check_transfer_destination;
ALTER TABLE public.transfers DROP CONSTRAINT IF EXISTS check_transfer_source;

-- Ensure transfer has EXACTLY ONE source (wallet OR goal)
ALTER TABLE public.transfers ADD CONSTRAINT check_transfer_source
  CHECK (
    (from_wallet_id IS NOT NULL AND from_goal_id IS NULL) OR
    (from_wallet_id IS NULL AND from_goal_id IS NOT NULL)
  );

-- Ensure transfer has EXACTLY ONE destination (wallet OR goal)
ALTER TABLE public.transfers ADD CONSTRAINT check_transfer_destination
  CHECK (
    (to_wallet_id IS NOT NULL AND to_goal_id IS NULL) OR
    (to_wallet_id IS NULL AND to_goal_id IS NOT NULL)
  );


-- 5. Trigger Function & Trigger for Syncing financial goals (current_amount)
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
    IF NEW.from_goal_id IS NOT NULL THEN
      -- Check if reducing from_goal_id will make it negative
      IF EXISTS (
        SELECT 1 FROM public.financial_goals
        WHERE id = NEW.from_goal_id AND current_amount < NEW.amount
      ) THEN
        RAISE EXCEPTION 'Saldo kantong tabungan asal tidak mencukupi untuk melakukan transfer ini.';
      END IF;

      UPDATE public.financial_goals
      SET current_amount = current_amount - NEW.amount
      WHERE id = NEW.from_goal_id;
    END IF;
  
  -- Handle UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Check if update would result in a negative balance for goals
    -- Let's check from_goal_id
    IF NEW.from_goal_id IS NOT NULL THEN
      DECLARE
        v_current numeric;
        v_net_deduction numeric := NEW.amount;
      BEGIN
        IF OLD.from_goal_id = NEW.from_goal_id THEN
          v_net_deduction := NEW.amount - OLD.amount;
        END IF;
        
        SELECT current_amount INTO v_current FROM public.financial_goals WHERE id = NEW.from_goal_id;
        IF v_current < v_net_deduction THEN
          RAISE EXCEPTION 'Saldo kantong tabungan asal tidak mencukupi untuk perubahan transfer ini.';
        END IF;
      END;
    END IF;
    
    -- Check if to_goal_id subtraction (OLD.amount) is valid
    IF OLD.to_goal_id IS NOT NULL AND (NEW.to_goal_id IS NULL OR OLD.to_goal_id != NEW.to_goal_id) THEN
      IF EXISTS (
        SELECT 1 FROM public.financial_goals
        WHERE id = OLD.to_goal_id AND current_amount < OLD.amount
      ) THEN
        RAISE EXCEPTION 'Saldo kantong tabungan tujuan tidak mencukupi untuk memindahkan transfer ini.';
      END IF;
    END IF;

    -- 1. Deduct old target amount & add back old source amount
    IF OLD.to_goal_id IS NOT NULL THEN
      UPDATE public.financial_goals
      SET current_amount = current_amount - OLD.amount
      WHERE id = OLD.to_goal_id;
    END IF;
    IF OLD.from_goal_id IS NOT NULL THEN
      UPDATE public.financial_goals
      SET current_amount = current_amount + OLD.amount
      WHERE id = OLD.from_goal_id;
    END IF;

    -- 2. Add new target amount & deduct new source amount
    IF NEW.to_goal_id IS NOT NULL THEN
      UPDATE public.financial_goals
      SET current_amount = current_amount + NEW.amount
      WHERE id = NEW.to_goal_id;
    END IF;
    IF NEW.from_goal_id IS NOT NULL THEN
      UPDATE public.financial_goals
      SET current_amount = current_amount - NEW.amount
      WHERE id = NEW.from_goal_id;
    END IF;

  -- Handle DELETE
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.to_goal_id IS NOT NULL THEN
      -- Check if current_amount is enough to deduct OLD.amount (rollback of deposit)
      IF EXISTS (
        SELECT 1 FROM public.financial_goals
        WHERE id = OLD.to_goal_id AND current_amount < OLD.amount
      ) THEN
        RAISE EXCEPTION 'Saldo kantong tabungan tidak mencukupi untuk membatalkan transfer ini.';
      END IF;

      UPDATE public.financial_goals
      SET current_amount = current_amount - OLD.amount
      WHERE id = OLD.to_goal_id;
    END IF;
    IF OLD.from_goal_id IS NOT NULL THEN
      UPDATE public.financial_goals
      SET current_amount = current_amount + OLD.amount
      WHERE id = OLD.from_goal_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;


-- 6. Trigger Function & Trigger for Syncing wallet balances automatically
CREATE OR REPLACE FUNCTION public.sync_wallets_on_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF NEW.from_wallet_id IS NOT NULL THEN
      UPDATE public.wallets
      SET balance = balance - (NEW.amount + COALESCE(NEW.admin_fee, 0))
      WHERE id = NEW.from_wallet_id;
    END IF;
    IF NEW.to_wallet_id IS NOT NULL THEN
      UPDATE public.wallets
      SET balance = balance + NEW.amount
      WHERE id = NEW.to_wallet_id;
    END IF;

  -- Handle UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- A. Refund old values
    IF OLD.from_wallet_id IS NOT NULL THEN
      UPDATE public.wallets
      SET balance = balance + (OLD.amount + COALESCE(OLD.admin_fee, 0))
      WHERE id = OLD.from_wallet_id;
    END IF;
    IF OLD.to_wallet_id IS NOT NULL THEN
      UPDATE public.wallets
      SET balance = balance - OLD.amount
      WHERE id = OLD.to_wallet_id;
    END IF;

    -- B. Apply new values
    IF NEW.from_wallet_id IS NOT NULL THEN
      UPDATE public.wallets
      SET balance = balance - (NEW.amount + COALESCE(NEW.admin_fee, 0))
      WHERE id = NEW.from_wallet_id;
    END IF;
    IF NEW.to_wallet_id IS NOT NULL THEN
      UPDATE public.wallets
      SET balance = balance + NEW.amount
      WHERE id = NEW.to_wallet_id;
    END IF;

  -- Handle DELETE
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.from_wallet_id IS NOT NULL THEN
      UPDATE public.wallets
      SET balance = balance + (OLD.amount + COALESCE(OLD.admin_fee, 0))
      WHERE id = OLD.from_wallet_id;
    END IF;
    IF OLD.to_wallet_id IS NOT NULL THEN
      UPDATE public.wallets
      SET balance = balance - OLD.amount
      WHERE id = OLD.to_wallet_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_wallets_on_transfer ON public.transfers;
CREATE TRIGGER trg_sync_wallets_on_transfer
AFTER INSERT OR UPDATE OR DELETE ON public.transfers
FOR EACH ROW
EXECUTE FUNCTION public.sync_wallets_on_transfer();


-- 7. RPC Function for Atomic Polymorphic Transfer (v3)
CREATE OR REPLACE FUNCTION public.create_transfer_v3(
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
