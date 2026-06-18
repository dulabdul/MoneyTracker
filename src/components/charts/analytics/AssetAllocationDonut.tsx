import { useState, useMemo } from "react";
import type { NetWorthAllocation } from "../../../lib/analytics";
import { formatIDR } from "../../../lib/analytics";

interface AssetAllocationDonutProps {
  data: NetWorthAllocation[];
  totalNetWorth?: number;
}

export default function AssetAllocationDonut({
  data,
  totalNetWorth = 0,
}: AssetAllocationDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const R = 75;
  const CIRC = 2 * Math.PI * R;

  const segments = useMemo(() => {
    const totalPct = data.reduce((s, d) => s + d.pct, 0) || 100;
    let offset = 0;
    return data.map((d) => {
      const pct = d.pct / totalPct;
      const dashLen = pct * CIRC;
      const dashGap = CIRC - dashLen + 2;
      const segOffset = CIRC - offset;
      offset += dashLen;
      return { ...d, dashLen, dashGap, offset: segOffset };
    });
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm h-full">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          Asset Allocation
        </h4>
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-12">
          Belum ada data alokasi aset
        </div>
      </div>
    );
  }

  const activeData = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div
      className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all h-full select-none"
      onClick={() => setActiveIndex(null)}
    >
      <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider mb-3">
        Asset Allocation
      </h4>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[160px]">
        <div className="relative w-full max-w-[180px] aspect-square flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <circle cx={100} cy={100} r={R} fill="none" stroke="var(--color-border)" strokeWidth={14} strokeOpacity={0.4} />
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={100}
                cy={100}
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={activeIndex === i ? 20 : 16}
                strokeDasharray={`${seg.dashLen - 3} ${seg.dashGap + 3}`}
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

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#1B5C58]/80 dark:text-teal-400">
              {activeData ? activeData.type : "Net Worth"}
            </span>
            <span className="text-sm font-black tracking-tight text-foreground mt-0.5">
              {activeData ? formatIDR(activeData.value) : formatIDR(totalNetWorth)}
            </span>
            {activeData && (
              <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 mt-0.5">{activeData.pct}%</span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/40 pt-3">
        {data.map((seg, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
            style={{ opacity: activeIndex !== null && activeIndex !== i ? 0.35 : 1 }}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <div className="flex-1 min-w-0">
              <p className="truncate text-foreground leading-none text-[11px]">{seg.type}</p>
              <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{seg.pct}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
