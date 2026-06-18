import { useMemo } from "react";
import type { GoalItem } from "../../../lib/analytics";
import { formatIDR, formatCompact } from "../../../lib/analytics";

interface GoalVelocityLineProps {
  goals: GoalItem[];
}

const GOAL_COLORS = [
  "oklch(0.65 0.20 150)",
  "oklch(0.45 0.16 250)",
  "oklch(0.55 0.22 20)",
  "oklch(0.65 0.25 45)",
  "oklch(0.35 0.18 310)",
];

export default function GoalVelocityLine({ goals }: GoalVelocityLineProps) {
  if (!goals.length) {
    return (
      <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm h-full">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          Goal Velocity
        </h4>
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-12">
          <div className="text-center flex flex-col items-center gap-2">
            <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx={12} cy={12} r={10} />
              <circle cx={12} cy={12} r={6} />
              <circle cx={12} cy={12} r={2} />
            </svg>
            <span>Belum ada goals aktif</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all h-full">
      <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider mb-4">
        Goal Velocity & Projections
      </h4>

      <div className="flex-1 space-y-4">
        {goals.map((goal, i) => {
          const color = GOAL_COLORS[i % GOAL_COLORS.length];
          const progressPct = Math.min(goal.progress_pct, 100);
          const isOnTrack = goal.projected_date
            ? new Date(goal.projected_date) <= new Date(goal.target_date)
            : goal.progress_pct >= 50;
          const isAchieved = goal.progress_pct >= 100;

          return (
            <div key={goal.id} className="group">
              {/* Goal header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[11px] font-bold text-foreground truncate">
                    {goal.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isAchieved ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      ✓ Achieved
                    </span>
                  ) : isOnTrack ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      On Track
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Behind
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {progressPct.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Progress bar with target marker */}
              <div className="relative h-4 w-full bg-muted/30 rounded-lg overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-lg transition-all duration-700"
                  style={{
                    width: `${progressPct}%`,
                    background: `linear-gradient(to right, ${color}, ${color}dd)`,
                  }}
                />
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between mt-1.5 text-[9px] text-muted-foreground">
                <span>
                  {formatCompact(goal.current_amount)} / {formatCompact(goal.target_amount)}
                </span>
                <span>
                  Velocity: <span className="font-bold text-foreground">{formatCompact(goal.monthly_velocity)}</span>/bln
                </span>
                {goal.projected_date && !isAchieved && (
                  <span>
                    Est.{" "}
                    <span className={`font-bold ${isOnTrack ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {new Date(goal.projected_date).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                    </span>
                  </span>
                )}
              </div>

              {/* Target date info */}
              <div className="flex items-center justify-between mt-0.5 text-[9px] text-muted-foreground">
                <span>Target: {new Date(goal.target_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span>{goal.days_to_target} hari lagi</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
