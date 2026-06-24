import { useState, useMemo, useEffect } from "react";
import type { WeeklyExpense } from "../../lib/supabase";

interface WeeklyExpensesChartProps {
  title?: string;
  weeklyData?: WeeklyExpense[];
  prevWeeklyData?: WeeklyExpense[];
}

const DEFAULT_WEEK: WeeklyExpense[] = [
  { day: "Mon", amount: 0, heightPct: 5 },
  { day: "Tue", amount: 0, heightPct: 5 },
  { day: "Wed", amount: 0, heightPct: 5 },
  { day: "Thu", amount: 0, heightPct: 5 },
  { day: "Fri", amount: 0, heightPct: 5 },
  { day: "Sat", amount: 0, heightPct: 5 },
  { day: "Sun", amount: 0, heightPct: 5 },
];

function formatIDR(n: number) {
  if (n === 0) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function yLabel(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}rb`;
  return amount.toString();
}

export default function WeeklyExpensesChart({
  title = "Weekly Expenses",
  weeklyData = [],
  prevWeeklyData = [],
}: WeeklyExpensesChartProps) {
  const [activeWeek, setActiveWeek] = useState<"this" | "prev">("this");
  const [currentWeekData, setCurrentWeekData] = useState<WeeklyExpense[]>(weeklyData);
  const [previousWeekData, setPreviousWeekData] = useState<WeeklyExpense[]>(prevWeeklyData);
  const [activeBarIdx, setActiveBarIdx] = useState<number | null>(null);

  // Sync with props
  useEffect(() => {
    setCurrentWeekData(weeklyData);
  }, [weeklyData]);

  useEffect(() => {
    setPreviousWeekData(prevWeeklyData);
  }, [prevWeeklyData]);

  // Dynamic reload when data updates
  useEffect(() => {
    async function reloadData() {
      try {
        const { fetchDashboardData } = await import("../../lib/supabase");
        // Get filters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const period = (urlParams.get("period") as any) || "month";
        const year = parseInt(urlParams.get("year") || "2026", 10);
        const month = parseInt(urlParams.get("month") || "6", 10);
        const date = urlParams.get("date") || undefined;

        const data = await fetchDashboardData({
          period,
          year,
          month,
          startDate: date,
          endDate: date,
        });
        if (data) {
          setCurrentWeekData(data.weeklyExpenses || []);
          setPreviousWeekData(data.prevWeeklyExpenses || []);
        }
      } catch (err) {
        console.error("Failed to reload weekly data client-side:", err);
      }
    }
    window.addEventListener("refresh-data", reloadData);
    return () => window.removeEventListener("refresh-data", reloadData);
  }, []);

  // Determine active dataset
  const activeData = useMemo(() => {
    const data = activeWeek === "this" ? currentWeekData : previousWeekData;
    return data && data.length > 0 ? data : DEFAULT_WEEK;
  }, [activeWeek, currentWeekData, previousWeekData]);

  // Recalculate max amount for the active week
  const maxAmount = useMemo(() => {
    const max = Math.max(...activeData.map((d) => d.amount), 0);
    return max > 0 ? max : 1;
  }, [activeData]);

  return (
    <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl h-full shadow-sm hover:shadow-md transition-all select-none">
      {/* Chart Header with Toggle */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          {title}
        </h4>
        
        {/* iOS-style Segmented Control */}
        <div className="flex bg-muted/65 p-0.5 rounded-xl border border-border/40 relative">
          <button
            type="button"
            onClick={() => setActiveWeek("this")}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeWeek === "this"
                ? "text-primary-foreground bg-[#2F7E79] dark:bg-teal-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setActiveWeek("prev")}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeWeek === "prev"
                ? "text-primary-foreground bg-[#2F7E79] dark:bg-teal-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Prev Week
          </button>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="mt-5 flex flex-1 items-end gap-2 min-h-[180px] h-full pb-1">
        {/* Y-Axis */}
        <div className="flex flex-col justify-between h-[160px] text-[9px] font-semibold text-muted-foreground pr-1 text-right w-10 shrink-0 select-none">
          <span>{yLabel(maxAmount)}</span>
          <span>{yLabel(Math.round(maxAmount * 0.75))}</span>
          <span>{yLabel(Math.round(maxAmount * 0.5))}</span>
          <span>{yLabel(Math.round(maxAmount * 0.25))}</span>
          <span>0</span>
        </div>

        {/* Grid and Bars */}
        <div className="flex-1 flex items-end justify-between h-[160px] border-l border-b border-border/40 pl-2 relative">
          {/* Horizontal Grid Guides */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
            <div className="border-t border-muted-foreground w-full" />
            <div className="border-t border-muted-foreground w-full" />
            <div className="border-t border-muted-foreground w-full" />
            <div className="border-t border-muted-foreground w-full" />
          </div>

          {activeData.map((bar, index) => {
            // Dynamic bar height based on active data and active maxAmount
            const barHeight = Math.max(5, Math.round((bar.amount / maxAmount) * 100));

            return (
              <div
                key={bar.day}
                onClick={() => setActiveBarIdx(activeBarIdx === index ? null : index)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative px-0.5"
              >
                {/* Custom Tooltip */}
                <div className={`absolute -top-8 transition-opacity duration-200 bg-[#1B5C58] dark:bg-teal-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-lg z-10 whitespace-nowrap pointer-events-none -translate-x-1/2 left-1/2 ${activeBarIdx === index ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"}`}>
                  {formatIDR(bar.amount)}
                </div>

                {/* Animated Bar */}
                <div
                  className={`w-full max-w-[12px] rounded-t-full transition-all duration-300 group-hover:brightness-110 ${
                    bar.amount > 0
                      ? "bg-gradient-to-t from-[#2F7E79] to-[#1B5C58] dark:from-teal-500 dark:to-teal-600"
                      : "bg-muted/40"
                  }`}
                  style={{ height: `${barHeight}%` }}
                />

                {/* X label */}
                <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground mt-2 select-none absolute -bottom-5 transition-colors duration-200">
                  {bar.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
