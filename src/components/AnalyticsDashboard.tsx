import { useState, useEffect, useCallback } from "react";
import type {
  AnalyticsData,
  PortfolioTypeWithColor,
} from "../lib/analytics";
import { formatIDR, formatCompact, fetchAllAnalytics } from "../lib/analytics";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import FilterControls from "./FilterControls";

// Chart components
import SummaryCard from "./charts/analytics/SummaryCard";
import CashflowDualLine from "./charts/analytics/CashflowDualLine";
import ExpenseHeatmap from "./charts/analytics/ExpenseHeatmap";
import TopExpenseDonut from "./charts/analytics/TopExpenseDonut";
import AssetAllocationDonut from "./charts/analytics/AssetAllocationDonut";
import BudgetComparisonBar from "./charts/analytics/BudgetComparisonBar";
import GoalVelocityLine from "./charts/analytics/GoalVelocityLine";
import FundFlowDiagram from "./charts/analytics/FundFlowDiagram";

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  year?: number;
  month?: number;
  period?: "month" | "year" | "date";
}

export default function AnalyticsDashboard({
  data,
  year = 2026,
  month = 6,
  period = "month",
}: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(data);

  useEffect(() => {
    setAnalyticsData(data);
  }, [data]);

  const reloadData = useCallback(async () => {
    try {
      const fresh = await fetchAllAnalytics(year, month, period);
      setAnalyticsData(fresh);
    } catch (err) {
      console.error("Failed to refetch analytics data:", err);
    }
  }, [year, month, period]);

  useEffect(() => {
    window.addEventListener("refresh-data", reloadData);
    return () => window.removeEventListener("refresh-data", reloadData);
  }, [reloadData]);

  const { summary, cashflow, networth, budget, goals } = analyticsData;

  return (
    <div className="w-full px-4 md:px-6 py-6 space-y-6">
      {/* ── Page Header (Mobile) ─────────────────────────────────────────────── */}
      <div className="md:hidden">
        <h1 className="text-xl font-black tracking-tight text-foreground">
          Advanced Analytics
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Wawasan finansial menyeluruh dari seluruh data Anda.
        </p>
      </div>

      {/* ── Filter Controls ─────────────────────────────────────────────── */}
      <FilterControls
        type="all"
        period={period}
        year={year}
        month={month}
      />

      {/* ── Top Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Total Net Worth"
          value={formatIDR(summary.total_net_worth)}
          subtitle={`Likuid ${formatCompact(summary.total_liquid)} · Portfolio ${formatCompact(summary.total_portfolio)}`}
        />
        <SummaryCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          label="Savings Rate"
          value={`${summary.savings_rate}%`}
          subtitle={`${formatCompact(summary.total_to_goals)} → Goals dari ${formatCompact(summary.total_income)} income`}
          trend={summary.savings_rate > 0 ? { value: summary.savings_rate, label: "of income" } : undefined}
        />
        <SummaryCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Financial Runway"
          value={`${summary.financial_runway} bulan`}
          subtitle={`Avg pengeluaran ${formatCompact(summary.avg_monthly_expense)}/bln`}
          trend={summary.financial_runway >= 6 ? { value: summary.financial_runway, label: "months" } : undefined}
        />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="cashflow" className="w-full">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 group-data-horizontal/tabs:!h-auto p-1 bg-muted/50 rounded-2xl border border-border/50 gap-1">
          <TabsTrigger
            value="cashflow"
            className="rounded-xl text-[11px] sm:text-xs font-bold py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground cursor-pointer"
          >
            <svg className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4" />
            </svg>
            Cash Flow
          </TabsTrigger>
          <TabsTrigger
            value="networth"
            className="rounded-xl text-[11px] sm:text-xs font-bold py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground cursor-pointer"
          >
            <svg className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
            </svg>
            Net Worth
          </TabsTrigger>
          <TabsTrigger
            value="budget"
            className="rounded-xl text-[11px] sm:text-xs font-bold py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground cursor-pointer"
          >
            <svg className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Budget
          </TabsTrigger>
          <TabsTrigger
            value="goals"
            className="rounded-xl text-[11px] sm:text-xs font-bold py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground cursor-pointer"
          >
            <svg className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx={12} cy={12} r={10} />
              <circle cx={12} cy={12} r={6} />
              <circle cx={12} cy={12} r={2} />
            </svg>
            Goals
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Cash Flow & Ledger ────────────────────────────────────── */}
        <TabsContent value="cashflow" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Full-width cashflow trend */}
            <div className="lg:col-span-2">
              <CashflowDualLine data={cashflow.monthly_trend} />
            </div>
            {/* Heatmap */}
            <div className="lg:col-span-2">
              <ExpenseHeatmap data={cashflow.daily_heatmap} year={year} />
            </div>
            {/* Top expenses donut */}
            <div className="lg:col-span-2">
              <TopExpenseDonut data={cashflow.top_expenses_enriched} />
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Net Worth & Portfolio ──────────────────────────────────── */}
        <TabsContent value="networth" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Asset allocation donut */}
            <AssetAllocationDonut
              data={networth.allocation}
              totalNetWorth={networth.total_net_worth}
            />

            {/* Net worth breakdown card */}
            <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all h-full">
              <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider mb-4">
                Net Worth Breakdown
              </h4>

              <div className="space-y-3 flex-1">
                {/* Liquid section */}
                <div className="p-3 rounded-2xl border border-border/60 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Kas Likuid (Wallets)
                    </span>
                    <span className="text-sm font-black text-foreground">
                      {formatIDR(networth.total_liquid)}
                    </span>
                  </div>
                  {networth.wallets.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {networth.wallets.map((w, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{w.name}</span>
                          <span className="font-bold text-foreground">{formatIDR(w.balance)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Portfolio section */}
                <div className="p-3 rounded-2xl border border-border/60 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Portfolio Investasi
                    </span>
                    <span className="text-sm font-black text-foreground">
                      {formatIDR(networth.total_portfolio)}
                    </span>
                  </div>

                  {networth.portfolio_enriched.map((pt, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: pt.color }} />
                        <span className="text-muted-foreground">
                          {pt.type === "Mutual_Funds" ? "Reksa Dana" : pt.type === "Stocks" ? "Saham" : pt.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{formatCompact(pt.value)}</span>
                        <span className={`font-bold ${pt.gain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                          {pt.gain >= 0 ? "+" : ""}{pt.gain_pct}%
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Total unrealized gain */}
                  <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-muted-foreground">Unrealized P/L</span>
                    <span className={`font-black ${networth.unrealized_gain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                      {networth.unrealized_gain >= 0 ? "+" : ""}{formatIDR(networth.unrealized_gain)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 3: Budget Adherence ──────────────────────────────────────── */}
        <TabsContent value="budget" className="mt-4">
          <BudgetComparisonBar
            data={budget.categories}
            complianceScore={budget.compliance_score}
            totalBudget={budget.total_budget}
            totalSpent={budget.total_spent}
            period={period}
          />
        </TabsContent>

        {/* ── Tab 4: Savings & Goals ───────────────────────────────────────── */}
        <TabsContent value="goals" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Overall savings progress */}
            <div className="lg:col-span-2 p-5 bg-card border border-border/80 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
                  Total Goals Progress
                </h4>
                <span className="text-lg font-black text-foreground">
                  {goals.overall_progress_pct}%
                </span>
              </div>

              <div className="relative h-4 w-full bg-muted/30 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2F7E79] to-[#1B5C58] transition-all duration-700"
                  style={{ width: `${Math.min(goals.overall_progress_pct, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Total Terkumpul: <span className="font-bold text-foreground">{formatIDR(goals.total_saved)}</span></span>
                <span>Target: <span className="font-bold text-foreground">{formatIDR(goals.total_target)}</span></span>
              </div>
            </div>

            {/* Goal velocity */}
            <GoalVelocityLine goals={goals.goals} />

            {/* Fund flow */}
            <FundFlowDiagram flows={goals.fund_flow} totalFlow={goals.total_fund_flow} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
