-- ============================================================
-- FinGram — Advanced Analytics RPC Functions
-- Paste seluruh isi ini ke Supabase SQL Editor → Run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. get_analytics_summary()
--    Top Summary Cards: Net Worth, Savings Rate, Financial Runway
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_analytics_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_liquid numeric := 0;
  v_total_portfolio numeric := 0;
  v_total_net_worth numeric := 0;
  v_total_income numeric := 0;
  v_total_to_goals numeric := 0;
  v_savings_rate numeric := 0;
  v_avg_monthly_expense numeric := 0;
  v_financial_runway numeric := 0;
BEGIN
  -- Total liquid cash (sum of all wallet balances)
  SELECT COALESCE(SUM(balance), 0) INTO v_total_liquid
  FROM public.wallets;

  -- Total portfolio value (sum of current_value from assets_portfolio)
  SELECT COALESCE(SUM(current_value), 0) INTO v_total_portfolio
  FROM public.assets_portfolio;

  -- Net Worth = Liquid + Portfolio
  v_total_net_worth := v_total_liquid + v_total_portfolio;

  -- Total income (all INCOME transactions ever)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_income
  FROM public.transactions
  WHERE type = 'INCOME';

  -- Total funds transferred TO goals (via transfers with to_goal_id)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_to_goals
  FROM public.transfers
  WHERE to_goal_id IS NOT NULL;

  -- Savings Rate = (Total to Goals / Total Income) × 100
  IF v_total_income > 0 THEN
    v_savings_rate := ROUND((v_total_to_goals / v_total_income) * 100, 1);
  END IF;

  -- Average monthly expense (last 3 months)
  -- We calculate from the last 3 distinct months that have EXPENSE transactions
  SELECT COALESCE(AVG(monthly_total), 0) INTO v_avg_monthly_expense
  FROM (
    SELECT DATE_TRUNC('month', created_at) AS m, SUM(amount) AS monthly_total
    FROM public.transactions
    WHERE type = 'EXPENSE'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY m DESC
    LIMIT 3
  ) sub;

  -- Financial Runway = Liquid Cash / Avg Monthly Expense
  IF v_avg_monthly_expense > 0 THEN
    v_financial_runway := ROUND(v_total_liquid / v_avg_monthly_expense, 1);
  END IF;

  RETURN jsonb_build_object(
    'total_net_worth', v_total_net_worth,
    'total_liquid', v_total_liquid,
    'total_portfolio', v_total_portfolio,
    'total_income', v_total_income,
    'total_to_goals', v_total_to_goals,
    'savings_rate', v_savings_rate,
    'avg_monthly_expense', v_avg_monthly_expense,
    'financial_runway', v_financial_runway
  );
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 2. get_cashflow_analytics(p_year int, p_month int DEFAULT NULL, p_period text DEFAULT 'month')
--    Tab 1: Monthly/Weekly/Daily inflow/outflow trend, daily heatmap, top 5 expenses
-- ────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_cashflow_analytics(int, int);
CREATE OR REPLACE FUNCTION public.get_cashflow_analytics(
  p_year int DEFAULT 2026,
  p_month int DEFAULT NULL,
  p_period text DEFAULT 'month'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_monthly_trend jsonb;
  v_daily_heatmap jsonb;
  v_top_expenses jsonb;
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_year_start timestamptz;
  v_year_end timestamptz;
BEGIN
  v_year_start := make_timestamptz(p_year, 1, 1, 0, 0, 0);
  v_year_end := make_timestamptz(p_year, 12, 31, 23, 59, 59);

  -- 1. Inflow vs Outflow Trend
  IF p_period = 'year' THEN
    -- Weekly cashflow trend for the entire year
    SELECT COALESCE(jsonb_agg(row_to_json(sub) ORDER BY sub.month_num), '[]'::jsonb)
    INTO v_monthly_trend
    FROM (
      SELECT
        EXTRACT(WEEK FROM w.week)::int AS month_num, -- Keep key as month_num for frontend compatibility
        'W' || EXTRACT(WEEK FROM w.week)::text AS month_label, -- e.g. W1, W2, etc.
        COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE 0 END), 0) AS inflow,
        COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END), 0) AS outflow
      FROM generate_series(
        v_year_start::date,
        v_year_end::date,
        '1 week'::interval
      ) w(week)
      LEFT JOIN public.transactions t ON 
        t.created_at >= w.week AND 
        t.created_at < (w.week + INTERVAL '1 week')
      GROUP BY w.week
      ORDER BY w.week
    ) sub;
  ELSIF p_month IS NOT NULL THEN
    v_start_time := make_timestamptz(p_year, p_month, 1, 0, 0, 0);
    v_end_time := (v_start_time + INTERVAL '1 month' - INTERVAL '1 second');

    -- Daily cashflow trend for the specific month
    SELECT COALESCE(jsonb_agg(row_to_json(sub) ORDER BY sub.month_num), '[]'::jsonb)
    INTO v_monthly_trend
    FROM (
      SELECT
        EXTRACT(DAY FROM d.day)::int AS month_num,
        TO_CHAR(d.day, 'FMDD') AS month_label,
        COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE 0 END), 0) AS inflow,
        COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END), 0) AS outflow
      FROM generate_series(
        v_start_time::date,
        v_end_time::date,
        '1 day'::interval
      ) d(day)
      LEFT JOIN public.transactions t ON t.created_at::date = d.day
      GROUP BY d.day
      ORDER BY d.day
    ) sub;
  ELSE
    -- Monthly cashflow trend for the entire year
    SELECT COALESCE(jsonb_agg(row_to_json(sub) ORDER BY sub.month_num), '[]'::jsonb)
    INTO v_monthly_trend
    FROM (
      SELECT
        EXTRACT(MONTH FROM m.month)::int AS month_num,
        TO_CHAR(m.month, 'Mon') AS month_label,
        COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE 0 END), 0) AS inflow,
        COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END), 0) AS outflow
      FROM generate_series(
        v_year_start::date,
        v_year_end::date,
        '1 month'::interval
      ) m(month)
      LEFT JOIN public.transactions t ON 
        t.created_at >= m.month AND 
        t.created_at < (m.month + INTERVAL '1 month')
      GROUP BY m.month
      ORDER BY m.month
    ) sub;
  END IF;

  -- 2. Daily heatmap (always for the whole year)
  SELECT COALESCE(jsonb_agg(row_to_json(sub) ORDER BY sub.date), '[]'::jsonb)
  INTO v_daily_heatmap
  FROM (
    SELECT
      TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
      SUM(amount) AS amount,
      COUNT(*)::int AS count
    FROM public.transactions
    WHERE type = 'EXPENSE'
      AND created_at >= v_year_start AND created_at <= v_year_end
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY date
  ) sub;

  -- 3. Top 5 expenses
  IF p_month IS NOT NULL AND p_period = 'month' THEN
    v_start_time := make_timestamptz(p_year, p_month, 1, 0, 0, 0);
    v_end_time := (v_start_time + INTERVAL '1 month' - INTERVAL '1 second');

    SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
    INTO v_top_expenses
    FROM (
      SELECT
        c.name AS category,
        SUM(t.amount) AS amount
      FROM public.transactions t
      JOIN public.categories c ON t.category_id = c.id
      WHERE t.type = 'EXPENSE'
        AND t.created_at >= v_start_time AND t.created_at <= v_end_time
      GROUP BY c.name
      ORDER BY amount DESC
      LIMIT 5
    ) sub;
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
    INTO v_top_expenses
    FROM (
      SELECT
        c.name AS category,
        SUM(t.amount) AS amount
      FROM public.transactions t
      JOIN public.categories c ON t.category_id = c.id
      WHERE t.type = 'EXPENSE'
        AND t.created_at >= v_year_start AND t.created_at <= v_year_end
      GROUP BY c.name
      ORDER BY amount DESC
      LIMIT 5
    ) sub;
  END IF;

  RETURN jsonb_build_object(
    'monthly_trend', v_monthly_trend,
    'daily_heatmap', v_daily_heatmap,
    'top_expenses', v_top_expenses
  );
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 3. get_networth_analytics()
--    Tab 2: Portfolio breakdown by asset type + liquid vs invested
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_networth_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_liquid numeric := 0;
  v_portfolio_by_type jsonb;
  v_total_portfolio numeric := 0;
  v_total_invested numeric := 0;
  v_wallets jsonb;
BEGIN
  -- Total liquid
  SELECT COALESCE(SUM(balance), 0) INTO v_total_liquid
  FROM public.wallets;

  -- Portfolio breakdown by asset type
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
  INTO v_portfolio_by_type
  FROM (
    SELECT
      asset_type AS type,
      COUNT(*)::int AS count,
      SUM(current_value) AS value,
      SUM(
        CASE
          WHEN asset_type = 'Stocks' THEN total_units * 100 * average_buy_price
          ELSE total_units * average_buy_price
        END
      ) AS cost_basis
    FROM public.assets_portfolio
    GROUP BY asset_type
    ORDER BY value DESC
  ) sub;

  -- Total portfolio value
  SELECT COALESCE(SUM(current_value), 0) INTO v_total_portfolio
  FROM public.assets_portfolio;

  -- Total invested (cost basis)
  SELECT COALESCE(SUM(
    CASE
      WHEN asset_type = 'Stocks' THEN total_units * 100 * average_buy_price
      ELSE total_units * average_buy_price
    END
  ), 0) INTO v_total_invested
  FROM public.assets_portfolio;

  -- Wallet breakdown
  SELECT COALESCE(jsonb_agg(row_to_json(sub) ORDER BY sub.balance DESC), '[]'::jsonb)
  INTO v_wallets
  FROM (
    SELECT name, balance FROM public.wallets ORDER BY balance DESC
  ) sub;

  RETURN jsonb_build_object(
    'total_liquid', v_total_liquid,
    'total_portfolio', v_total_portfolio,
    'total_invested', v_total_invested,
    'total_net_worth', v_total_liquid + v_total_portfolio,
    'unrealized_gain', v_total_portfolio - v_total_invested,
    'portfolio_by_type', v_portfolio_by_type,
    'wallets', v_wallets
  );
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 4. get_budget_analytics(p_year int, p_month int, p_period text DEFAULT 'month')
--    Tab 3: Budget vs Realisasi per kategori (atau per Bulan jika period = 'year'), compliance score
-- ────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_budget_analytics(int, int);
CREATE OR REPLACE FUNCTION public.get_budget_analytics(
  p_year int DEFAULT 2026,
  p_month int DEFAULT 6,
  p_period text DEFAULT 'month'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_categories jsonb;
  v_compliance_score numeric := 0;
  v_total_budget numeric := 0;
  v_total_spent numeric := 0;
  v_total_categories int := 0;
  v_compliant_categories int := 0;
  v_month_start timestamptz;
  v_month_end timestamptz;
  v_year_start timestamptz;
  v_year_end timestamptz;
BEGIN
  v_year_start := make_timestamptz(p_year, 1, 1, 0, 0, 0);
  v_year_end := make_timestamptz(p_year, 12, 31, 23, 59, 59);

  IF p_period = 'year' THEN
    -- Monthly budget vs spent for all 12 months of the year
    SELECT
      COALESCE(jsonb_agg(row_to_json(sub) ORDER BY sub.month_num), '[]'::jsonb),
      COALESCE(SUM(sub.budget_limit), 0),
      COALESCE(SUM(sub.spent), 0),
      COUNT(*),
      COUNT(*) FILTER (WHERE sub.spent <= sub.budget_limit)
    INTO v_categories, v_total_budget, v_total_spent, v_total_categories, v_compliant_categories
    FROM (
      SELECT
        EXTRACT(MONTH FROM m.month)::int AS month_num,
        TO_CHAR(m.month, 'Mon') AS category_name, -- Keep key as category_name so frontend Zod parsing works without schema changes
        COALESCE(b_agg.total_budget, 0) AS budget_limit,
        COALESCE(tx_agg.total_spent, 0) AS spent,
        CASE
          WHEN COALESCE(b_agg.total_budget, 0) > 0 THEN 
            ROUND((COALESCE(tx_agg.total_spent, 0) / b_agg.total_budget) * 100, 1)
          ELSE 0
        END AS usage_pct
      FROM generate_series(
        make_date(p_year, 1, 1),
        make_date(p_year, 12, 1),
        '1 month'::interval
      ) m(month)
      -- Aggregate budgets for each month
      LEFT JOIN (
        SELECT month, year, SUM(limit_amount) AS total_budget
        FROM public.budgets
        WHERE year = p_year
        GROUP BY month, year
      ) b_agg ON b_agg.month = EXTRACT(MONTH FROM m.month)::int
      -- Aggregate transactions for each month
      LEFT JOIN (
        SELECT 
          EXTRACT(MONTH FROM created_at)::int AS month_num,
          SUM(amount) AS total_spent
        FROM public.transactions
        WHERE type = 'EXPENSE'
          AND created_at >= v_year_start AND created_at <= v_year_end
        GROUP BY EXTRACT(MONTH FROM created_at)
      ) tx_agg ON tx_agg.month_num = EXTRACT(MONTH FROM m.month)::int
    ) sub;
  ELSE
    -- Original monthly budget vs spent (by category)
    v_month_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0);
    v_month_end := (v_month_start + INTERVAL '1 month' - INTERVAL '1 second');

    SELECT
      COALESCE(jsonb_agg(row_to_json(sub) ORDER BY sub.spent DESC), '[]'::jsonb),
      COALESCE(SUM(sub.budget_limit), 0),
      COALESCE(SUM(sub.spent), 0),
      COUNT(*),
      COUNT(*) FILTER (WHERE sub.spent <= sub.budget_limit)
    INTO v_categories, v_total_budget, v_total_spent, v_total_categories, v_compliant_categories
    FROM (
      SELECT
        c.name AS category_name,
        b.limit_amount AS budget_limit,
        COALESCE(tx_agg.total_spent, 0) AS spent,
        CASE
          WHEN b.limit_amount > 0 THEN ROUND((COALESCE(tx_agg.total_spent, 0) / b.limit_amount) * 100, 1)
          ELSE 0
        END AS usage_pct
      FROM public.budgets b
      JOIN public.categories c ON b.category_id = c.id
      LEFT JOIN (
        SELECT category_id, SUM(amount) AS total_spent
        FROM public.transactions
        WHERE type = 'EXPENSE'
          AND created_at >= v_month_start
          AND created_at <= v_month_end
        GROUP BY category_id
      ) tx_agg ON tx_agg.category_id = b.category_id
      WHERE b.month = p_month AND b.year = p_year
    ) sub;
  END IF;

  -- Compliance Score = compliant / total × 100
  IF v_total_categories > 0 THEN
    v_compliance_score := ROUND((v_compliant_categories::numeric / v_total_categories) * 100, 0);
  END IF;

  RETURN jsonb_build_object(
    'categories', v_categories,
    'compliance_score', v_compliance_score,
    'total_budget', v_total_budget,
    'total_spent', v_total_spent,
    'total_categories', v_total_categories,
    'compliant_categories', v_compliant_categories
  );
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 5. get_goals_analytics()
--    Tab 4: Goal velocity, fund flow, projected completion dates
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_goals_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_goals jsonb;
  v_fund_flow jsonb;
  v_total_fund_flow numeric := 0;
  v_total_target numeric := 0;
  v_total_saved numeric := 0;
BEGIN
  -- Goal details with velocity and projected completion
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
  INTO v_goals
  FROM (
    SELECT
      g.id,
      g.name,
      g.target_amount,
      g.current_amount,
      g.target_date,
      g.status,
      g.created_at,
      CASE
        WHEN g.target_amount > 0 THEN ROUND((g.current_amount / g.target_amount) * 100, 1)
        ELSE 0
      END AS progress_pct,
      -- Days since created
      GREATEST(1, EXTRACT(DAY FROM (NOW() - g.created_at))::int) AS days_active,
      -- Monthly velocity (avg amount saved per month since creation)
      CASE
        WHEN EXTRACT(EPOCH FROM (NOW() - g.created_at)) > 86400 THEN
          ROUND(g.current_amount / GREATEST(1, EXTRACT(DAY FROM (NOW() - g.created_at))::numeric / 30), 0)
        ELSE g.current_amount
      END AS monthly_velocity,
      -- Remaining amount
      GREATEST(0, g.target_amount - g.current_amount) AS remaining_amount,
      -- Days remaining to target_date
      GREATEST(0, (g.target_date - CURRENT_DATE)) AS days_to_target,
      -- Projected completion date based on velocity
      CASE
        WHEN g.current_amount >= g.target_amount THEN NULL -- Already achieved
        WHEN g.current_amount > 0 AND EXTRACT(EPOCH FROM (NOW() - g.created_at)) > 86400 THEN
          CURRENT_DATE + (
            ((g.target_amount - g.current_amount) /
            (g.current_amount / GREATEST(1, EXTRACT(DAY FROM (NOW() - g.created_at))::numeric)))
          )::int
        ELSE NULL -- Not enough data to project
      END AS projected_date
    FROM public.financial_goals g
    WHERE g.status = 'active'
    ORDER BY g.target_date ASC
  ) sub;

  -- Fund flow: transfers to goals grouped by source wallet and destination goal
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
  INTO v_fund_flow
  FROM (
    SELECT
      COALESCE(w.name, 'Unknown') AS source,
      COALESCE(g.name, 'Unknown') AS destination,
      SUM(t.amount) AS amount,
      COUNT(*)::int AS transfer_count
    FROM public.transfers t
    LEFT JOIN public.wallets w ON t.from_wallet_id = w.id
    LEFT JOIN public.financial_goals g ON t.to_goal_id = g.id
    WHERE t.to_goal_id IS NOT NULL
    GROUP BY w.name, g.name
    ORDER BY amount DESC
  ) sub;

  -- Totals
  SELECT COALESCE(SUM(amount), 0) INTO v_total_fund_flow
  FROM public.transfers WHERE to_goal_id IS NOT NULL;

  SELECT
    COALESCE(SUM(target_amount), 0),
    COALESCE(SUM(current_amount), 0)
  INTO v_total_target, v_total_saved
  FROM public.financial_goals
  WHERE status = 'active';

  RETURN jsonb_build_object(
    'goals', v_goals,
    'fund_flow', v_fund_flow,
    'total_fund_flow', v_total_fund_flow,
    'total_target', v_total_target,
    'total_saved', v_total_saved,
    'overall_progress_pct', CASE
      WHEN v_total_target > 0 THEN ROUND((v_total_saved / v_total_target) * 100, 1)
      ELSE 0
    END
  );
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 6. get_dashboard_stats()
--    Aggregated Dashboard Stats: Consolidates 6+ REST API queries into 1 RPC
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_week_start timestamptz,
  p_week_end timestamptz,
  p_prev_week_start timestamptz,
  p_prev_week_end timestamptz,
  p_year_start timestamptz,
  p_year_end timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_balance numeric := 0;
  v_wallets jsonb;
  v_recent_transactions jsonb;
  v_monthly_income numeric := 0;
  v_monthly_expense numeric := 0;
  v_income_by_category jsonb;
  v_expense_by_category jsonb;
  v_monthly_income_history jsonb;
  v_weekly_expenses jsonb;
  v_prev_weekly_expenses jsonb;
  v_ytd_income numeric := 0;
  v_ytd_expense numeric := 0;
BEGIN
  -- 1. Total Balance (liquid wallets only: cash, bank, ewallet)
  SELECT COALESCE(SUM(balance), 0) INTO v_total_balance
  FROM public.wallets
  WHERE account_type NOT IN ('paylater', 'credit_card');

  -- 2. Wallets List (all wallets including credit accounts, with new metadata)
  SELECT COALESCE(jsonb_agg(row_to_json(w)), '[]'::jsonb) INTO v_wallets
  FROM (
    SELECT id, name, balance, account_type, credit_limit,
           billing_date, billing_month_offset,
           due_date, due_month_offset
    FROM public.wallets ORDER BY name ASC
  ) w;

  -- 3. Recent Transactions
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb) INTO v_recent_transactions
  FROM (
    SELECT 
      t.id,
      t.wallet_id,
      t.category_id,
      t.amount,
      t.type,
      t.description,
      t.created_at,
      w.name AS wallet_name,
      c.name AS category_name
    FROM public.transactions t
    LEFT JOIN public.wallets w ON t.wallet_id = w.id
    LEFT JOIN public.categories c ON t.category_id = c.id
    ORDER BY t.created_at DESC
    LIMIT 5
  ) r;

  -- 4. Monthly totals
  SELECT
    COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)
  INTO v_monthly_income, v_monthly_expense
  FROM public.transactions
  WHERE created_at >= p_start_time AND created_at <= p_end_time;

  -- 5. Income by category
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO v_income_by_category
  FROM (
    SELECT c.name AS category, SUM(t.amount) AS amount
    FROM public.transactions t
    JOIN public.categories c ON t.category_id = c.id
    WHERE t.type = 'INCOME' AND t.created_at >= p_start_time AND t.created_at <= p_end_time
    GROUP BY c.name
    ORDER BY amount DESC
    LIMIT 6
  ) sub;

  -- 6. Expense by category
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO v_expense_by_category
  FROM (
    SELECT c.name AS category, SUM(t.amount) AS amount
    FROM public.transactions t
    JOIN public.categories c ON t.category_id = c.id
    WHERE t.type = 'EXPENSE' AND t.created_at >= p_start_time AND t.created_at <= p_end_time
    GROUP BY c.name
    ORDER BY amount DESC
    LIMIT 6
  ) sub;

  -- 7. Monthly income history (YTD history)
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO v_monthly_income_history
  FROM (
    SELECT
      TO_CHAR(m.month, 'Mon') AS month,
      EXTRACT(MONTH FROM m.month)::int AS month_index,
      COALESCE(SUM(t.amount), 0) AS income
    FROM generate_series(
      p_year_start::date,
      p_year_end::date,
      '1 month'::interval
    ) m(month)
    LEFT JOIN public.transactions t ON
      t.type = 'INCOME' AND
      t.created_at >= m.month AND
      t.created_at < (m.month + INTERVAL '1 month')
    GROUP BY m.month
    ORDER BY m.month
  ) sub;

  -- 8. Weekly expenses
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO v_weekly_expenses
  FROM (
    SELECT
      TO_CHAR(d.day, 'Dy') AS day,
      EXTRACT(ISODOW FROM d.day)::int AS day_index,
      COALESCE(SUM(t.amount), 0) AS amount
    FROM generate_series(
      p_week_start::date,
      p_week_end::date,
      '1 day'::interval
    ) d(day)
    LEFT JOIN public.transactions t ON
      t.type = 'EXPENSE' AND
      t.created_at::date = d.day
    GROUP BY d.day
    ORDER BY d.day
  ) sub;

  -- 9. Previous weekly expenses
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO v_prev_weekly_expenses
  FROM (
    SELECT
      TO_CHAR(d.day, 'Dy') AS day,
      EXTRACT(ISODOW FROM d.day)::int AS day_index,
      COALESCE(SUM(t.amount), 0) AS amount
    FROM generate_series(
      p_prev_week_start::date,
      p_prev_week_end::date,
      '1 day'::interval
    ) d(day)
    LEFT JOIN public.transactions t ON
      t.type = 'EXPENSE' AND
      t.created_at::date = d.day
    GROUP BY d.day
    ORDER BY d.day
  ) sub;

  -- 10. YTD totals
  SELECT
    COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)
  INTO v_ytd_income, v_ytd_expense
  FROM public.transactions
  WHERE created_at >= p_year_start AND created_at <= p_year_end;

  RETURN jsonb_build_object(
    'total_balance', v_total_balance,
    'wallets', v_wallets,
    'recent_transactions', v_recent_transactions,
    'monthly_income', v_monthly_income,
    'monthly_expense', v_monthly_expense,
    'income_by_category', v_income_by_category,
    'expense_by_category', v_expense_by_category,
    'monthly_income_history', v_monthly_income_history,
    'weekly_expenses', v_weekly_expenses,
    'prev_weekly_expenses', v_prev_weekly_expenses,
    'ytd_income', v_ytd_income,
    'ytd_expense', v_ytd_expense
  );
END;
$$;
