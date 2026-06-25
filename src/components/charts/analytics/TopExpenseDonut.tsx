import { useState, useMemo } from "react";
import type { TopExpenseWithColor } from "../../../lib/analytics";
import { formatIDR } from "../../../lib/analytics";

interface TopExpenseDonutProps {
  data: TopExpenseWithColor[];
  title?: string;
  centerLabel?: string;
  centerValue?: string;
}

export default function TopExpenseDonut({
  data,
  title = "Pengeluaran Berdasarkan Kategori",
  centerLabel = "Total",
  centerValue,
}: TopExpenseDonutProps) {
  const [viewState, setViewState] = useState<'chart' | 'grid'>('chart');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Chart configuration
  const R = 75;
  const CIRC = 2 * Math.PI * R;
  
  // Total across all categories (not just top 5)
  const totalAmount = data.reduce((s, d) => s + d.amount, 0);
  const defaultCenterValue = centerValue ?? formatIDR(totalAmount);

  // For the chart, we strictly limit to the top 5 to avoid visual clutter
  const top5Data = data.slice(0, 5);

  const segments = useMemo(() => {
    // We base the donut segments on their actual percentage relative to the *total* expense pool.
    // This accurately visualizes how much the top 5 make up of the entire pie.
    let offset = 0;
    return top5Data.map((d) => {
      // D.pct is already correctly calculated against the true total in lib/analytics.ts
      const pctRatio = d.pct / 100;
      const dashLen = pctRatio * CIRC;
      const dashGap = CIRC - dashLen + 2;
      const segOffset = CIRC - offset;
      offset += dashLen;
      return { ...d, dashLen, dashGap, offset: segOffset };
    });
  }, [top5Data]);

  if (!data.length) {
    return (
      <div className="flex flex-col p-5 bg-[#141b2d] border border-slate-800 rounded-3xl shadow-sm h-full">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          {title}
        </h4>
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-12">
          <div className="text-center flex flex-col items-center gap-2">
            <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
            </svg>
            <span>Belum ada data pengeluaran</span>
          </div>
        </div>
      </div>
    );
  }

  const activeData = activeIndex !== null ? top5Data[activeIndex] : null;

  return (
    <div className="flex flex-col p-5 md:p-6 bg-white dark:bg-[#141b2d] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-sm h-full transition-all">
      {/* Header & Capsule Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          {title}
        </h4>
        
        <div className="flex items-center bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-full p-1 w-max">
          <button
            onClick={() => setViewState('chart')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all ${
              viewState === 'chart' 
                ? 'bg-[#059669]/10 text-[#059669] dark:bg-teal-500/20 dark:text-teal-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            Grafik Utama
          </button>
          <button
            onClick={() => setViewState('grid')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all ${
              viewState === 'grid' 
                ? 'bg-[#059669]/10 text-[#059669] dark:bg-teal-500/20 dark:text-teal-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            Semua Kategori
          </button>
        </div>
      </div>

      {/* Content Area with Fade Transition */}
      <div className="grid grid-cols-1 grid-rows-1 flex-1 min-h-[220px]">
        {/* VIEW 1: DONUT CHART (Top 5) */}
        <div 
          className={`col-start-1 row-start-1 transition-opacity duration-500 flex flex-col ${
            viewState === 'chart' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
          onClick={() => setActiveIndex(null)}
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[180px] md:max-w-[200px] aspect-square flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle cx={100} cy={100} r={R} fill="none" stroke="var(--color-border)" strokeWidth={14} strokeOpacity={0.2} />
                {segments.map((seg, i) => (
                  <circle
                    key={i}
                    cx={100}
                    cy={100}
                    r={R}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={activeIndex === i ? 20 : 16}
                    strokeDasharray={`${Math.max(0, seg.dashLen - 3)} ${seg.dashGap + 3}`}
                    strokeDashoffset={seg.offset}
                    strokeLinecap="round"
                    className="transition-all duration-300 cursor-pointer"
                    style={{ opacity: activeIndex !== null && activeIndex !== i ? 0.3 : 1 }}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={(e) => { e.stopPropagation(); setActiveIndex(i === activeIndex ? null : i); }}
                  />
                ))}
              </svg>

              {/* Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#1B5C58]/80 dark:text-teal-400 transition-all">
                  {activeData ? activeData.category : centerLabel}
                </span>
                <span className="text-sm md:text-base font-black tracking-tight text-slate-900 dark:text-white mt-0.5 transition-all">
                  {activeData ? formatIDR(activeData.amount) : defaultCenterValue}
                </span>
                {activeData && (
                  <span className="text-[10px] font-bold text-[#059669] dark:text-teal-500 mt-1 bg-[#059669]/10 dark:bg-teal-500/10 px-2 py-0.5 rounded-full">
                    {activeData.pct}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Legend for Top 5 */}
          <div className="w-full mt-6 grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3 border-t border-slate-200 dark:border-slate-800/60 pt-4">
            {top5Data.map((seg, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                style={{ opacity: activeIndex !== null && activeIndex !== i ? 0.35 : 1 }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-slate-900 dark:text-white leading-none text-[11px] mb-1">{seg.category}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{seg.pct}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIEW 2: COMPREHENSIVE GRID (All Categories) */}
        <div 
          className={`col-start-1 row-start-1 transition-opacity duration-500 overflow-y-auto custom-scrollbar pr-1 max-h-[350px] ${
            viewState === 'grid' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
            {data.map((item, i) => (
              <div 
                key={i}
                className="bg-[#f8fafc] dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 flex flex-col transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/40"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.category}</h5>
                  </div>
                  <span className="text-[9px] font-bold text-[#059669] dark:text-teal-400 bg-[#059669]/10 dark:bg-teal-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {item.pct}%
                  </span>
                </div>
                
                <div className="mt-auto flex flex-col gap-1">
                  <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                    {formatIDR(item.amount)}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {item.count} Transaksi
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
