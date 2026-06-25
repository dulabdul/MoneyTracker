import React from 'react';
import { CalendarDays, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { formatIDR } from '../lib/analytics';
import type { CashflowAnalytics } from '../lib/analytics';

interface TemporalInsightsWidgetProps {
  insights: CashflowAnalytics['temporal_insights'];
}

export function TemporalInsightsWidget({ insights }: TemporalInsightsWidgetProps) {
  const { weekend_ratio, weekday_ratio, weekend_total, weekday_total, payday_effect } = insights;

  const paydayDiff = payday_effect.post_payday_avg_daily - payday_effect.normal_avg_daily;
  const paydayVelocity = payday_effect.normal_avg_daily > 0 
    ? (paydayDiff / payday_effect.normal_avg_daily) * 100 
    : 0;

  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col gap-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Temporal Insights</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Behavioral spending patterns over time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Weekend vs Weekday Ratio */}
        <div className="flex flex-col">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-300">Weekend vs Weekday</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Expenditure distribution split</p>
            </div>
          </div>
          
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800/80 flex overflow-hidden mb-4 border border-slate-300/50 dark:border-slate-700/50">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all duration-700" 
              style={{ width: `${weekday_ratio}%` }}
              title="Weekday"
            />
            <div 
              className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-700" 
              style={{ width: `${weekend_ratio}%` }}
              title="Weekend"
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Weekday</span>
              <span className="font-bold text-slate-900 dark:text-white">{weekday_ratio}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Weekend</span>
              <span className="font-bold text-slate-900 dark:text-white">{weekend_ratio}%</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 px-4">
            <span>{formatIDR(weekday_total)}</span>
            <span>{formatIDR(weekend_total)}</span>
          </div>
        </div>

        {/* Payday Effect Tracker */}
        <div className="flex flex-col p-5 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors duration-300"></div>
          
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-300">Payday Effect</h4>
              </div>
              <p className="text-[10px] text-slate-500">Expenditure velocity 7-days post-income</p>
            </div>
            
            {paydayVelocity > 0 ? (
              <div className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20">
                <ArrowUpRight className="w-3 h-3" />
                <span className="text-[10px] font-bold">+{paydayVelocity.toFixed(1)}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                <ArrowDownRight className="w-3 h-3" />
                <span className="text-[10px] font-bold">{paydayVelocity.toFixed(1)}%</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
            <div className="flex flex-col p-3 rounded-xl bg-white dark:bg-[#0f172a]/50 border border-slate-100 dark:border-slate-800/80 shadow-sm dark:shadow-none">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Post-Payday</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{formatIDR(payday_effect.post_payday_avg_daily)}</span>
              <span className="text-[9px] text-slate-500">avg. daily</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-white dark:bg-[#0f172a]/50 border border-slate-100 dark:border-slate-800/80 shadow-sm dark:shadow-none">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Normal Days</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{formatIDR(payday_effect.normal_avg_daily)}</span>
              <span className="text-[9px] text-slate-500">avg. daily</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
