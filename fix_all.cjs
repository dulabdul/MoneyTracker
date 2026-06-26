const fs = require('fs');
let text = fs.readFileSync('scripts/analytics_rpc.sql', 'utf-8');

// Recent transactions fix
text = text.replace(
  "    LEFT JOIN public.categories c ON t.category_id = c.id\n    ORDER BY t.created_at DESC",
  "    LEFT JOIN public.categories c ON t.category_id = c.id\n    WHERE t.user_id = auth.uid()\n    ORDER BY t.created_at DESC"
);

// get_cashflow_analytics missing WHERE
text = text.replace(
  "    FROM public.transactions\n    WHERE type = 'INCOME'\n    GROUP BY DATE_TRUNC('month', created_at)",
  "    FROM public.transactions\n    WHERE type = 'INCOME' AND user_id = auth.uid()\n    GROUP BY DATE_TRUNC('month', created_at)"
);

text = text.replace(
  "    FROM public.transactions\n    WHERE type = 'EXPENSE'\n      AND created_at >= v_year_start AND created_at <= v_year_end",
  "    FROM public.transactions\n    WHERE type = 'EXPENSE' AND user_id = auth.uid()\n      AND created_at >= v_year_start AND created_at <= v_year_end"
);

text = text.replace(
  "      FROM public.transactions t\n      JOIN public.categories c ON t.category_id = c.id\n      WHERE t.type = 'EXPENSE' AND t.created_at >= v_year_start AND t.created_at <= v_year_end",
  "      FROM public.transactions t\n      JOIN public.categories c ON t.category_id = c.id\n      WHERE t.type = 'EXPENSE' AND t.user_id = auth.uid() AND t.created_at >= v_year_start AND t.created_at <= v_year_end"
);

text = text.replace(
  "      FROM public.transactions t\n      JOIN public.categories c ON t.category_id = c.id\n      WHERE t.type = 'INCOME' AND t.created_at >= v_year_start AND t.created_at <= v_year_end",
  "      FROM public.transactions t\n      JOIN public.categories c ON t.category_id = c.id\n      WHERE t.type = 'INCOME' AND t.user_id = auth.uid() AND t.created_at >= v_year_start AND t.created_at <= v_year_end"
);

// Heatmap
text = text.replace(
  "    FROM public.transactions\n    WHERE type = 'EXPENSE'\n      AND created_at >= v_target_start AND created_at <= v_target_end;",
  "    FROM public.transactions\n    WHERE type = 'EXPENSE' AND user_id = auth.uid()\n      AND created_at >= v_target_start AND created_at <= v_target_end;"
);

text = text.replace(
  "      FROM public.transactions\n      WHERE type = 'INCOME'\n        AND created_at >= v_target_start AND created_at <= v_target_end",
  "      FROM public.transactions\n      WHERE type = 'INCOME' AND user_id = auth.uid()\n        AND created_at >= v_target_start AND created_at <= v_target_end"
);

text = text.replace(
  "      FROM public.transactions\n      WHERE type = 'EXPENSE'\n        AND created_at >= v_target_start AND created_at <= v_target_end",
  "      FROM public.transactions\n      WHERE type = 'EXPENSE' AND user_id = auth.uid()\n        AND created_at >= v_target_start AND created_at <= v_target_end"
);

fs.writeFileSync('scripts/analytics_rpc.sql', text);
console.log("Fixed missing items!");
