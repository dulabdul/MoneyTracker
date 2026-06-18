import { formatIDR, formatCompact } from "../../../lib/analytics";

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  trend?: { value: number; label: string };
  accentColor?: string;
}

export default function SummaryCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  accentColor = "teal",
}: SummaryCardProps) {
  const isPositive = trend ? trend.value >= 0 : true;

  return (
    <div className="relative flex flex-col justify-between p-5 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
      {/* Subtle gradient accent */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04] group-hover:opacity-[0.08] transition-opacity -translate-y-8 translate-x-8"
        style={{ background: `radial-gradient(circle, var(--color-primary), transparent)` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            <svg
              className={`h-3 w-3 ${isPositive ? "" : "rotate-180"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-xl font-black tracking-tight text-foreground mt-1 leading-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
