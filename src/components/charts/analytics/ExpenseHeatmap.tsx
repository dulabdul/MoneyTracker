import { useMemo, useState } from "react";
import type { DailyHeatmapItem } from "../../../lib/analytics";
import { formatIDR } from "../../../lib/analytics";

interface ExpenseHeatmapProps {
  data: DailyHeatmapItem[];
  year?: number;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

export default function ExpenseHeatmap({ data, year = 2026 }: ExpenseHeatmapProps) {
  const [activeDay, setActiveDay] = useState<{ dateStr: string; amount: number } | null>(null);

  const { grid, maxAmount, monthPositions } = useMemo(() => {
    // Build a lookup of date -> amount
    const lookup: Record<string, number> = {};
    let max = 0;
    for (const item of data) {
      lookup[item.date] = item.amount;
      if (item.amount > max) max = item.amount;
    }

    // Generate week columns for the year
    const weeks: { date: Date; amount: number; dateStr: string }[][] = [];
    const startDate = new Date(year, 0, 1);
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const firstMonday = new Date(year, 0, 1 + mondayOffset);

    let currentDate = new Date(firstMonday);
    let currentWeek: { date: Date; amount: number; dateStr: string }[] = [];

    while (currentDate.getFullYear() <= year) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const isCurrentYear = currentDate.getFullYear() === year;

      currentWeek.push({
        date: new Date(currentDate),
        amount: isCurrentYear ? (lookup[dateStr] ?? 0) : -1, // -1 = outside year
        dateStr,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);

      if (currentDate.getFullYear() > year && currentWeek.length === 0) break;
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Find month label positions
    const positions: { month: number; weekIndex: number }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < weeks.length; w++) {
      for (const day of weeks[w]) {
        if (day.date.getFullYear() === year) {
          const m = day.date.getMonth();
          if (m !== lastMonth) {
            positions.push({ month: m, weekIndex: w });
            lastMonth = m;
          }
        }
      }
    }

    return { grid: weeks, maxAmount: max || 1, monthPositions: positions };
  }, [data, year]);

  const formattedDate = useMemo(() => {
    if (!activeDay) return "";
    const d = new Date(activeDay.dateStr);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }, [activeDay]);

  function getIntensityClass(amount: number): string {
    if (amount < 0) return "bg-transparent";
    if (amount === 0) return "bg-muted/40 dark:bg-muted/20";
    const ratio = amount / maxAmount;
    if (ratio < 0.2) return "bg-emerald-200/60 dark:bg-emerald-900/40";
    if (ratio < 0.4) return "bg-emerald-300/70 dark:bg-emerald-700/50";
    if (ratio < 0.6) return "bg-teal-400/80 dark:bg-teal-600/60";
    if (ratio < 0.8) return "bg-teal-500 dark:bg-teal-500/80";
    return "bg-teal-700 dark:bg-teal-400";
  }

  if (!data.length) {
    return (
      <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm h-full">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          Expense Heatmap
        </h4>
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-12">
          <div className="text-center flex flex-col items-center gap-2">
            <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Belum ada data pengeluaran harian</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all h-full select-none">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          Expense Heatmap {year}
        </h4>
        {/* Legend */}
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-medium">
          <span>Less</span>
          <span className="h-2.5 w-2.5 rounded-[3px] bg-muted/40 dark:bg-muted/20" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-200/60 dark:bg-emerald-900/40" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-300/70 dark:bg-emerald-700/50" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-teal-500 dark:bg-teal-500/80" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-teal-700 dark:bg-teal-400" />
          <span>More</span>
        </div>
      </div>

      {/* Scrollable heatmap grid */}
      <div className="overflow-x-auto -mx-1 pb-2">
        <div className="inline-flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] pr-1 shrink-0">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-[11px] flex items-center text-[8px] font-medium text-muted-foreground">
                {label}
              </div>
            ))}
          </div>

          {/* Weeks grid */}
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => {
                const isActive = activeDay?.dateStr === day.dateStr;
                const hasTransactions = day.amount >= 0;

                return (
                  <div
                    key={`${wi}-${di}`}
                    onClick={() => {
                      if (hasTransactions) {
                        setActiveDay(
                          activeDay?.dateStr === day.dateStr ? null : { dateStr: day.dateStr, amount: day.amount }
                        );
                      }
                    }}
                    onMouseEnter={() => {
                      if (hasTransactions) {
                        setActiveDay({ dateStr: day.dateStr, amount: day.amount });
                      }
                    }}
                    className={`h-[11px] w-[11px] rounded-[3px] transition-all ${getIntensityClass(day.amount)} ${
                      hasTransactions ? "cursor-pointer hover:scale-115 hover:ring-1 hover:ring-primary/60" : ""
                    } ${
                      isActive ? "ring-2 ring-primary ring-offset-1 dark:ring-offset-zinc-950 scale-120 z-10 shadow-sm" : ""
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Month labels */}
      <div className="relative h-4 mt-1 ml-6 border-b border-border/10 pb-4">
        {monthPositions.map(({ month, weekIndex }) => (
          <span
            key={month}
            className="absolute text-[8px] font-semibold text-muted-foreground"
            style={{ left: `${weekIndex * 14}px` }}
          >
            {MONTH_LABELS[month]}
          </span>
        ))}
      </div>

      {/* Interactive Detail Bar at bottom */}
      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs transition-all duration-300 h-6">
        {activeDay ? (
          <>
            <span className="font-semibold text-muted-foreground">
              {formattedDate}
            </span>
            <span className="font-bold text-foreground">
              {formatIDR(activeDay.amount)}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground/60 italic text-[10px] w-full text-center">
            Arahkan kursor atau ketuk kotak untuk melihat detail pengeluaran harian
          </span>
        )}
      </div>
    </div>
  );
}
