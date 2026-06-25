import React from 'react';
import { PlaneTakeoff, Clock, Activity } from 'lucide-react';
import { formatIDR } from '../lib/analytics';

interface FinancialRunwayCardProps {
  financialRunway: number;
  extendedRunway: number;
  threeMonthBurnRate: number;
}

export function FinancialRunwayCard({
  financialRunway,
  extendedRunway,
  threeMonthBurnRate,
}: FinancialRunwayCardProps) {
  return (
    <div className="bg-white dark:bg-[#141b2d] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none hover:border-emerald-500/30 transition-colors duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <PlaneTakeoff className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Financial Runway</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estimated survival time without income</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-300"></div>
          <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 relative z-10">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Liquid Runway</span>
          </div>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-3xl font-black text-[#059669] dark:text-emerald-400">{financialRunway}</span>
            <span className="text-sm font-semibold text-slate-500">months</span>
          </div>
        </div>

        <div className="bg-[#f8fafc] dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors duration-300"></div>
          <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 relative z-10">
            <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-500/70" />
            <span className="text-xs font-bold uppercase tracking-wider">Extended Runway</span>
          </div>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-3xl font-black text-[#059669] dark:text-emerald-400">{extendedRunway}</span>
            <span className="text-sm font-semibold text-slate-500">months</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 relative z-10">Includes portfolio assets</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">3-Month Trailing Burn Rate</span>
        </div>
        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatIDR(threeMonthBurnRate)} / mo</span>
      </div>
    </div>
  );
}
