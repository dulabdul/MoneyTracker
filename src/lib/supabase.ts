import { createClient } from "@supabase/supabase-js";

// ─── Database Types ────────────────────────────────────────────────────────────
export type TransactionType =
  | "INCOME"
  | "EXPENSE"
  | "INVESTMENT_BUY"
  | "INVESTMENT_SELL";

export interface Wallet {
  id: string;
  name: string;
  balance: number;
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

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
export async function fetchDashboardData(params: FilterParams = {}): Promise<DashboardStats | null> {
  if (!isConfigured || !supabase) return null;

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

    const [walletsRes, recentRes, monthlyRes, ytdRes, weekRes, prevWeekRes] = await Promise.all([
      supabase.from("wallets").select("id, name, balance"),
      supabase
        .from("transactions")
        .select("*, wallets(name), categories(name)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("transactions")
        .select("amount, type, categories(name)")
        .gte("created_at", startStr)
        .lte("created_at", endStr),
      supabase
        .from("transactions")
        .select("amount, type, categories(name), created_at")
        .gte("created_at", yearStartStr)
        .lte("created_at", yearEndStr),
      supabase
        .from("transactions")
        .select("amount, type, created_at")
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString()),
      supabase
        .from("transactions")
        .select("amount, type, created_at")
        .gte("created_at", prevWeekStart.toISOString())
        .lte("created_at", prevWeekEnd.toISOString()),
    ]);

    // ── Wallets & balance ──────────────────────────────────────────────────
    const wallets: Wallet[] = walletsRes.data ?? [];
    const totalBalance = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);

    // ── Recent transactions ────────────────────────────────────────────────
    const recentTransactions: TransactionRow[] = (recentRes.data ?? []).map((row: any) => ({
      ...row,
      wallet_name:   row.wallets?.name   ?? "—",
      category_name: row.categories?.name ?? "—",
    }));

    // ── Monthly income / expense ───────────────────────────────────────────
    const monthly = monthlyRes.data ?? [];
    const monthlyIncome  = monthly.filter((t: any) => t.type === "INCOME").reduce((s: number, t: any) => s + t.amount, 0);
    const monthlyExpense = monthly.filter((t: any) => t.type === "EXPENSE").reduce((s: number, t: any) => s + t.amount, 0);

    // ── Income by category (month) ─────────────────────────────────────────
    const incomeTx = monthly.filter((t: any) => t.type === "INCOME");
    const incomeCatMap: Record<string, number> = {};
    incomeTx.forEach((t: any) => {
      const cat = (t.categories as any)?.name ?? "Lain-lain";
      incomeCatMap[cat] = (incomeCatMap[cat] ?? 0) + t.amount;
    });
    const totalIncomeMonth = Object.values(incomeCatMap).reduce((s, v) => s + v, 0) || 1;
    const incomeByCategory: CategoryBreakdown[] = Object.entries(incomeCatMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, amt], i) => ({
        category:   cat,
        amount:     amt,
        percentage: Math.round((amt / totalIncomeMonth) * 100),
        color:      SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      }));

    // ── Expense by category (month) ────────────────────────────────────────
    const expenseTx = monthly.filter((t: any) => t.type === "EXPENSE");
    const expCatMap: Record<string, number> = {};
    expenseTx.forEach((t: any) => {
      const cat = (t.categories as any)?.name ?? "Lain-lain";
      expCatMap[cat] = (expCatMap[cat] ?? 0) + t.amount;
    });
    const totalExpenseMonth = Object.values(expCatMap).reduce((s, v) => s + v, 0) || 1;
    const expenseByCategory: CategoryBreakdown[] = Object.entries(expCatMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, amt], i) => ({
        category:   cat,
        amount:     amt,
        percentage: Math.round((amt / totalExpenseMonth) * 100),
        color:      SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      }));

    // ── Monthly income history (Jan – Dec of selected year) ───────────────────────
    const ytdTx = ytdRes.data ?? [];
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const incomePerMonth: Record<number, number> = {};
    ytdTx.filter((t: any) => t.type === "INCOME").forEach((t: any) => {
      const m = new Date(t.created_at).getMonth(); // 0-indexed
      incomePerMonth[m] = (incomePerMonth[m] ?? 0) + t.amount;
    });
    const today = new Date();
    const historyMonths = (year === today.getFullYear()) ? today.getMonth() + 1 : 12;
    const monthlyIncomeHistory: MonthlyIncome[] = Array.from({ length: historyMonths }, (_, i) => ({
      month:      monthNames[i],
      monthIndex: i + 1,
      income:     incomePerMonth[i] ?? 0,
    }));

    // ── YTD totals ─────────────────────────────────────────────────────────
    const ytdExpense = ytdTx.filter((t: any) => t.type === "EXPENSE").reduce((s: number, t: any) => s + t.amount, 0);
    const ytdIncome  = ytdTx.filter((t: any) => t.type === "INCOME").reduce((s: number, t: any) => s + t.amount, 0);

    // ── Weekly expense data (Mon–Sun) ──────────────────────────────────────
    const weekTx = weekRes.data ?? [];
    const dayLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const expPerDay: number[] = new Array(7).fill(0);
    weekTx.filter((t: any) => t.type === "EXPENSE").forEach((t: any) => {
      const d = new Date(t.created_at);
      let dow = d.getDay() === 0 ? 7 : d.getDay(); // 1=Mon … 7=Sun
      expPerDay[dow - 1] += t.amount;
    });
    const maxDay = Math.max(...expPerDay, 1);
    const weeklyExpenses: WeeklyExpense[] = dayLabels.map((day, i) => ({
      day,
      amount:     expPerDay[i],
      heightPct:  Math.max(5, Math.round((expPerDay[i] / maxDay) * 100)),
    }));

    // ── Prev Weekly expense data (Mon–Sun) ──────────────────────────────────
    const prevWeekTx = prevWeekRes.data ?? [];
    const prevExpPerDay: number[] = new Array(7).fill(0);
    prevWeekTx.filter((t: any) => t.type === "EXPENSE").forEach((t: any) => {
      const d = new Date(t.created_at);
      let dow = d.getDay() === 0 ? 7 : d.getDay(); // 1=Mon … 7=Sun
      prevExpPerDay[dow - 1] += t.amount;
    });
    const prevMaxDay = Math.max(...prevExpPerDay, 1);
    const prevWeeklyExpenses: WeeklyExpense[] = dayLabels.map((day, i) => ({
      day,
      amount:     prevExpPerDay[i],
      heightPct:  Math.max(5, Math.round((prevExpPerDay[i] / prevMaxDay) * 100)),
    }));

    return {
      totalBalance, monthlyIncome, monthlyExpense,
      recentTransactions, wallets,
      incomeByCategory, expenseByCategory,
      monthlyIncomeHistory, weeklyExpenses, prevWeeklyExpenses,
      ytdExpense, ytdIncome,
    };
  } catch {
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
  walletId: string,
  delta: number
): Promise<Wallet | null> {
  if (!isConfigured || !supabase) return null;
  // Use RPC for atomic read-modify-write to prevent race conditions
  const { data: current, error: fetchErr } = await supabase
    .from("wallets")
    .select("id, name, balance")
    .eq("id", walletId)
    .single();
  if (fetchErr || !current) return null;

  const newBalance = (current.balance ?? 0) + delta;
  const { data: updated, error: updateErr } = await supabase
    .from("wallets")
    .update({ balance: newBalance })
    .eq("id", walletId)
    .select("id, name, balance")
    .single();
  if (updateErr) return null;
  return updated as Wallet;
}

/**
 * Update wallet record (name and/or balance) in Supabase.
 */
export async function updateWallet(
  walletId: string,
  data: { name?: string; balance?: number }
): Promise<Wallet | null> {
  if (!isConfigured || !supabase) return null;
  const { data: updated, error } = await supabase
    .from("wallets")
    .update(data)
    .eq("id", walletId)
    .select("id, name, balance")
    .single();
  if (error) return null;
  return updated as Wallet;
}

/**
 * Delete a wallet from Supabase.
 */
export async function deleteWallet(walletId: string): Promise<boolean> {
  if (!isConfigured || !supabase) return false;
  const { error } = await supabase
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
