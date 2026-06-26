const fs = require('fs');
let content = fs.readFileSync('scripts/analytics_rpc.sql', 'utf8');

// Fix get_dashboard_stats
content = content.replace(
  "FROM public.wallets\n  WHERE account_type NOT IN ('paylater', 'credit_card');",
  "FROM public.wallets\n  WHERE user_id = auth.uid() AND account_type NOT IN ('paylater', 'credit_card');"
);

content = content.replace(
  "FROM public.wallets ORDER BY name ASC",
  "FROM public.wallets WHERE user_id = auth.uid() ORDER BY name ASC"
);

// Monthly totals
content = content.replace(
  "FROM public.transactions\n  WHERE created_at >= p_start_time AND created_at <= p_end_time;",
  "FROM public.transactions\n  WHERE user_id = auth.uid() AND created_at >= p_start_time AND created_at <= p_end_time;"
);

// Income/Expense by category
content = content.replace(
  /WHERE t\.type = '(INCOME|EXPENSE)' AND t\.created_at >= p_start_time AND t\.created_at <= p_end_time/g,
  "WHERE t.type = '$1' AND t.user_id = auth.uid() AND t.created_at >= p_start_time AND t.created_at <= p_end_time"
);

// Monthly income history
content = content.replace(
  /t\.type = 'INCOME' AND\n      t\.created_at >= m\.month AND\n      t\.created_at < \(m\.month \+ INTERVAL '1 month'\)/g,
  "t.type = 'INCOME' AND t.user_id = auth.uid() AND\n      t.created_at >= m.month AND\n      t.created_at < (m.month + INTERVAL '1 month')"
);

// Weekly expenses & Prev weekly expenses
content = content.replace(
  /t\.type = 'EXPENSE' AND\n      t\.created_at::date = d\.day/g,
  "t.type = 'EXPENSE' AND t.user_id = auth.uid() AND\n      t.created_at::date = d.day"
);

// YTD totals
content = content.replace(
  "FROM public.transactions\n  WHERE created_at >= p_year_start AND created_at <= p_year_end;",
  "FROM public.transactions\n  WHERE user_id = auth.uid() AND created_at >= p_year_start AND created_at <= p_year_end;"
);

// Fix get_networth_analytics
content = content.replace(
  "SELECT COALESCE(SUM(balance), 0) INTO v_total_liquid\n  FROM public.wallets;",
  "SELECT COALESCE(SUM(balance), 0) INTO v_total_liquid\n  FROM public.wallets WHERE user_id = auth.uid();"
);

content = content.replace(
  "FROM public.assets_portfolio\n    GROUP BY asset_type",
  "FROM public.assets_portfolio WHERE user_id = auth.uid()\n    GROUP BY asset_type"
);

content = content.replace(
  "SELECT COALESCE(SUM(current_value), 0) INTO v_total_portfolio\n  FROM public.assets_portfolio;",
  "SELECT COALESCE(SUM(current_value), 0) INTO v_total_portfolio\n  FROM public.assets_portfolio WHERE user_id = auth.uid();"
);

content = content.replace(
  /FROM public\.assets_portfolio;/g,
  "FROM public.assets_portfolio WHERE user_id = auth.uid();"
);

content = content.replace(
  "SELECT name, balance FROM public.wallets ORDER BY balance DESC",
  "SELECT name, balance FROM public.wallets WHERE user_id = auth.uid() ORDER BY balance DESC"
);

// Fix get_budget_analytics
// Budgets
content = content.replace(
  "WHERE year = p_year\n        GROUP BY month, year",
  "WHERE year = p_year AND user_id = auth.uid()\n        GROUP BY month, year"
);

// Transactions monthly
content = content.replace(
  /WHERE type = 'EXPENSE'\n          AND created_at >= v_year_start AND created_at <= v_year_end/g,
  "WHERE type = 'EXPENSE' AND user_id = auth.uid()\n          AND created_at >= v_year_start AND created_at <= v_year_end"
);

// Budgets specific month
content = content.replace(
  "WHERE b.month = p_month AND b.year = p_year",
  "WHERE b.month = p_month AND b.year = p_year AND b.user_id = auth.uid()"
);

content = content.replace(
  /WHERE type = 'EXPENSE'\n          AND created_at >= v_month_start\n          AND created_at <= v_month_end/g,
  "WHERE type = 'EXPENSE' AND user_id = auth.uid()\n          AND created_at >= v_month_start\n          AND created_at <= v_month_end"
);

// Fix get_goals_analytics
content = content.replace(
  "WHERE g.status = 'active'\n    ORDER BY g.target_date ASC",
  "WHERE g.status = 'active' AND g.user_id = auth.uid()\n    ORDER BY g.target_date ASC"
);

content = content.replace(
  "WHERE t.to_goal_id IS NOT NULL\n    GROUP BY w.name, g.name",
  "WHERE t.to_goal_id IS NOT NULL AND t.user_id = auth.uid()\n    GROUP BY w.name, g.name"
);

content = content.replace(
  "FROM public.transfers WHERE to_goal_id IS NOT NULL;",
  "FROM public.transfers WHERE to_goal_id IS NOT NULL AND user_id = auth.uid();"
);

content = content.replace(
  "FROM public.financial_goals\n  WHERE status = 'active';",
  "FROM public.financial_goals\n  WHERE status = 'active' AND user_id = auth.uid();"
);

fs.writeFileSync('scripts/analytics_rpc.sql', content);
console.log("SQL fixed!");
