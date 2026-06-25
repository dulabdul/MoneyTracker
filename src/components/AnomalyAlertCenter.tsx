import React from 'react';
import { ShieldAlert, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatIDR } from '../lib/analytics';
import type { AnomalyAlert } from '../lib/analytics';

interface AnomalyAlertCenterProps {
  alerts: AnomalyAlert[];
}

export function AnomalyAlertCenter({ alerts }: AnomalyAlertCenterProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#141b2d] border border-emerald-100 dark:border-emerald-900/30 rounded-3xl p-6 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Anomaly Engine Active</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sistem aman. Tidak ada anomali atau kebocoran terdeteksi bulan ini.</p>
          </div>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  return (
    <div className="bg-white dark:bg-[#141b2d] border border-rose-100 dark:border-rose-900/30 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-sm overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Anomaly & Leak Engine</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {alerts.length} anomali terdeteksi bulan ini
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {criticalAlerts.map(alert => (
          <div key={alert.id} className="flex flex-col bg-[#f8fafc] dark:bg-[#0f172a] border border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 hover:border-rose-300 dark:hover:border-rose-500/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20">
                  Critical
                </span>
              </div>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{alert.title}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{alert.description}</p>
            <div className="mt-auto flex items-end justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nilai Kebocoran</span>
              <span className="text-base font-black text-rose-500">+{formatIDR(alert.value)}</span>
            </div>
          </div>
        ))}

        {warningAlerts.map(alert => (
          <div key={alert.id} className="flex flex-col bg-[#f8fafc] dark:bg-[#0f172a] border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 hover:border-amber-300 dark:hover:border-amber-500/40 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                  Warning
                </span>
              </div>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{alert.title}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{alert.description}</p>
            <div className="mt-auto flex items-end justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {alert.date ? alert.date : 'Nilai Transaksi'}
              </span>
              <span className="text-base font-black text-amber-500">{formatIDR(alert.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
