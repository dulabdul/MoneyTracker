import React from "react";
import { type FinancialHealth } from "../lib/supabase";
import { CheckCircle2, AlertTriangle, XCircle, Shield, Crown, Zap, Flame } from "lucide-react";

interface Props {
  data: FinancialHealth | null;
}

export default function FinancialHealthWidget({ data }: Props) {
  if (!data) return null;

  // Theme based on rank
  let themeColor = "text-emerald-400";
  let strokeColor = "oklch(0.7 0.15 160)"; // Emerald
  let bgGlow = "shadow-[0_0_40px_rgba(52,211,153,0.15)]";
  let Icon = Crown;

  if (data.score >= 85) {
    themeColor = "text-emerald-400";
    strokeColor = "oklch(0.7 0.15 160)";
    bgGlow = "shadow-[0_0_40px_rgba(52,211,153,0.15)]";
    Icon = Crown;
  } else if (data.score >= 70) {
    themeColor = "text-cyan-400";
    strokeColor = "oklch(0.7 0.12 210)";
    bgGlow = "shadow-[0_0_40px_rgba(34,211,238,0.15)]";
    Icon = Shield;
  } else if (data.score >= 50) {
    themeColor = "text-amber-400";
    strokeColor = "oklch(0.75 0.15 70)";
    bgGlow = "shadow-[0_0_40px_rgba(251,191,36,0.15)]";
    Icon = Zap;
  } else {
    themeColor = "text-rose-500";
    strokeColor = "oklch(0.6 0.2 20)";
    bgGlow = "shadow-[0_0_40px_rgba(244,63,94,0.15)]";
    Icon = Flame;
  }

  // SVG parameters
  const radius = 60;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (data.score / 100) * circumference;

  return (
    <div className={`bg-white dark:bg-[#141b2d] rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-xl border border-slate-100 dark:border-white/5 relative overflow-hidden transition-all duration-500 hover:${bgGlow}`}>
      {/* Background soft glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ backgroundColor: strokeColor }}></div>

      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        
        {/* The SVG Progress Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="-rotate-90 transform"
          >
            {/* Background Track */}
            <circle
              stroke="rgba(255,255,255,0.05)"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Animated Score Track */}
            <circle
              stroke={strokeColor}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
              {data.score}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-white/40 tracking-wider">
              SCORE
            </span>
          </div>
        </div>

        {/* Title and Rank */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-3">
            <Icon className={`w-4 h-4 ${themeColor}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${themeColor}`}>
              {data.rank_label}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Kesehatan Finansial</h2>
          <p className="text-sm text-slate-500 dark:text-white/50 max-w-sm">
            Skor ini dihitung berdasarkan rasio tabungan, kepatuhan anggaran, dan penggunaan kreditmu.
          </p>
        </div>
      </div>

      {/* Quests Drawer */}
      {data.quests && data.quests.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/30"></span>
            Misi & Insight
          </h3>
          <div className="grid gap-3">
            {data.quests.map((quest, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className="shrink-0 mt-0.5">
                  {quest.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                  {quest.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />}
                  {quest.status === 'danger' && <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-500" />}
                </div>
                <p className="text-sm text-slate-700 dark:text-white/80 leading-snug">
                  {quest.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
