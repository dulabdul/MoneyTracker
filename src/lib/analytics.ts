/**
 * FinGram — Advanced Analytics Data Fetching Layer
 * Calls Supabase RPC functions and validates responses with Zod.
 */
import { z } from "zod";
import { supabase, isConfigured } from "./supabase";

// ─── Color Palettes ────────────────────────────────────────────────────────────
const EXPENSE_COLORS = [
  "oklch(0.65 0.20 150)",  // emerald
  "oklch(0.55 0.22 20)",   // rose
  "oklch(0.45 0.16 250)",  // blue
  "oklch(0.65 0.25 45)",   // orange
  "oklch(0.35 0.18 310)",  // purple
];

const ASSET_TYPE_COLORS: Record<string, string> = {
  Stocks: "oklch(0.55 0.18 250)",        // blue
  Crypto: "oklch(0.65 0.25 45)",         // orange
  Gold: "oklch(0.70 0.18 85)",           // gold
  Mutual_Funds: "oklch(0.35 0.18 310)",  // purple
  Liquid: "oklch(0.65 0.20 150)",        // emerald (for cash)
};

// ─── Zod Schemas ────────────────────────────────────────────────────────────────

const AnalyticsSummarySchema = z.object({
  total_net_worth: z.number(),
  total_liquid: z.number(),
  total_portfolio: z.number(),
  total_income: z.number(),
  total_to_goals: z.number(),
  savings_rate: z.number(),
  avg_monthly_expense: z.number(),
  financial_runway: z.number(),
});

const MonthlyTrendItemSchema = z.object({
  month_num: z.number(),
  month_label: z.string(),
  inflow: z.number(),
  outflow: z.number(),
});

const DailyHeatmapItemSchema = z.object({
  date: z.string(),
  amount: z.number(),
  count: z.number(),
});

const TopExpenseItemSchema = z.object({
  category: z.string(),
  amount: z.number(),
});

const CashflowAnalyticsSchema = z.object({
  monthly_trend: z.array(MonthlyTrendItemSchema),
  daily_heatmap: z.array(DailyHeatmapItemSchema),
  top_expenses: z.array(TopExpenseItemSchema),
});

const PortfolioTypeItemSchema = z.object({
  type: z.string(),
  count: z.number(),
  value: z.number(),
  cost_basis: z.number(),
});

const WalletItemSchema = z.object({
  name: z.string(),
  balance: z.number(),
});

const NetWorthAnalyticsSchema = z.object({
  total_liquid: z.number(),
  total_portfolio: z.number(),
  total_invested: z.number(),
  total_net_worth: z.number(),
  unrealized_gain: z.number(),
  portfolio_by_type: z.array(PortfolioTypeItemSchema),
  wallets: z.array(WalletItemSchema),
});

const BudgetCategoryItemSchema = z.object({
  category_name: z.string(),
  budget_limit: z.number(),
  spent: z.number(),
  usage_pct: z.number(),
});

const BudgetAnalyticsSchema = z.object({
  categories: z.array(BudgetCategoryItemSchema),
  compliance_score: z.number(),
  total_budget: z.number(),
  total_spent: z.number(),
  total_categories: z.number(),
  compliant_categories: z.number(),
});

const GoalItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  target_amount: z.number(),
  current_amount: z.number(),
  target_date: z.string(),
  status: z.string(),
  created_at: z.string(),
  progress_pct: z.number(),
  days_active: z.number(),
  monthly_velocity: z.number(),
  remaining_amount: z.number(),
  days_to_target: z.number(),
  projected_date: z.string().nullable(),
});

const FundFlowItemSchema = z.object({
  source: z.string(),
  destination: z.string(),
  amount: z.number(),
  transfer_count: z.number(),
});

const GoalsAnalyticsSchema = z.object({
  goals: z.array(GoalItemSchema),
  fund_flow: z.array(FundFlowItemSchema),
  total_fund_flow: z.number(),
  total_target: z.number(),
  total_saved: z.number(),
  overall_progress_pct: z.number(),
});

// ─── Exported TypeScript Types ──────────────────────────────────────────────────

export type AnalyticsSummary = z.infer<typeof AnalyticsSummarySchema>;
export type MonthlyTrendItem = z.infer<typeof MonthlyTrendItemSchema>;
export type DailyHeatmapItem = z.infer<typeof DailyHeatmapItemSchema>;
export type TopExpenseItem = z.infer<typeof TopExpenseItemSchema>;
export type CashflowAnalytics = z.infer<typeof CashflowAnalyticsSchema>;
export type PortfolioTypeItem = z.infer<typeof PortfolioTypeItemSchema>;
export type NetWorthAnalytics = z.infer<typeof NetWorthAnalyticsSchema>;
export type BudgetCategoryItem = z.infer<typeof BudgetCategoryItemSchema>;
export type BudgetAnalytics = z.infer<typeof BudgetAnalyticsSchema>;
export type GoalItem = z.infer<typeof GoalItemSchema>;
export type FundFlowItem = z.infer<typeof FundFlowItemSchema>;
export type GoalsAnalytics = z.infer<typeof GoalsAnalyticsSchema>;

// Enriched types (with colors for charts)
export interface TopExpenseWithColor extends TopExpenseItem {
  pct: number;
  color: string;
}

export interface PortfolioTypeWithColor extends PortfolioTypeItem {
  pct: number;
  color: string;
  gain: number;
  gain_pct: number;
}

export interface NetWorthAllocation {
  type: string;
  value: number;
  pct: number;
  color: string;
}

// ─── Complete Analytics Data Bundle ─────────────────────────────────────────────

export interface AnalyticsData {
  summary: AnalyticsSummary;
  cashflow: CashflowAnalytics & { top_expenses_enriched: TopExpenseWithColor[] };
  networth: NetWorthAnalytics & {
    portfolio_enriched: PortfolioTypeWithColor[];
    allocation: NetWorthAllocation[];
  };
  budget: BudgetAnalytics;
  goals: GoalsAnalytics;
}

// ─── Default / Empty State Values ───────────────────────────────────────────────

const DEFAULT_SUMMARY: AnalyticsSummary = {
  total_net_worth: 0,
  total_liquid: 0,
  total_portfolio: 0,
  total_income: 0,
  total_to_goals: 0,
  savings_rate: 0,
  avg_monthly_expense: 0,
  financial_runway: 0,
};

const DEFAULT_CASHFLOW: CashflowAnalytics = {
  monthly_trend: [],
  daily_heatmap: [],
  top_expenses: [],
};

const DEFAULT_NETWORTH: NetWorthAnalytics = {
  total_liquid: 0,
  total_portfolio: 0,
  total_invested: 0,
  total_net_worth: 0,
  unrealized_gain: 0,
  portfolio_by_type: [],
  wallets: [],
};

const DEFAULT_BUDGET: BudgetAnalytics = {
  categories: [],
  compliance_score: 0,
  total_budget: 0,
  total_spent: 0,
  total_categories: 0,
  compliant_categories: 0,
};

const DEFAULT_GOALS: GoalsAnalytics = {
  goals: [],
  fund_flow: [],
  total_fund_flow: 0,
  total_target: 0,
  total_saved: 0,
  overall_progress_pct: 0,
};

// ─── RPC Fetchers ───────────────────────────────────────────────────────────────

async function fetchAnalyticsSummary(supabaseClient: any): Promise<AnalyticsSummary> {
  if (!isConfigured || !supabaseClient) return DEFAULT_SUMMARY;
  try {
    const { data, error } = await supabaseClient.rpc("get_analytics_summary");
    if (error) { console.error("[analytics] summary error:", error); return DEFAULT_SUMMARY; }
    return AnalyticsSummarySchema.parse(data);
  } catch (e) { console.error("[analytics] summary parse error:", e); return DEFAULT_SUMMARY; }
}

async function fetchCashflowAnalytics(supabaseClient: any, year: number = 2026, month?: number, period: string = "month"): Promise<CashflowAnalytics> {
  if (!isConfigured || !supabaseClient) return DEFAULT_CASHFLOW;
  try {
    const { data, error } = await supabaseClient.rpc("get_cashflow_analytics", { 
      p_year: year,
      p_month: month !== undefined ? month : null,
      p_period: period
    });
    if (error) { console.error("[analytics] cashflow error:", error); return DEFAULT_CASHFLOW; }
    return CashflowAnalyticsSchema.parse(data);
  } catch (e) { console.error("[analytics] cashflow parse error:", e); return DEFAULT_CASHFLOW; }
}

async function fetchNetWorthAnalytics(supabaseClient: any): Promise<NetWorthAnalytics> {
  if (!isConfigured || !supabaseClient) return DEFAULT_NETWORTH;
  try {
    const { data, error } = await supabaseClient.rpc("get_networth_analytics");
    if (error) { console.error("[analytics] networth error:", error); return DEFAULT_NETWORTH; }
    return NetWorthAnalyticsSchema.parse(data);
  } catch (e) { console.error("[analytics] networth parse error:", e); return DEFAULT_NETWORTH; }
}

async function fetchBudgetAnalytics(supabaseClient: any, year: number = 2026, month: number = 6, period: string = "month"): Promise<BudgetAnalytics> {
  if (!isConfigured || !supabaseClient) return DEFAULT_BUDGET;
  try {
    const { data, error } = await supabaseClient.rpc("get_budget_analytics", { 
      p_year: year, 
      p_month: month,
      p_period: period
    });
    if (error) { console.error("[analytics] budget error:", error); return DEFAULT_BUDGET; }
    return BudgetAnalyticsSchema.parse(data);
  } catch (e) { console.error("[analytics] budget parse error:", e); return DEFAULT_BUDGET; }
}

async function fetchGoalsAnalytics(supabaseClient: any): Promise<GoalsAnalytics> {
  if (!isConfigured || !supabaseClient) return DEFAULT_GOALS;
  try {
    const { data, error } = await supabaseClient.rpc("get_goals_analytics");
    if (error) { console.error("[analytics] goals error:", error); return DEFAULT_GOALS; }
    return GoalsAnalyticsSchema.parse(data);
  } catch (e) { console.error("[analytics] goals parse error:", e); return DEFAULT_GOALS; }
}

// ─── Enrichment Helpers ─────────────────────────────────────────────────────────

function enrichTopExpenses(expenses: TopExpenseItem[]): TopExpenseWithColor[] {
  const total = expenses.reduce((s, e) => s + e.amount, 0) || 1;
  return expenses.map((e, i) => ({
    ...e,
    pct: Math.round((e.amount / total) * 100),
    color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
  }));
}

function enrichPortfolio(types: PortfolioTypeItem[]): PortfolioTypeWithColor[] {
  const total = types.reduce((s, t) => s + t.value, 0) || 1;
  return types.map((t) => ({
    ...t,
    pct: Math.round((t.value / total) * 100),
    color: ASSET_TYPE_COLORS[t.type] ?? "oklch(0.60 0.10 200)",
    gain: t.value - t.cost_basis,
    gain_pct: t.cost_basis > 0 ? Math.round(((t.value - t.cost_basis) / t.cost_basis) * 100) : 0,
  }));
}

function buildAllocation(liquid: number, types: PortfolioTypeItem[]): NetWorthAllocation[] {
  const portfolio = types.reduce((s, t) => s + t.value, 0);
  const total = liquid + portfolio || 1;

  const allocations: NetWorthAllocation[] = [
    { type: "Kas Likuid", value: liquid, pct: Math.round((liquid / total) * 100), color: ASSET_TYPE_COLORS.Liquid },
  ];

  for (const t of types) {
    allocations.push({
      type: t.type === "Mutual_Funds" ? "Reksa Dana" : t.type === "Stocks" ? "Saham" : t.type === "Crypto" ? "Kripto" : t.type,
      value: t.value,
      pct: Math.round((t.value / total) * 100),
      color: ASSET_TYPE_COLORS[t.type] ?? "oklch(0.60 0.10 200)",
    });
  }

  return allocations;
}

// ─── Main Aggregator — Single entry point ───────────────────────────────────────

export async function fetchAllAnalytics(
  supabaseClient: any,
  year: number = 2026,
  month: number = 6,
  period: string = "month",
): Promise<AnalyticsData> {
  const [summary, cashflow, networth, budget, goals] = await Promise.all([
    fetchAnalyticsSummary(supabaseClient),
    fetchCashflowAnalytics(supabaseClient, year, month, period),
    fetchNetWorthAnalytics(supabaseClient),
    fetchBudgetAnalytics(supabaseClient, year, month, period),
    fetchGoalsAnalytics(supabaseClient),
  ]);

  return {
    summary,
    cashflow: {
      ...cashflow,
      top_expenses_enriched: enrichTopExpenses(cashflow.top_expenses),
    },
    networth: {
      ...networth,
      portfolio_enriched: enrichPortfolio(networth.portfolio_by_type),
      allocation: buildAllocation(networth.total_liquid, networth.portfolio_by_type),
    },
    budget,
    goals,
  };
}

// ─── IDR Formatter (shared utility) ─────────────────────────────────────────────

export function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}rb`;
  return n.toString();
}
