import { createBrowserClient } from "@supabase/ssr";

// ─── Database Types ────────────────────────────────────────────────────────────
export type TransactionType =
  | "INCOME"
  | "EXPENSE"
  | "INVESTMENT_BUY"
  | "INVESTMENT_SELL";

export type WalletAccountType = 'cash' | 'bank' | 'ewallet' | 'paylater' | 'credit_card';

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  account_type: WalletAccountType;
  credit_limit: number;
  billing_date: number | null;
  billing_month_offset: number; // 0 = bulan berjalan, 1 = bulan berikutnya
  due_date: number | null;
  due_month_offset: number;     // 0 = bulan berjalan, 1 = bulan berikutnya
}

// ─── Credit Account Helpers ────────────────────────────────────────────────────
export function isCreditAccount(wallet: Wallet): boolean {
  return wallet.account_type === 'paylater' || wallet.account_type === 'credit_card';
}

/** Outstanding debt on a credit account (positive number, e.g. 500000 means Rp 500k owed) */
export function getCreditUsed(wallet: Wallet): number {
  return Math.max(0, -(wallet.balance ?? 0));
}

/** Remaining credit available */
export function getCreditAvailable(wallet: Wallet): number {
  return Math.max(0, (wallet.credit_limit ?? 0) - getCreditUsed(wallet));
}

/** Usage percentage 0–100 */
export function getCreditUsagePercent(wallet: Wallet): number {
  if (!wallet.credit_limit || wallet.credit_limit === 0) return 0;
  return Math.min(100, Math.round((getCreditUsed(wallet) / wallet.credit_limit) * 100));
}

/** Human-readable label for account type */
export function getAccountTypeLabel(type: WalletAccountType): string {
  const labels: Record<WalletAccountType, string> = {
    cash: 'Tunai',
    bank: 'Bank',
    ewallet: 'E-Wallet',
    paylater: 'PayLater',
    credit_card: 'Kartu Kredit',
  };
  return labels[type] ?? type;
}

/**
 * Returns a compact human-readable date label.
 * e.g. getCreditDateLabel(15, 0) → "tgl 15 bln ini"
 *      getCreditDateLabel(25, 1) → "tgl 25 bln depan"
 */
export function getCreditDateLabel(day: number | null, monthOffset: number): string {
  if (!day) return '—';
  return `tgl ${day} ${monthOffset === 1 ? 'bln depan' : 'bln ini'}`;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

export interface TransactionRow {
  id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  description: string;
  created_at: string;
  wallet_name: string;
  category_name: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyIncome {
  month: string;      // "Jan", "Feb", etc.
  monthIndex: number; // 1–12
  income: number;
}

export interface WeeklyExpense {
  day: string;
  amount: number;
  heightPct: number;
}

export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  recentTransactions: TransactionRow[];
  wallets: Wallet[];
  // Analytics
  incomeByCategory: CategoryBreakdown[];
  expenseByCategory: CategoryBreakdown[];
  monthlyIncomeHistory: MonthlyIncome[];   // Jan–Jun this year
  weeklyExpenses: WeeklyExpense[];         // current week Mon–Sun
  prevWeeklyExpenses: WeeklyExpense[];     // previous week Mon–Sun
  ytdExpense: number;
  ytdIncome: number;
}

// ─── Client Initialization ────────────────────────────────────────────────────
const supabaseUrl     = import.meta.env.PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function createBrowserScopedClient() {
  if (!isConfigured || typeof window === "undefined") return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Developers must now call createBrowserScopedClient() locally inside components.

// ─── Color palette for chart segments ─────────────────────────────────────────
const SEGMENT_COLORS = [
  "oklch(0.65 0.20 150)",  // emerald green
  "oklch(0.45 0.16 250)",  // blue
  "oklch(0.35 0.18 310)",  // purple
  "oklch(0.65 0.25 45)",   // orange
  "oklch(0.55 0.22 20)",   // rose
  "oklch(0.60 0.18 200)",  // teal
];

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(n);
}

export interface FilterParams {
  period?: "month" | "year" | "date";
  year?: number;
  month?: number; // 1-12
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

// ─── Dashboard Data Fetcher (SSR) ─────────────────────────────────────────────
export async function fetchDashboardData(supabaseClient: any, params: FilterParams = {}): Promise<DashboardStats | null> {
  if (!isConfigured || !supabaseClient) return null;

  try {
    const defaultYear = 2026;
    const defaultMonth = 6; // Juni

    const period = params.period ?? "month";
    const year = params.year ?? defaultYear;
    const month = params.month ?? defaultMonth;

    let startStr = "";
    let endStr = "";

    if (period === "month") {
      const sDate = new Date(year, month - 1, 1);
      const eDate = new Date(year, month, 0, 23, 59, 59, 999);
      startStr = sDate.toISOString();
      endStr = eDate.toISOString();
    } else if (period === "year") {
      const sDate = new Date(year, 0, 1);
      const eDate = new Date(year, 11, 31, 23, 59, 59, 999);
      startStr = sDate.toISOString();
      endStr = eDate.toISOString();
    } else if (period === "date") {
      if (params.startDate && params.endDate) {
        startStr = new Date(params.startDate).toISOString();
        const eDate = new Date(params.endDate);
        eDate.setHours(23, 59, 59, 999);
        endStr = eDate.toISOString();
      } else if (params.startDate) {
        const sDate = new Date(params.startDate);
        sDate.setHours(0, 0, 0, 0);
        const eDate = new Date(params.startDate);
        eDate.setHours(23, 59, 59, 999);
        startStr = sDate.toISOString();
        endStr = eDate.toISOString();
      } else {
        const sDate = new Date(year, month - 1, 1);
        const eDate = new Date(year, month, 0, 23, 59, 59, 999);
        startStr = sDate.toISOString();
        endStr = eDate.toISOString();
      }
    }

    // YTD / full year boundaries
    const yearStartStr = new Date(year, 0, 1).toISOString();
    const yearEndStr = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();

    // ── Week boundaries (Mon–Sun) based on filters ──────────────────────────
    let targetDate = new Date();
    if (period === "month") {
      const today = new Date();
      if (year === today.getFullYear() && month === today.getMonth() + 1) {
        targetDate = today;
      } else {
        targetDate = new Date(year, month - 1, 15);
      }
    } else if (period === "date" && params.startDate) {
      targetDate = new Date(params.startDate);
    } else if (period === "year") {
      targetDate = new Date(year, 5, 15); // middle of the year
    }

    const dayOfWeek  = targetDate.getDay() === 0 ? 7 : targetDate.getDay(); // 1=Mon … 7=Sun
    const weekStart  = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() - dayOfWeek + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd    = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekEnd);
    prevWeekEnd.setDate(weekEnd.getDate() - 7);

    // Call the single consolidated dashboard stats RPC function
    const { data, error } = await supabaseClient.rpc("get_dashboard_stats", {
      p_start_time: startStr,
      p_end_time: endStr,
      p_week_start: weekStart.toISOString(),
      p_week_end: weekEnd.toISOString(),
      p_prev_week_start: prevWeekStart.toISOString(),
      p_prev_week_end: prevWeekEnd.toISOString(),
      p_year_start: yearStartStr,
      p_year_end: yearEndStr
    });

    if (error || !data) {
      if (error) console.error("Error fetching dashboard stats via RPC:", error.message);
      return null;
    }

    // ── Wallets & balance ──────────────────────────────────────────────────
    const wallets: Wallet[] = data.wallets ?? [];
    const totalBalance = data.total_balance ?? 0;

    // ── Recent transactions ────────────────────────────────────────────────
    const recentTransactions: TransactionRow[] = data.recent_transactions ?? [];

    // ── Monthly income / expense ───────────────────────────────────────────
    const monthlyIncome  = data.monthly_income ?? 0;
    const monthlyExpense = data.monthly_expense ?? 0;

    // ── Income by category (month) ─────────────────────────────────────────
    const rawIncomeCat = data.income_by_category ?? [];
    const totalIncomeMonth = rawIncomeCat.reduce((s: number, t: any) => s + (t.amount || 0), 0) || 1;
    const incomeByCategory: CategoryBreakdown[] = rawIncomeCat.map((t: any, i: number) => ({
      category:   t.category ?? "Lain-lain",
      amount:     t.amount ?? 0,
      percentage: Math.round(((t.amount || 0) / totalIncomeMonth) * 100),
      color:      SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    }));

    // ── Expense by category (month) ────────────────────────────────────────
    const rawExpenseCat = data.expense_by_category ?? [];
    const totalExpenseMonth = rawExpenseCat.reduce((s: number, t: any) => s + (t.amount || 0), 0) || 1;
    const expenseByCategory: CategoryBreakdown[] = rawExpenseCat.map((t: any, i: number) => ({
      category:   t.category ?? "Lain-lain",
      amount:     t.amount ?? 0,
      percentage: Math.round(((t.amount || 0) / totalExpenseMonth) * 100),
      color:      SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    }));

    // ── Monthly income history (Jan – Dec of selected year) ───────────────────────
    const rawHistory = data.monthly_income_history ?? [];
    const today = new Date();
    const historyMonths = (year === today.getFullYear()) ? today.getMonth() + 1 : 12;
    const monthlyIncomeHistory: MonthlyIncome[] = rawHistory
      .slice(0, historyMonths)
      .map((h: any) => ({
        month:      h.month,
        monthIndex: h.month_index,
        income:     h.income ?? 0,
      }));

    // ── YTD totals ─────────────────────────────────────────────────────────
    const ytdExpense = data.ytd_expense ?? 0;
    const ytdIncome  = data.ytd_income ?? 0;

    // ── Weekly expense data (Mon–Sun) ──────────────────────────────────────
    const rawWeekly = data.weekly_expenses ?? [];
    const weeklyAmounts = rawWeekly.map((w: any) => w.amount || 0);
    const maxDay = Math.max(...weeklyAmounts, 1);
    const weeklyExpenses: WeeklyExpense[] = rawWeekly.map((w: any) => ({
      day: w.day,
      amount:     w.amount ?? 0,
      heightPct:  Math.max(5, Math.round(((w.amount || 0) / maxDay) * 100)),
    }));

    // ── Prev Weekly expense data (Mon–Sun) ──────────────────────────────────
    const rawPrevWeekly = data.prev_weekly_expenses ?? [];
    const prevWeeklyAmounts = rawPrevWeekly.map((w: any) => w.amount || 0);
    const prevMaxDay = Math.max(...prevWeeklyAmounts, 1);
    const prevWeeklyExpenses: WeeklyExpense[] = rawPrevWeekly.map((w: any) => ({
      day: w.day,
      amount:     w.amount ?? 0,
      heightPct:  Math.max(5, Math.round(((w.amount || 0) / prevMaxDay) * 100)),
    }));

    return {
      totalBalance, monthlyIncome, monthlyExpense,
      recentTransactions, wallets,
      incomeByCategory, expenseByCategory,
      monthlyIncomeHistory, weeklyExpenses, prevWeeklyExpenses,
      ytdExpense, ytdIncome,
    };
  } catch (err: any) {
    console.error("Fatal error in fetchDashboardData:", err);
    return null;
  }
}

// ─── Balance Sync Helper ───────────────────────────────────────────────────────
/**
 * Atomically adjusts a wallet's balance by `delta`.
 * Positive delta = add money (income), Negative delta = subtract (expense).
 * Returns updated wallet or null on failure.
 */
export async function adjustWalletBalance(
  supabaseClient: any,
  walletId: string,
  delta: number
): Promise<Wallet | null> {
  if (!isConfigured || !supabaseClient) return null;
  // Use RPC for atomic read-modify-write to prevent race conditions
  const { data: current, error: fetchErr } = await supabaseClient
    .from("wallets")
    .select("id, name, balance, account_type, credit_limit, billing_date, billing_month_offset, due_date, due_month_offset")
    .eq("id", walletId)
    .single();
  if (fetchErr || !current) return null;

  const newBalance = (current.balance ?? 0) + delta;
  const { data: updated, error: updateErr } = await supabaseClient
    .from("wallets")
    .update({ balance: newBalance })
    .eq("id", walletId)
    .select("id, name, balance, account_type, credit_limit, billing_date, billing_month_offset, due_date, due_month_offset")
    .single();
  if (updateErr) return null;
  return updated as Wallet;
}

/**
 * Update wallet record (name and/or balance) in Supabase.
 */
export async function updateWallet(
  supabaseClient: any,
  walletId: string,
  data: {
    name?: string;
    balance?: number;
    account_type?: string;
    credit_limit?: number;
    billing_date?: number | null;
    billing_month_offset?: number;
    due_date?: number | null;
    due_month_offset?: number;
  }
): Promise<Wallet | null> {
  if (!isConfigured || !supabaseClient) return null;
  const { data: updated, error } = await supabaseClient
    .from("wallets")
    .update(data)
    .eq("id", walletId)
    .select("id, name, balance, account_type, credit_limit, billing_date, billing_month_offset, due_date, due_month_offset")
    .single();
  if (error) return null;
  return updated as Wallet;
}

/**
 * Delete a wallet from Supabase.
 */
export async function deleteWallet(supabaseClient: any, walletId: string): Promise<boolean> {
  if (!isConfigured || !supabaseClient) return false;
  const { error } = await supabaseClient
    .from("wallets")
    .delete()
    .eq("id", walletId);
  return !error;
}

/**
 * Compute the signed balance delta for a transaction type.
 * INCOME / INVESTMENT_SELL → positive (adds money)
 * EXPENSE / INVESTMENT_BUY → negative (removes money)
 */
export function getTransactionDelta(amount: number, type: TransactionType): number {
  return (type === "INCOME" || type === "INVESTMENT_SELL") ? amount : -amount;
}

// ─── Financial Health Score ──────────────────────────────────────────────────
export interface FinancialHealthQuest {
  id: string;
  description: string;
  status: 'success' | 'warning' | 'danger';
}

export interface FinancialHealth {
  score: number;
  rank_label: string;
  quests: FinancialHealthQuest[];
  breakdown: {
    savings_score: number;
    budget_score: number;
    credit_score: number;
    savings_rate: number;
    credit_utilization: number;
  };
}

export async function fetchFinancialHealth(
  supabaseClient: any,
  year: number,
  month: number
): Promise<FinancialHealth | null> {
  if (!isConfigured || !supabaseClient) return null;

  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabaseClient.rpc("get_financial_health_score", {
      p_user_id: user.id,
      p_year: year,
      p_month: month
    });

    if (error || !data) {
      console.error("Error fetching financial health score:", error?.message);
      return null;
    }

    return data as FinancialHealth;
  } catch (err: any) {
    console.error("Fatal error in fetchFinancialHealth:", err);
    return null;
  }
}
