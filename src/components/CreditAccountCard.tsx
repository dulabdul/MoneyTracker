import { useState } from "react";
import type { Wallet } from "@/lib/supabase";
import {
  getCreditUsed,
  getCreditAvailable,
  getCreditUsagePercent,
  getCreditDateLabel,
} from "@/lib/supabase";
import { getAccountLogo } from "@/lib/logoUtils";

// ─── IDR Formatter ────────────────────────────────────────────────────────────
function formatIDR(n: number) {
  return "Rp " + new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Account Logo ─────────────────────────────────────────────────────────────
function AccountLogo({ name }: { name: string }) {
  const logo = getAccountLogo(name);
  if (logo.type === "fallback") {
    return (
      <div
        className={`h-full w-full flex items-center justify-center text-white font-extrabold text-sm bg-gradient-to-tr ${logo.bgGradient}`}
      >
        {logo.value}
      </div>
    );
  }
  return (
    <img
      src={logo.value}
      alt={name}
      className="h-7 w-7 object-contain"
      width={28}
      height={28}
      onError={(e) => {
        const el = e.currentTarget as HTMLImageElement;
        el.style.display = "none";
        const parent = el.parentElement;
        if (parent) {
          parent.innerHTML = `<div class="h-full w-full flex items-center justify-center bg-gradient-to-tr from-orange-500 to-rose-600 text-white font-bold text-sm">${name.charAt(0).toUpperCase()}</div>`;
        }
      }}
    />
  );
}

// ─── Usage Bar Color ──────────────────────────────────────────────────────────
function getUsageColor(pct: number): { bar: string; text: string; bg: string; border: string } {
  if (pct >= 80)  return { bar: "bg-rose-500",    text: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-500/5",    border: "border-rose-500/20" };
  if (pct >= 50)  return { bar: "bg-amber-400",   text: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-500/5",   border: "border-amber-500/20" };
  return          { bar: "bg-emerald-500",          text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20" };
}

// ─── Credit Account Type Badge ────────────────────────────────────────────────
function CreditTypeBadge({ type }: { type: "paylater" | "credit_card" }) {
  if (type === "credit_card") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
        <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 7a2 2 0 012-2h16a2 2 0 012 2v2H2V7zm0 4h20v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6zm4 3a1 1 0 000 2h4a1 1 0 000-2H6z"/>
        </svg>
        Kartu Kredit
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      PayLater
    </span>
  );
}

// ─── Main CreditAccountCard ───────────────────────────────────────────────────
interface CreditAccountCardProps {
  wallet: Wallet;
  onPayBill: (wallet: Wallet) => void;
  onAddExpense: (wallet: Wallet) => void;
  onEdit: (wallet: Wallet) => void;
}

export default function CreditAccountCard({
  wallet,
  onPayBill,
  onAddExpense,
  onEdit,
}: CreditAccountCardProps) {
  const [hovered, setHovered] = useState(false);

  const creditUsed      = getCreditUsed(wallet);
  const creditAvailable = getCreditAvailable(wallet);
  const usagePct        = getCreditUsagePercent(wallet);
  const colors          = getUsageColor(usagePct);
  const isAlmostFull    = usagePct >= 80;
  const hasLimit        = wallet.credit_limit > 0;

  return (
    <div
      className={`relative group rounded-2xl border transition-all duration-200 p-4 ${colors.bg} ${colors.border} ${hovered ? "shadow-md" : "shadow-sm"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Header: Logo + Name + Type Badge ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-border/80 bg-background/60 shadow-sm">
            <AccountLogo name={wallet.name} />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-foreground block truncate leading-tight">
              {wallet.name}
            </span>
            <div className="mt-0.5">
              <CreditTypeBadge type={wallet.account_type as "paylater" | "credit_card"} />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(wallet)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            title="Edit akun kredit"
            aria-label={`Edit ${wallet.name}`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Warning badge ── */}
      {isAlmostFull && (
        <div className="mb-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-in fade-in slide-in-from-top-1">
          <svg className="h-3.5 w-3.5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Hampir Penuh — {usagePct}% digunakan</span>
        </div>
      )}

      {/* ── Tagihan Berjalan ── */}
      <div className="mb-3">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Tagihan Berjalan
          </span>
          {!isAlmostFull && hasLimit && (
            <span className={`text-[10px] font-bold ${colors.text}`}>{usagePct}%</span>
          )}
        </div>

        {/* Amount display */}
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className={`text-base font-extrabold tabular-nums ${creditUsed > 0 ? colors.text : "text-foreground"}`}>
            {formatIDR(creditUsed)}
          </span>
          {hasLimit && (
            <>
              <span className="text-[10px] text-muted-foreground font-medium">/</span>
              <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                {formatIDR(wallet.credit_limit)}
              </span>
            </>
          )}
        </div>

        {/* Progress bar */}
        {hasLimit && (
          <div className="relative h-2 w-full rounded-full bg-muted/60 overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${colors.bar}`}
              style={{ width: `${Math.max(2, usagePct)}%` }}
            />
          </div>
        )}

        {hasLimit && (
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-muted-foreground">
              Tersisa: <span className="font-semibold text-foreground">{formatIDR(creditAvailable)}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Billing & Due Date ── */}
      {(wallet.billing_date || wallet.due_date) && (
        <div className="flex items-center gap-3 mb-3 pt-2.5 border-t border-border/40 flex-wrap">
          {wallet.billing_date && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                Tagihan:{" "}
                <span className="font-bold text-foreground">
                  {getCreditDateLabel(wallet.billing_date, wallet.billing_month_offset ?? 0)}
                </span>
              </span>
            </div>
          )}
          {wallet.due_date && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <svg className="h-3 w-3 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Jatuh tempo:{" "}
                <span className="font-bold text-rose-500 dark:text-rose-400">
                  {getCreditDateLabel(wallet.due_date, wallet.due_month_offset ?? 0)}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="flex gap-2 pt-1">
        {/* Bayar Tagihan */}
        <button
          onClick={() => onPayBill(wallet)}
          className="flex-1 h-9 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-700/20 transition-all active:scale-95"
          aria-label={`Bayar tagihan ${wallet.name}`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Bayar Tagihan
        </button>

        {/* Catat Pengeluaran */}
        <button
          onClick={() => onAddExpense(wallet)}
          className="flex-1 h-9 rounded-xl bg-muted hover:bg-muted/80 border border-border/60 text-foreground text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
          aria-label={`Catat pengeluaran ${wallet.name}`}
        >
          <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Catat Belanja
        </button>
      </div>
    </div>
  );
}
