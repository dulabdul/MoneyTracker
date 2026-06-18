import { useMemo } from "react";
import type { BudgetCategoryItem } from "../../../lib/analytics";
import { formatIDR, formatCompact } from "../../../lib/analytics";

interface BudgetComparisonBarProps {
  data: BudgetCategoryItem[];
  complianceScore: number;
  totalBudget: number;
  totalSpent: number;
  period?: "month" | "year" | "date";
}

const BAR_COLORS = [
  "oklch(0.65 0.20 150)",
  "oklch(0.45 0.16 250)",
  "oklch(0.35 0.18 310)",
  "oklch(0.65 0.25 45)",
  "oklch(0.55 0.22 20)",
  "oklch(0.60 0.18 200)",
];

export default function BudgetComparisonBar({
  data,
  complianceScore,
  totalBudget,
  totalSpent,
  period = "month",
}: BudgetComparisonBarProps) {
  const maxVal = useMemo(
    () => Math.max(...data.flatMap((d) => [d.budget_limit, d.spent]), 1),
    [data],
  );

  if (!data.length) {
    return (
      <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm h-full">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          {period === "year" ? "Budget vs Realisasi per Bulan" : "Budget vs Realisasi"}
        </h4>
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-12">
          Belum ada data anggaran
        </div>
      </div>
    );
  }

  const isOverall = totalSpent > totalBudget;

  return (
    <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          {period === "year" ? "Budget vs Realisasi per Bulan" : "Budget vs Realisasi"}
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-border" />
            <span className="text-[9px] font-semibold text-muted-foreground">Limit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#2F7E79]" />
            <span className="text-[9px] font-semibold text-muted-foreground">Spent</span>
          </div>
        </div>
      </div>

      {/* Compliance Score Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border mb-4 ${
        complianceScore >= 75
          ? "bg-emerald-500/5 border-emerald-500/15"
          : complianceScore >= 50
          ? "bg-amber-500/5 border-amber-500/15"
          : "bg-rose-500/5 border-rose-500/15"
      }`}>
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm font-black ${
          complianceScore >= 75
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : complianceScore >= 50
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
        }`}>
          {complianceScore}
        </div>
        <div>
          <p className="text-[10px] font-bold text-foreground">Compliance Score: {complianceScore}%</p>
          <p className="text-[9px] text-muted-foreground">
            {period === "year" ? "Bulan yang terjaga di bawah budget" : "Kategori yang terjaga di bawah budget"}
          </p>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="flex-1 space-y-3">
        {data.map((item, i) => {
          const budgetPct = (item.budget_limit / maxVal) * 100;
          const spentPct = (item.spent / maxVal) * 100;
          const isOver = item.spent > item.budget_limit;

          return (
            <div key={i} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-foreground truncate max-w-[60%]">
                  {item.category_name}
                </span>
                <span className={`text-[10px] font-bold ${isOver ? "text-rose-500" : "text-muted-foreground"}`}>
                  {formatCompact(item.spent)} / {formatCompact(item.budget_limit)}
                </span>
              </div>

              {/* Stacked bar */}
              <div className="relative h-5 w-full bg-muted/30 rounded-lg overflow-hidden">
                {/* Budget limit background */}
                <div
                  className="absolute top-0 left-0 h-full bg-border/30 dark:bg-border/20 rounded-lg transition-all"
                  style={{ width: `${Math.min(budgetPct, 100)}%` }}
                />
                {/* Spent bar */}
                <div
                  className={`absolute top-0 left-0 h-full rounded-lg transition-all duration-500 ${
                    isOver
                      ? "bg-gradient-to-r from-rose-500 to-rose-400"
                      : "bg-gradient-to-r from-[#2F7E79] to-[#1B5C58]"
                  }`}
                  style={{ width: `${Math.min(spentPct, 100)}%` }}
                />
                {/* Budget limit marker line */}
                {budgetPct < 100 && (
                  <div
                    className="absolute top-0 h-full w-[2px] bg-foreground/30"
                    style={{ left: `${budgetPct}%` }}
                  />
                )}
              </div>

              {/* Percentage label */}
              <div className="flex justify-end mt-0.5">
                <span className={`text-[9px] font-bold ${isOver ? "text-rose-500" : "text-teal-600 dark:text-teal-400"}`}>
                  {item.usage_pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer total */}
      <div className={`mt-4 flex items-center gap-2 text-[11px] p-3 rounded-2xl border ${
        isOverall
          ? "bg-rose-500/5 border-rose-500/10 text-rose-600 dark:text-rose-400"
          : "bg-[#2F7E79]/5 border-[#2F7E79]/10 text-muted-foreground"
      }`}>
        <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
          isOverall ? "bg-rose-500/10 text-rose-500" : "bg-teal-500/10 text-[#2F7E79] dark:text-teal-400"
        }`}>
          {isOverall ? (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <span>
          Total: <span className="font-bold text-foreground">{formatIDR(totalSpent)}</span> dari{" "}
          <span className="font-bold">{formatIDR(totalBudget)}</span>
        </span>
      </div>
    </div>
  );
}
