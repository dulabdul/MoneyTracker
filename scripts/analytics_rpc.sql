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
  v_three_month_burn_rate numeric := 0;
  v_financial_runway numeric := 0;
  v_extended_runway numeric := 0;
BEGIN
  -- Total liquid cash (sum of all wallet balances)
  SELECT COALESCE(SUM(balance), 0) INTO v_total_liquid
  FROM public.wallets
  WHERE user_id = auth.uid();

  -- Total portfolio value (sum of current_value from assets_portfolio)
  SELECT COALESCE(SUM(current_value), 0) INTO v_total_portfolio
  FROM public.assets_portfolio
  WHERE user_id = auth.uid();

  -- Net Worth = Liquid + Portfolio
  v_total_net_worth := v_total_liquid + v_total_portfolio;

  -- Total income (all INCOME transactions ever)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_income
  FROM public.transactions
  WHERE type = 'INCOME' AND user_id = auth.uid();

  -- Total funds transferred TO goals (via transfers with to_goal_id)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_to_goals
  FROM public.transfers
  WHERE to_goal_id IS NOT NULL AND user_id = auth.uid();

  -- Savings Rate = (Total to Goals / Total Income) × 100
  IF v_total_income > 0 THEN
    v_savings_rate := ROUND((v_total_to_goals / v_total_income) * 100, 1);
  END IF;

  -- 3-Month Trailing Burn Rate using partitioned window
  SELECT COALESCE(AVG(monthly_total), 0) INTO v_three_month_burn_rate
  FROM (
    SELECT
      DATE_TRUNC('month', created_at) AS m,
      SUM(amount) AS monthly_total,
      DENSE_RANK() OVER (ORDER BY DATE_TRUNC('month', created_at) DESC) as rnk
    FROM public.transactions
    WHERE type = 'EXPENSE' AND user_id = auth.uid()
    GROUP BY DATE_TRUNC('month', created_at)
  ) sub
  WHERE rnk <= 3;
  
  v_avg_monthly_expense := v_three_month_burn_rate;

  -- Financial Runway and Extended Runway
  IF v_three_month_burn_rate > 0 THEN
    v_financial_runway := ROUND(v_total_liquid / v_three_month_burn_rate, 1);
    v_extended_runway := ROUND((v_total_liquid + v_total_portfolio) / v_three_month_burn_rate, 1);
  END IF;

  RETURN jsonb_build_object(
    'total_net_worth', v_total_net_worth,
    'total_liquid', v_total_liquid,
    'total_portfolio', v_total_portfolio,
    'total_income', v_total_income,
    'total_to_goals', v_total_to_goals,
    'savings_rate', v_savings_rate,
    'avg_monthly_expense', v_avg_monthly_expense,
    'three_month_burn_rate', v_three_month_burn_rate,
    'financial_runway', v_financial_runway,
    'extended_runway', v_extended_runway
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
  
  -- Temporal Behavioral Insights variables
  v_weekend_total numeric := 0;
  v_weekday_total numeric := 0;
  v_weekend_ratio numeric := 0;
  v_weekday_ratio numeric := 0;
  v_payday_effect jsonb;
  v_temporal_insights jsonb;
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
        EXTRACT(WEEK FROM w.week)::int AS month_num,
        'W' || EXTRACT(WEEK FROM w.week)::text AS month_label,
        COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE 0 END), 0) AS inflow,
        COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END), 0) AS outflow
      FROM generate_series(
        v_year_start::date,
        v_year_end::date,
        '1 week'::interval
      ) w(week)
      LEFT JOIN public.transactions t ON 
        t.created_at >= w.week AND 
        t.created_at < (w.week + INTERVAL '1 week') AND
        t.user_id = auth.uid()
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
      LEFT JOIN public.transactions t ON t.created_at::date = d.day AND t.user_id = auth.uid()
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
        t.created_at < (m.month + INTERVAL '1 month') AND
        t.user_id = auth.uid()
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
    WHERE type = 'EXPENSE' AND user_id = auth.uid()
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
        SUM(t.amount) AS amount,
        COUNT(t.id)::int AS count
      FROM public.transactions t
      JOIN public.categories c ON t.category_id = c.id
      WHERE t.type = 'EXPENSE' AND t.user_id = auth.uid()
        AND t.created_at >= v_start_time AND t.created_at <= v_end_time
      GROUP BY c.name
      ORDER BY amount DESC
    ) sub;
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
    INTO v_top_expenses
    FROM (
      SELECT
        c.name AS category,
        SUM(t.amount) AS amount,
        COUNT(t.id)::int AS count
      FROM public.transactions t
      JOIN public.categories c ON t.category_id = c.id
      WHERE t.type = 'EXPENSE' AND t.user_id = auth.uid()
        AND t.created_at >= v_year_start AND t.created_at <= v_year_end
      GROUP BY c.name
      ORDER BY amount DESC
    ) sub;
  END IF;

  -- 4. Temporal Behavioral Insights
  -- Weekend vs Weekday Ratio (for the specified period or year)
  DECLARE
    v_target_start timestamptz := COALESCE(v_start_time, v_year_start);
    v_target_end timestamptz := COALESCE(v_end_time, v_year_end);
  BEGIN
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE EXTRACT(ISODOW FROM created_at) IN (6, 7)), 0),
      COALESCE(SUM(amount) FILTER (WHERE EXTRACT(ISODOW FROM created_at) IN (1, 2, 3, 4, 5)), 0)
    INTO v_weekend_total, v_weekday_total
    FROM public.transactions
    WHERE type = 'EXPENSE' AND user_id = auth.uid()
      AND created_at >= v_target_start AND created_at <= v_target_end;

    IF (v_weekend_total + v_weekday_total) > 0 THEN
      v_weekend_ratio := ROUND((v_weekend_total / (v_weekend_total + v_weekday_total)) * 100, 1);
      v_weekday_ratio := ROUND((v_weekday_total / (v_weekend_total + v_weekday_total)) * 100, 1);
    ELSE
      v_weekend_ratio := 0;
      v_weekday_ratio := 0;
    END IF;

    -- Payday Effect Tracker (around 25th or 1st)
    WITH payday_dates AS (
      SELECT DISTINCT created_at::date AS p_date
      FROM public.transactions
      WHERE type = 'INCOME' AND user_id = auth.uid()
        AND created_at >= v_target_start AND created_at <= v_target_end
        AND (EXTRACT(DAY FROM created_at) BETWEEN 25 AND 31 OR EXTRACT(DAY FROM created_at) BETWEEN 1 AND 5)
    ),
    expense_days AS (
      SELECT
        created_at::date AS e_date,
        SUM(amount) AS daily_amount
      FROM public.transactions
      WHERE type = 'EXPENSE' AND user_id = auth.uid()
        AND created_at >= v_target_start AND created_at <= v_target_end
      GROUP BY created_at::date
    ),
    classified_expenses AS (
      SELECT
        e.daily_amount,
        EXISTS (
          SELECT 1 FROM payday_dates p
          WHERE e.e_date >= p.p_date AND e.e_date < p.p_date + 7
        ) AS is_post_payday
      FROM expense_days e
    )
    SELECT jsonb_build_object(
      'post_payday_avg_daily', COALESCE(AVG(daily_amount) FILTER (WHERE is_post_payday), 0),
      'normal_avg_daily', COALESCE(AVG(daily_amount) FILTER (WHERE NOT is_post_payday), 0)
    ) INTO v_payday_effect
    FROM classified_expenses;

    v_temporal_insights := jsonb_build_object(
      'weekend_ratio', v_weekend_ratio,
      'weekday_ratio', v_weekday_ratio,
      'weekend_total', v_weekend_total,
      'weekday_total', v_weekday_total,
      'payday_effect', v_payday_effect
    );
  END;

  RETURN jsonb_build_object(
    'monthly_trend', v_monthly_trend,
    'daily_heatmap', v_daily_heatmap,
    'top_expenses', v_top_expenses,
    'temporal_insights', v_temporal_insights
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
  FROM public.wallets WHERE user_id = auth.uid();

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
    FROM public.assets_portfolio WHERE user_id = auth.uid()
    GROUP BY asset_type
    ORDER BY value DESC
  ) sub;

  -- Total portfolio value
  SELECT COALESCE(SUM(current_value), 0) INTO v_total_portfolio
  FROM public.assets_portfolio WHERE user_id = auth.uid();

  -- Total invested (cost basis)
  SELECT COALESCE(SUM(
    CASE
      WHEN asset_type = 'Stocks' THEN total_units * 100 * average_buy_price
      ELSE total_units * average_buy_price
    END
  ), 0) INTO v_total_invested
  FROM public.assets_portfolio WHERE user_id = auth.uid();

  -- Wallet breakdown
  SELECT COALESCE(jsonb_agg(row_to_json(sub) ORDER BY sub.balance DESC), '[]'::jsonb)
  INTO v_wallets
  FROM (
    SELECT name, balance FROM public.wallets WHERE user_id = auth.uid() ORDER BY balance DESC
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
        WHERE year = p_year AND user_id = auth.uid()
        GROUP BY month, year
      ) b_agg ON b_agg.month = EXTRACT(MONTH FROM m.month)::int
      -- Aggregate transactions for each month
      LEFT JOIN (
        SELECT 
          EXTRACT(MONTH FROM created_at)::int AS month_num,
          SUM(amount) AS total_spent
        FROM public.transactions
        WHERE type = 'EXPENSE' AND user_id = auth.uid()
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
        WHERE type = 'EXPENSE' AND user_id = auth.uid()
          AND created_at >= v_month_start
          AND created_at <= v_month_end
        GROUP BY category_id
      ) tx_agg ON tx_agg.category_id = b.category_id
      WHERE b.month = p_month AND b.year = p_year AND b.user_id = auth.uid()
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
    WHERE g.status = 'active' AND g.user_id = auth.uid()
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
    WHERE t.to_goal_id IS NOT NULL AND t.user_id = auth.uid()
    GROUP BY w.name, g.name
    ORDER BY amount DESC
  ) sub;

  -- Totals
  SELECT COALESCE(SUM(amount), 0) INTO v_total_fund_flow
  FROM public.transfers WHERE to_goal_id IS NOT NULL AND user_id = auth.uid();

  SELECT
    COALESCE(SUM(target_amount), 0),
    COALESCE(SUM(current_amount), 0)
  INTO v_total_target, v_total_saved
  FROM public.financial_goals
  WHERE status = 'active' AND user_id = auth.uid();

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
  WHERE user_id = auth.uid() AND account_type NOT IN ('paylater', 'credit_card');

  -- 2. Wallets List (all wallets including credit accounts, with new metadata)
  SELECT COALESCE(jsonb_agg(row_to_json(w)), '[]'::jsonb) INTO v_wallets
  FROM (
    SELECT id, name, balance, account_type, credit_limit,
           billing_date, billing_month_offset,
           due_date, due_month_offset
    FROM public.wallets WHERE user_id = auth.uid() ORDER BY name ASC
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
    WHERE t.user_id = auth.uid()
    ORDER BY t.created_at DESC
    LIMIT 5
  ) r;

  -- 4. Monthly totals
  SELECT
    COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)
  INTO v_monthly_income, v_monthly_expense
  FROM public.transactions
  WHERE user_id = auth.uid() AND created_at >= p_start_time AND created_at <= p_end_time;

  -- 5. Income by category
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO v_income_by_category
  FROM (
    SELECT c.name AS category, SUM(t.amount) AS amount
    FROM public.transactions t
    JOIN public.categories c ON t.category_id = c.id
    WHERE t.type = 'INCOME' AND t.user_id = auth.uid() AND t.created_at >= p_start_time AND t.created_at <= p_end_time
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
    WHERE t.type = 'EXPENSE' AND t.user_id = auth.uid() AND t.created_at >= p_start_time AND t.created_at <= p_end_time
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
      t.type = 'INCOME' AND t.user_id = auth.uid() AND
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
      t.type = 'EXPENSE' AND t.user_id = auth.uid() AND
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
      t.type = 'EXPENSE' AND t.user_id = auth.uid() AND
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
  WHERE user_id = auth.uid() AND created_at >= p_year_start AND created_at <= p_year_end;

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

-- ────────────────────────────────────────────────────────────
-- 10. get_anomaly_alerts(p_year, p_month)
--     Anomaly Detection & Leak Engine
-- ────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_anomaly_alerts(int, int);
CREATE OR REPLACE FUNCTION public.get_anomaly_alerts(
  p_year int DEFAULT 2026,
  p_month int DEFAULT 6
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alerts jsonb := '[]'::jsonb;
  v_target_start timestamptz;
  v_target_end timestamptz;
  v_prev_start timestamptz;
  v_prev_end timestamptz;
  v_3m_start timestamptz;
BEGIN
  -- Date boundaries
  v_target_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0);
  v_target_end := (v_target_start + INTERVAL '1 month' - INTERVAL '1 second');
  v_prev_start := (v_target_start - INTERVAL '1 month');
  v_prev_end := (v_target_start - INTERVAL '1 second');
  v_3m_start := (v_target_start - INTERVAL '3 months');

  -- 1. Subscription Price Hike Detector
  -- Group expenses by category name. If a category's total in the target month
  -- is > 5% higher than the previous month, flag it.
  WITH current_month_subs AS (
    SELECT c.name AS category, SUM(t.amount) AS total
    FROM public.transactions t
    JOIN public.categories c ON t.category_id = c.id
    WHERE t.type = 'EXPENSE' AND t.user_id = auth.uid()
      AND t.created_at >= v_target_start AND t.created_at <= v_target_end
    GROUP BY c.name
  ),
  prev_month_subs AS (
    SELECT c.name AS category, SUM(t.amount) AS total
    FROM public.transactions t
    JOIN public.categories c ON t.category_id = c.id
    WHERE t.type = 'EXPENSE' AND t.user_id = auth.uid()
      AND t.created_at >= v_prev_start AND t.created_at <= v_prev_end
    GROUP BY c.name
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', 'sub_hike_' || c.category,
      'type', 'subscription_hike',
      'title', 'Indikasi Kenaikan Harga: ' || c.category,
      'description', 'Pengeluaran di kategori ini naik sebesar ' || 
                     ROUND(((c.total - p.total) / p.total * 100), 1) || '% dibanding bulan lalu.',
      'severity', 'critical',
      'date', NULL,
      'value', (c.total - p.total)
    )
  ), '[]'::jsonb) INTO v_alerts
  FROM current_month_subs c
  JOIN prev_month_subs p ON c.category = p.category
  WHERE p.total > 0 AND c.total > (p.total * 1.05);

  -- 2. Category Spike Detector
  -- 3-month baseline average per category, then check single days in target month
  WITH baseline_avg AS (
    SELECT c.name AS category, (SUM(t.amount) / 90) AS daily_avg
    FROM public.transactions t
    JOIN public.categories c ON t.category_id = c.id
    WHERE t.type = 'EXPENSE' AND t.user_id = auth.uid()
      AND t.created_at >= v_3m_start AND t.created_at < v_target_start
    GROUP BY c.name
    HAVING (SUM(t.amount) / 90) > 0
  ),
  target_month_days AS (
    SELECT c.name AS category, t.created_at::date AS spike_date, SUM(t.amount) AS daily_total
    FROM public.transactions t
    JOIN public.categories c ON t.category_id = c.id
    WHERE t.type = 'EXPENSE' AND t.user_id = auth.uid()
      AND t.created_at >= v_target_start AND t.created_at <= v_target_end
    GROUP BY c.name, t.created_at::date
  ),
  spikes AS (
    SELECT
      t.category,
      t.spike_date,
      t.daily_total,
      b.daily_avg
    FROM target_month_days t
    JOIN baseline_avg b ON t.category = b.category
    WHERE t.daily_total > (b.daily_avg * 2.5) -- 250% breach
  )
  SELECT v_alerts || COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', 'spike_' || s.category || '_' || s.spike_date,
      'type', 'spending_spike',
      'title', 'Lonjakan Transaksi Tak Wajar: ' || s.category,
      'description', 'Pengeluaran pada hari ini mencapai ' || 
                     ROUND((s.daily_total / s.daily_avg) * 100, 0) || '% dari rata-rata harian biasanya.',
      'severity', 'warning',
      'date', s.spike_date,
      'value', s.daily_total
    )
  ), '[]'::jsonb) INTO v_alerts
  FROM spikes s;

  RETURN v_alerts;
END;
$$;
