import { useMemo } from "react";
import type { FundFlowItem } from "../../../lib/analytics";
import { formatIDR, formatCompact } from "../../../lib/analytics";

interface FundFlowDiagramProps {
  flows: FundFlowItem[];
  totalFlow: number;
}

const SOURCE_COLORS: Record<string, string> = {};
const DEST_COLORS: Record<string, string> = {};
const PALETTE = [
  "oklch(0.65 0.20 150)",
  "oklch(0.45 0.16 250)",
  "oklch(0.55 0.22 20)",
  "oklch(0.65 0.25 45)",
  "oklch(0.35 0.18 310)",
  "oklch(0.60 0.18 200)",
];

export default function FundFlowDiagram({ flows, totalFlow }: FundFlowDiagramProps) {
  const { sources, destinations, links } = useMemo(() => {
    if (!flows.length) return { sources: [], destinations: [], links: [] };

    // Aggregate sources and destinations
    const srcMap = new Map<string, number>();
    const destMap = new Map<string, number>();

    for (const flow of flows) {
      srcMap.set(flow.source, (srcMap.get(flow.source) ?? 0) + flow.amount);
      destMap.set(flow.destination, (destMap.get(flow.destination) ?? 0) + flow.amount);
    }

    const sources = Array.from(srcMap.entries())
      .map(([name, amount], i) => ({ name, amount, color: PALETTE[i % PALETTE.length] }))
      .sort((a, b) => b.amount - a.amount);

    const destinations = Array.from(destMap.entries())
      .map(([name, amount], i) => ({ name, amount, color: PALETTE[(i + 2) % PALETTE.length] }))
      .sort((a, b) => b.amount - a.amount);

    return { sources, destinations, links: flows };
  }, [flows]);

  if (!flows.length) {
    return (
      <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm h-full">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          Fund Flow
        </h4>
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-12">
          <div className="text-center flex flex-col items-center gap-2">
            <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Belum ada aliran dana ke goals</span>
          </div>
        </div>
      </div>
    );
  }

  const maxAmount = Math.max(...sources.map((s) => s.amount), ...destinations.map((d) => d.amount), 1);

  return (
    <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all h-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
          Fund Flow: Wallet → Goals
        </h4>
        <span className="text-[10px] font-bold text-muted-foreground">
          Total: {formatIDR(totalFlow)}
        </span>
      </div>

      {/* Simplified Sankey: Source → Destination */}
      <div className="flex-1 flex items-stretch gap-3">
        {/* Sources column */}
        <div className="flex-1 flex flex-col gap-2">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Sumber
          </span>
          {sources.map((src, i) => {
            const heightPct = Math.max(20, (src.amount / maxAmount) * 100);
            return (
              <div key={src.name} className="flex items-center gap-2 group">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-semibold text-foreground truncate">{src.name}</span>
                    <span className="text-[9px] font-bold text-muted-foreground">{formatCompact(src.amount)}</span>
                  </div>
                  <div className="h-3 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${heightPct}%`,
                        backgroundColor: src.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrow connector */}
        <div className="flex items-center justify-center px-1 shrink-0">
          <div className="flex flex-col items-center gap-1">
            <svg className="h-6 w-6 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-[8px] font-bold text-muted-foreground">
              {links.length} transfer
            </span>
          </div>
        </div>

        {/* Destinations column */}
        <div className="flex-1 flex flex-col gap-2">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Tujuan
          </span>
          {destinations.map((dest, i) => {
            const heightPct = Math.max(20, (dest.amount / maxAmount) * 100);
            return (
              <div key={dest.name} className="flex items-center gap-2 group">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-semibold text-foreground truncate">{dest.name}</span>
                    <span className="text-[9px] font-bold text-muted-foreground">{formatCompact(dest.amount)}</span>
                  </div>
                  <div className="h-3 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${heightPct}%`,
                        backgroundColor: dest.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flow detail table */}
      <div className="mt-4 border-t border-border/40 pt-3">
        <div className="space-y-1.5">
          {links.slice(0, 5).map((link, i) => (
            <div key={i} className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="font-medium text-foreground truncate">{link.source}</span>
                <svg className="h-3 w-3 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="font-medium text-foreground truncate">{link.destination}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="font-bold text-foreground">{formatCompact(link.amount)}</span>
                <span className="text-muted-foreground">({link.transfer_count}x)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
