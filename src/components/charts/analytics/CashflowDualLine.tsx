import { useMemo, useState } from "react";
import type { MonthlyTrendItem } from "../../../lib/analytics";
import { formatCompact, formatIDR } from "../../../lib/analytics";

interface CashflowDualLineProps {
  data: MonthlyTrendItem[];
}

export default function CashflowDualLine({ data }: CashflowDualLineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (!data.length) return null;

    const maxVal = Math.max(...data.flatMap((d) => [d.inflow, d.outflow]), 1);
    const width = 300;
    const height = 140;
    const padTop = 15;
    const padBottom = 5;
    const chartHeight = height - padTop - padBottom;
    const n = data.length;
    const xStep = n > 1 ? (width - 20) / (n - 1) : 0;

    function toPoint(val: number, i: number) {
      return {
        x: n > 1 ? (10 + i * xStep) : (width / 2),
        y: padTop + chartHeight - (val / maxVal) * chartHeight,
      };
    }

    function buildSpline(values: number[]) {
      const pts = values.map((v, i) => toPoint(v, i));
      if (pts.length < 2) return "";
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const cp1x = pts[i].x + (pts[i + 1].x - pts[i].x) / 3;
        const cp2x = pts[i + 1].x - (pts[i + 1].x - pts[i].x) / 3;
        d += ` C ${cp1x} ${pts[i].y} ${cp2x} ${pts[i + 1].y} ${pts[i + 1].x} ${pts[i + 1].y}`;
      }
      return d;
    }

    function buildArea(values: number[]) {
      const spline = buildSpline(values);
      if (!spline) return "";
      const pts = values.map((v, i) => toPoint(v, i));
      return `${spline} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;
    }

    const inflowPoints = data.map((d, i) => ({ ...toPoint(d.inflow, i), val: d.inflow }));
    const outflowPoints = data.map((d, i) => ({ ...toPoint(d.outflow, i), val: d.outflow }));

    return {
      maxVal,
      width,
      height,
      inflowSpline: buildSpline(data.map((d) => d.inflow)),
      outflowSpline: buildSpline(data.map((d) => d.outflow)),
      inflowArea: buildArea(data.map((d) => d.inflow)),
      outflowArea: buildArea(data.map((d) => d.outflow)),
      inflowPoints,
      outflowPoints,
      labels: data.map((d) => d.month_label),
    };
  }, [data]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartData || !data.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, mouseX / rect.width));
    
    const n = data.length;
    let idx = 0;
    if (n > 1) {
      idx = Math.round(pct * (n - 1));
    }
    setHoveredIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  if (!data.length || !chartData) {
    return (
      <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm h-full">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          Cash Flow Trend
        </h4>
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-12">
          <div className="text-center flex flex-col items-center gap-2">
            <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Belum ada data cashflow</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all h-full select-none">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          Cash Flow Trend
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-semibold text-muted-foreground">Inflow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[9px] font-semibold text-muted-foreground">Outflow</span>
          </div>
        </div>
      </div>

      {/* Y-axis max label */}
      <div className="text-[9px] font-bold text-muted-foreground mb-1">
        {formatCompact(chartData.maxVal)}
      </div>

      {/* Chart Canvas Area */}
      <div 
        className="relative w-full cursor-crosshair" 
        style={{ height: `${chartData.height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.65 0.20 150)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="oklch(0.65 0.20 150)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.55 0.22 20)" stopOpacity={0.1} />
              <stop offset="100%" stopColor="oklch(0.55 0.22 20)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((pct) => (
            <line
              key={pct}
              x1={10}
              y1={15 + (1 - pct) * 120}
              x2={290}
              y2={15 + (1 - pct) * 120}
              stroke="var(--color-border)"
              strokeWidth={0.5}
              strokeDasharray="4 4"
              opacity={0.4}
            />
          ))}

          {/* Inflow area + line */}
          {chartData.inflowArea && <path d={chartData.inflowArea} fill="url(#inflowGrad)" />}
          {chartData.inflowSpline && (
            <path
              d={chartData.inflowSpline}
              fill="none"
              stroke="oklch(0.65 0.20 150)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Outflow area + line */}
          {chartData.outflowArea && <path d={chartData.outflowArea} fill="url(#outflowGrad)" />}
          {chartData.outflowSpline && (
            <path
              d={chartData.outflowSpline}
              fill="none"
              stroke="oklch(0.55 0.22 20)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Vertical indicator line on hover */}
          {hoveredIndex !== null && (
            <line
              x1={chartData.inflowPoints[hoveredIndex].x}
              y1={0}
              x2={chartData.inflowPoints[hoveredIndex].x}
              y2={chartData.height}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}
        </svg>

        {/* Hover Highlight Dot Overlays (DOM elements to avoid aspect ratio stretching) */}
        {hoveredIndex !== null && (
          <>
            {/* Inflow dot */}
            <div
              className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20"
              style={{
                left: `${(chartData.inflowPoints[hoveredIndex].x / chartData.width) * 100}%`,
                top: `${(chartData.inflowPoints[hoveredIndex].y / chartData.height) * 100}%`,
              }}
            >
              <span className="w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full shadow absolute opacity-70 animate-ping" />
              <span className="w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full shadow" />
            </div>

            {/* Outflow dot */}
            <div
              className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20"
              style={{
                left: `${(chartData.outflowPoints[hoveredIndex].x / chartData.width) * 100}%`,
                top: `${(chartData.outflowPoints[hoveredIndex].y / chartData.height) * 100}%`,
              }}
            >
              <span className="w-3.5 h-3.5 bg-rose-500 border-2 border-card rounded-full shadow absolute opacity-70 animate-ping" />
              <span className="w-2.5 h-2.5 bg-rose-500 border-2 border-card rounded-full shadow" />
            </div>

            {/* Floating Tooltip Box */}
            <div
              className="absolute bg-card/95 backdrop-blur border border-border/80 text-[10px] font-bold px-3 py-1.5 rounded-2xl shadow-lg pointer-events-none z-30 flex items-center gap-2 -translate-x-1/2 -translate-y-14 transition-all duration-100"
              style={{
                left: `${(chartData.inflowPoints[hoveredIndex].x / chartData.width) * 100}%`,
                top: `${Math.min(chartData.inflowPoints[hoveredIndex].y, chartData.outflowPoints[hoveredIndex].y)}px`,
              }}
            >
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground border-r border-border/60 pr-1.5 shrink-0">
                {(() => {
                  const lbl = chartData.labels[hoveredIndex];
                  if (lbl.startsWith("W")) {
                    return `Week ${lbl.slice(1)}`;
                  }
                  return isFinite(parseInt(lbl, 10)) ? `Tgl ${lbl}` : lbl;
                })()}
              </span>
              <div className="flex flex-col text-left shrink-0">
                <span className="text-emerald-600 dark:text-emerald-400">In: {formatIDR(data[hoveredIndex].inflow)}</span>
                <span className="text-rose-500">Out: {formatIDR(data[hoveredIndex].outflow)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* X-axis labels with absolute positioning matching point coordinates */}
      <div className="relative h-4 text-[9px] font-bold text-muted-foreground mt-2 w-full">
        {chartData.labels.map((label, idx) => {
          const isDaily = chartData.labels.length > 12;
          const labelNum = parseInt(label.startsWith("W") ? label.slice(1) : label, 10);
          const showLabel = !isDaily || idx === 0 || idx === chartData.labels.length - 1 || (!isNaN(labelNum) && labelNum % 5 === 0);
          if (!showLabel) return null;

          const xVal = chartData.labels.length > 1 
            ? (10 + idx * ((300 - 20) / (chartData.labels.length - 1))) 
            : 150;
          const leftPct = (xVal / 300) * 100;

          return (
            <span
              key={idx}
              className="absolute -translate-x-1/2 transition-all duration-300 whitespace-nowrap"
              style={{ left: `${leftPct}%` }}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
