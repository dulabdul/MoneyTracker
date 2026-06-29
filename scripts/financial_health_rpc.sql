-- ============================================================
-- MONTY — GAMIFIED FINANCIAL HEALTH SCORE RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_financial_health_score(
  p_user_id uuid,
  p_year int,
  p_month int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_income numeric := 0;
  v_expense numeric := 0;
  v_savings_rate numeric := 0;
  v_savings_score numeric := 0;

  v_total_budgets int := 0;
  v_breached_budgets int := 0;
  v_budget_score numeric := 0;

  v_credit_limit numeric := 0;
  v_credit_used numeric := 0;
  v_credit_utilization numeric := 0;
  v_credit_score numeric := 0;

  v_total_score int := 0;
  v_rank_label text := '';
  
  v_quests jsonb := '[]'::jsonb;
  
  v_start_date timestamptz;
  v_end_date timestamptz;
BEGIN
  -- 1. Security Check: ensure user can only query their own data (unless service_role where auth.uid() is null)
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access Denied: You can only view your own financial health.';
  END IF;

  -- Define date range for the month
  v_start_date := make_date(p_year, p_month, 1)::timestamptz;
  v_end_date := (v_start_date + interval '1 month' - interval '1 second');

  -- ==========================================================
  -- FACTOR 1: SAVINGS FACTOR (40 Points)
  -- ==========================================================
  
  -- Calculate Income
  SELECT COALESCE(SUM(amount), 0) INTO v_income
  FROM public.transactions t
  JOIN public.wallets w ON t.wallet_id = w.id
  WHERE w.user_id = p_user_id
    AND t.type = 'INCOME'
    AND t.created_at >= v_start_date
    AND t.created_at <= v_end_date;

  -- Calculate Expense
  SELECT COALESCE(SUM(amount), 0) INTO v_expense
  FROM public.transactions t
  JOIN public.wallets w ON t.wallet_id = w.id
  WHERE w.user_id = p_user_id
    AND t.type = 'EXPENSE'
    AND t.created_at >= v_start_date
    AND t.created_at <= v_end_date;

  -- Savings Rate
  IF v_income > 0 THEN
    v_savings_rate := ((v_income - v_expense) / v_income) * 100.0;
  ELSE
    IF v_expense > 0 THEN
      v_savings_rate := -100; -- Deficit without income
    ELSE
      v_savings_rate := 0;
    END IF;
  END IF;

  -- Calculate Savings Score
  IF v_income = 0 AND v_expense = 0 THEN
    -- Cold Start (No data yet)
    v_savings_score := 20; -- Give a neutral starting score instead of punishing them
    v_quests := v_quests || jsonb_build_object('id', 'savings_new', 'description', 'Belum ada transaksi bulan ini. Yuk mulai catat pemasukan dan pengeluaran pertamamu!', 'status', 'warning');
  ELSIF v_savings_rate >= 30 THEN
    v_savings_score := 40;
    v_quests := v_quests || jsonb_build_object('id', 'savings_good', 'description', 'Rasio tabungan sehat! Pertahankan di atas 30%.', 'status', 'success');
  ELSIF v_savings_rate >= 0 THEN
    v_savings_score := 10 + v_savings_rate;
    v_quests := v_quests || jsonb_build_object('id', 'savings_warning', 'description', 'Tabunganmu pas-pasan. Coba kurangi pengeluaran agar rasio tabungan mencapai 30%.', 'status', 'warning');
  ELSE
    v_savings_score := 0;
    v_quests := v_quests || jsonb_build_object('id', 'savings_danger', 'description', 'Pengeluaran lebih besar dari pemasukan bulan ini! Segera rem pengeluaranmu.', 'status', 'danger');
  END IF;


  -- ==========================================================
  -- FACTOR 2: BUDGET COMPLIANCE (40 Points)
  -- ==========================================================
  
  -- We query all budgets belonging to the user for this month
  WITH UserBudgets AS (
    SELECT 
      b.id,
      b.category_id,
      b.limit_amount,
      c.name as category_name
    FROM public.budgets b
    JOIN public.categories c ON b.category_id = c.id
    WHERE b.month = p_month 
      AND b.year = p_year
      AND (c.user_id = p_user_id OR c.user_id IS NULL) -- System categories might be used
      -- We need to make sure the user actually owns the budget.
      -- Wait, budgets has a user_id? We added it in Phase 1.5!
      AND b.user_id = p_user_id
  ),
  BudgetSpending AS (
    SELECT 
      ub.category_id,
      ub.limit_amount,
      ub.category_name,
      COALESCE(SUM(t.amount), 0) as spent
    FROM UserBudgets ub
    LEFT JOIN public.transactions t 
      ON t.category_id = ub.category_id 
      AND t.type = 'EXPENSE'
      AND t.created_at >= v_start_date 
      AND t.created_at <= v_end_date
      AND EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = t.wallet_id AND w.user_id = p_user_id)
    GROUP BY ub.category_id, ub.limit_amount, ub.category_name
  )
  SELECT 
    COUNT(*), 
    COUNT(*) FILTER (WHERE spent > limit_amount)
  INTO v_total_budgets, v_breached_budgets
  FROM BudgetSpending;

  IF v_total_budgets > 0 THEN
    v_budget_score := 40.0 * (1.0 - (v_breached_budgets::numeric / v_total_budgets::numeric));
    
    IF v_breached_budgets > 0 THEN
      v_quests := v_quests || jsonb_build_object('id', 'budget_danger', 'description', v_breached_budgets || ' kategori pengeluaran menembus batas anggaran. Perketat ikat pinggangmu!', 'status', 'danger');
    ELSE
      v_quests := v_quests || jsonb_build_object('id', 'budget_good', 'description', 'Luar biasa! Tidak ada anggaran yang jebol bulan ini.', 'status', 'success');
    END IF;
  ELSE
    -- No budgets set, give a baseline neutral score (20 out of 40)
    v_budget_score := 20;
    v_quests := v_quests || jsonb_build_object('id', 'budget_none', 'description', 'Belum ada anggaran (budget) bulan ini. Yuk, buat sekarang agar keuanganmu terkontrol!', 'status', 'warning');
  END IF;

  -- ==========================================================
  -- FACTOR 3: CREDIT HEALTH FACTOR (20 Points)
  -- ==========================================================
  
  SELECT 
    COALESCE(SUM(credit_limit), 0),
    COALESCE(SUM(CASE WHEN balance < 0 THEN abs(balance) ELSE 0 END), 0)
  INTO v_credit_limit, v_credit_used
  FROM public.wallets
  WHERE user_id = p_user_id
    AND account_type IN ('paylater', 'credit_card');

  IF v_credit_limit > 0 THEN
    v_credit_utilization := (v_credit_used / v_credit_limit) * 100.0;
    
    IF v_credit_utilization <= 30 THEN
      v_credit_score := 20;
      IF v_credit_limit > 0 AND v_credit_used > 0 THEN
         v_quests := v_quests || jsonb_build_object('id', 'credit_good', 'description', 'Pemakaian paylater/kredit aman (di bawah 30%). Bagus!', 'status', 'success');
      END IF;
    ELSE
      -- Drop linearly from 30% to 100%
      IF v_credit_utilization >= 100 THEN
        v_credit_score := 0;
        v_quests := v_quests || jsonb_build_object('id', 'credit_maxed', 'description', 'AWAS! Limit kreditmu sudah habis (100%). Segera lunasi sebelum jatuh tempo!', 'status', 'danger');
      ELSE
        v_credit_score := 20.0 * ((100.0 - v_credit_utilization) / 70.0);
        v_quests := v_quests || jsonb_build_object('id', 'credit_warning', 'description', 'Hati-hati! Pemakaian kredit mencapai ' || ROUND(v_credit_utilization, 1) || '%. Skor mulai terkikis.', 'status', 'warning');
      END IF;
    END IF;
  ELSE
    -- No credit accounts -> Full score
    v_credit_score := 20;
  END IF;

  -- ==========================================================
  -- FINAL SCORE CALCULATION
  -- ==========================================================
  v_total_score := ROUND(v_savings_score + v_budget_score + v_credit_score);
  
  -- Map to Rank
  IF v_total_score >= 85 THEN
    v_rank_label := 'Cashflow Overlord';
  ELSIF v_total_score >= 70 THEN
    v_rank_label := 'Wealth Sentinel';
  ELSIF v_total_score >= 50 THEN
    v_rank_label := 'Frugal Padawan';
  ELSE
    v_rank_label := 'Subsistence Goblin';
  END IF;

  RETURN jsonb_build_object(
    'score', v_total_score,
    'rank_label', v_rank_label,
    'quests', v_quests,
    'breakdown', jsonb_build_object(
      'savings_score', ROUND(v_savings_score),
      'budget_score', ROUND(v_budget_score),
      'credit_score', ROUND(v_credit_score),
      'savings_rate', ROUND(v_savings_rate, 2),
      'credit_utilization', ROUND(v_credit_utilization, 2)
    )
  );
END;
$$;
