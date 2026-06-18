import { useState, useMemo, useCallback, useEffect } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { supabase, isConfigured } from "@/lib/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────
export type AssetType = "Gold" | "Stocks" | "Crypto" | "Mutual_Funds";

export interface AssetRow {
  id: string;
  asset_name: string;
  asset_type: AssetType;
  total_units: number;       // Stocks = lots; Gold = grams; Crypto = coins; MF = units
  average_buy_price: number; // Stocks = per lembar/share; others = per unit
  current_value: number;     // total market value today
  updated_at: string;
}

// ─── Asset Type Config ─────────────────────────────────────────────────────────
// Each asset type has its own unit semantic and calculation rules.
interface AssetConfig {
  label: string;             // Display name
  emoji: string;
  unitLabel: string;         // "lot", "gram", "koin", "unit"
  priceLabel: string;        // What average_buy_price means
  /** How many base shares/units one "user unit" represents.
   *  Stocks: 1 lot = 100 lembar  →  lotSize = 100
   *  All others: lotSize = 1                              */
  lotSize: number;
  /** Max decimal places allowed for total_units input */
  unitDecimals: number;
  unitStep: string;          // HTML input step attribute
  colors: { bg: string; text: string; border: string };
  donutColor: string;
  hint: string;              // Shown as helper text in the form
}

export const ASSET_CONFIG: Record<AssetType, AssetConfig> = {
  Stocks: {
    label: "Saham",
    emoji: "📈",
    unitLabel: "lot",
    priceLabel: "Harga per Lembar (IDR)",
    lotSize: 100,            // 1 lot IDX = 100 lembar saham
    unitDecimals: 0,
    unitStep: "1",
    colors: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-500/20" },
    donutColor: "#3b82f6",
    hint: "Input dalam LOT. 1 lot IDX = 100 lembar saham. Harga beli = harga per lembar.",
  },
  Crypto: {
    label: "Kripto",
    emoji: "🪙",
    unitLabel: "koin",
    priceLabel: "Harga per Koin (IDR)",
    lotSize: 1,
    unitDecimals: 8,
    unitStep: "0.00000001",
    colors: { bg: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-400", border: "border-violet-500/20" },
    donutColor: "#8b5cf6",
    hint: "Input jumlah koin bebas desimal (maks 8 desimal). Contoh: 0.25 BTC.",
  },
  Gold: {
    label: "Emas",
    emoji: "🥇",
    unitLabel: "gram",
    priceLabel: "Harga per Gram (IDR)",
    lotSize: 1,
    unitDecimals: 2,
    unitStep: "0.01",
    colors: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-500/20" },
    donutColor: "#f59e0b",
    hint: "Input jumlah gram emas yang dimiliki. Harga beli = harga per gram.",
  },
  Mutual_Funds: {
    label: "Reksa Dana",
    emoji: "📊",
    unitLabel: "unit",
    priceLabel: "NAV per Unit (IDR)",
    lotSize: 1,
    unitDecimals: 2,
    unitStep: "0.01",
    colors: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-500/20" },
    donutColor: "#10b981",
    hint: "Input jumlah unit reksa dana. Harga beli = NAV per unit saat pembelian.",
  },
};

// ─── Business Logic Helpers ────────────────────────────────────────────────────

/** Total invested capital, accounting for lot size (Stocks: lots × 100 × price/lembar) */
export function getTotalInvested(asset: AssetRow): number {
  const cfg = ASSET_CONFIG[asset.asset_type];
  return asset.total_units * cfg.lotSize * asset.average_buy_price;
}

/** Current price per base unit (share for stocks, gram for gold, etc.) */
export function getCurrentPricePerUnit(asset: AssetRow): number {
  const baseUnits = asset.total_units * ASSET_CONFIG[asset.asset_type].lotSize;
  return baseUnits > 0 ? asset.current_value / baseUnits : 0;
}

/** Floating P&L */
export function getPnL(asset: AssetRow): number {
  return asset.current_value - getTotalInvested(asset);
}

/** Floating P&L % */
export function getPnLPct(asset: AssetRow): number {
  const inv = getTotalInvested(asset);
  return inv > 0 ? (getPnL(asset) / inv) * 100 : 0;
}

// ─── Formatters ────────────────────────────────────────────────────────────────
function formatIDR(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(2)}jt`;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatIDRFull(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

/** Format units with appropriate decimals + label for an asset type */
function formatUnitsDisplay(n: number, type: AssetType): string {
  const cfg = ASSET_CONFIG[type];
  const formatted = n.toLocaleString("id-ID", {
    maximumFractionDigits: cfg.unitDecimals,
    minimumFractionDigits: 0,
  });
  return `${formatted} ${cfg.unitLabel}`;
}

/** For Stocks, also show equivalent lembar count */
function formatUnitsDetail(asset: AssetRow): string {
  const cfg = ASSET_CONFIG[asset.asset_type];
  const base = formatUnitsDisplay(asset.total_units, asset.asset_type);
  if (asset.asset_type === "Stocks") {
    const lembar = asset.total_units * cfg.lotSize;
    return `${base} (${lembar.toLocaleString("id-ID")} lembar)`;
  }
  return base;
}

// ─── Schemas ───────────────────────────────────────────────────────────────────
const addAssetSchema = z.object({
  asset_name: z.string().min(1, "Nama aset tidak boleh kosong"),
  asset_type: z.enum(["Gold", "Stocks", "Crypto", "Mutual_Funds"]),
  total_units: z.number().positive("Jumlah unit harus lebih dari 0"),
  average_buy_price: z.number().positive("Harga beli harus lebih dari 0"),
  current_value: z.number().min(0, "Nilai pasar tidak boleh negatif"),
});

const updatePriceSchema = z.object({
  current_value: z.number().min(0, "Nilai pasar tidak boleh negatif"),
});

// ─── Donut SVG Chart ───────────────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; pct: number; color: string }[] }) {
  const size = 180;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const gapAngle = 2;
  const totalGap = segments.length * gapAngle;

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const dashLen = (seg.pct / 100) * (circumference - (totalGap / 360) * circumference);
    const el = { ...seg, dashLen, offset: circumference - cumulative };
    cumulative += dashLen + (gapAngle / 360) * circumference;
    return el;
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none" stroke={arc.color}
            strokeWidth={strokeWidth} strokeDasharray={`${arc.dashLen} ${circumference}`}
            strokeDashoffset={arc.offset} strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 0.5s ease" }} />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</span>
        <span className="text-sm font-extrabold text-foreground leading-tight">
          {formatIDR(segments.reduce((s, seg) => s + seg.value, 0))}
        </span>
      </div>
    </div>
  );
}

// ─── Type Badge ────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: AssetType }) {
  const { bg, text, border } = ASSET_CONFIG[type].colors;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${bg} ${text} ${border}`}>
      {ASSET_CONFIG[type].emoji} {ASSET_CONFIG[type].label}
    </span>
  );
}

// ─── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, isPositive, icon }: {
  label: string; value: string; sub?: string; isPositive?: boolean; icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-5 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="h-9 w-9 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-extrabold tracking-tight text-foreground leading-none">{value}</p>
        {sub && (
          <p className={`text-xs font-semibold mt-1.5 ${
            isPositive === undefined ? "text-muted-foreground"
              : isPositive ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-500 dark:text-rose-400"
          }`}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Form Field (module-level — never define inside a component) ───────────────
function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

// ─── Add Asset Dialog ──────────────────────────────────────────────────────────
function AddAssetDialog({ open, onClose, onSave }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: z.infer<typeof addAssetSchema>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    asset_name: "",
    asset_type: "Stocks" as AssetType,
    total_units: undefined as number | undefined,
    average_buy_price: undefined as number | undefined,
    current_price_per_unit: undefined as number | undefined, // price per lembar/gram/koin/unit
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const cfg = ASSET_CONFIG[form.asset_type];

  // Computed total invested capital (for preview)
  const autoInvested = useMemo(() => {
    if (form.total_units && form.average_buy_price)
      return form.total_units * cfg.lotSize * form.average_buy_price;
    return undefined;
  }, [form.total_units, form.average_buy_price, cfg.lotSize]);

  // Computed total current value from price-per-unit input
  const computedCurrentValue = useMemo(() => {
    if (form.total_units && form.current_price_per_unit)
      return form.total_units * cfg.lotSize * form.current_price_per_unit;
    return undefined;
  }, [form.total_units, form.current_price_per_unit, cfg.lotSize]);

  // Live P&L preview
  const previewPnL = autoInvested && computedCurrentValue
    ? computedCurrentValue - autoInvested : undefined;
  const previewPnLPct = autoInvested && previewPnL !== undefined && autoInvested > 0
    ? (previewPnL / autoInvested) * 100 : undefined;

  useEffect(() => {
    if (open) {
      setForm({ asset_name: "", asset_type: "Stocks", total_units: undefined, average_buy_price: undefined, current_price_per_unit: undefined });
      setErrors({});
    }
  }, [open]);

  function handleTypeChange(v: AssetType) {
    setForm((p) => ({ ...p, asset_type: v, total_units: undefined, average_buy_price: undefined, current_price_per_unit: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Compute actual current_value from price-per-unit × units × lotSize
    const computed_current_value = computedCurrentValue ?? 0;
    const result = addAssetSchema.safeParse({ ...form, current_value: computed_current_value });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await onSave(result.data);
      onClose();
    } catch { /* handled upstream */ }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-bold text-foreground">Tambah Aset Baru</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Tambahkan aset investasi ke portofolio Anda.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Asset Name */}
          <FormField label="Nama Aset" error={errors.asset_name}>
            <Input
              value={form.asset_name}
              onChange={(e) => setForm((p) => ({ ...p, asset_name: e.target.value }))}
              placeholder="Contoh: BBRI, Bitcoin (BTC), Antam 1 gram"
              className="rounded-xl border-border/80 bg-background h-10 text-sm"
            />
          </FormField>

          {/* Asset Type */}
          <FormField label="Jenis Aset" error={errors.asset_type}>
            <Select value={form.asset_type} onValueChange={(v) => handleTypeChange(v as AssetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ASSET_CONFIG) as AssetType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {ASSET_CONFIG[t].emoji} {ASSET_CONFIG[t].label} ({t})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Dynamic hint banner */}
            <div className={`flex items-start gap-2 px-3 py-2 rounded-xl text-[10px] leading-tight font-medium border ${cfg.colors.bg} ${cfg.colors.text} ${cfg.colors.border}`}>
              <span className="shrink-0 mt-0.5">ℹ️</span>
              <span>{cfg.hint}</span>
            </div>
          </FormField>

          {/* Units + Avg Buy Price */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label={`Jumlah (${cfg.unitLabel})`} error={errors.total_units}>
              <Input
                type="number"
                step={cfg.unitStep}
                min={cfg.unitDecimals === 0 ? 1 : 0}
                value={form.total_units ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, total_units: e.target.value === "" ? undefined : Number(e.target.value) }))}
                placeholder={form.asset_type === "Stocks" ? "15" : "0"}
                className="rounded-xl border-border/80 bg-background h-10 text-sm"
              />
              {form.asset_type === "Stocks" && form.total_units && form.total_units > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  = {(form.total_units * 100).toLocaleString("id-ID")} lembar saham
                </p>
              )}
            </FormField>

            <FormField label={cfg.priceLabel} error={errors.average_buy_price}>
              <CurrencyInput
                value={form.average_buy_price}
                onChange={(v) => setForm((p) => ({ ...p, average_buy_price: v }))}
                placeholder="Rp 0"
              />
              {form.asset_type === "Stocks" && (
                <p className="text-[10px] text-muted-foreground">Per lembar, bukan per lot</p>
              )}
            </FormField>
          </div>

          {/* Invested capital preview */}
          {autoInvested !== undefined && autoInvested > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs">
              <span className="text-muted-foreground font-medium">Modal awal:</span>
              <div className="text-right">
                <span className="font-extrabold text-foreground tabular-nums">{formatIDRFull(autoInvested)}</span>
                {form.asset_type === "Stocks" && (
                  <p className="text-[10px] text-muted-foreground">
                    {form.total_units} lot × 100 × {formatIDRFull(form.average_buy_price ?? 0)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Current price per base unit — always per-unit, total computed internally */}
          <FormField
            label={`Harga Pasar Saat Ini — per ${form.asset_type === "Stocks" ? "lembar" : cfg.unitLabel} (IDR)`}
            error={errors.current_value}
          >
            <CurrencyInput
              value={form.current_price_per_unit}
              onChange={(v) => setForm((p) => ({ ...p, current_price_per_unit: v }))}
              placeholder="Rp 0"
            />
            {/* Show computed total + live P&L preview */}
            {computedCurrentValue !== undefined && computedCurrentValue > 0 ? (
              <div className="space-y-1 mt-1">
                <p className="text-[10px] text-muted-foreground">
                  Total nilai pasar: <span className="font-bold text-foreground">{formatIDRFull(computedCurrentValue)}</span>
                  {form.asset_type === "Stocks" && (
                    <span className="ml-1">({form.total_units} lot × 100 × {formatIDRFull(form.current_price_per_unit ?? 0)})</span>
                  )}
                </p>
                {previewPnL !== undefined && previewPnLPct !== undefined && (
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${
                    previewPnL >= 0
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  }`}>
                    {previewPnL >= 0 ? "▲" : "▼"} P&L: {previewPnL >= 0 ? "+" : ""}{formatIDR(previewPnL)} ({previewPnL >= 0 ? "+" : ""}{previewPnLPct.toFixed(2)}%)
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Masukkan harga pasar per {form.asset_type === "Stocks" ? "lembar" : cfg.unitLabel} hari ini.
              </p>
            )}
          </FormField>

          <DialogFooter className="gap-2 pt-3 border-t border-border/40 flex-row justify-end bg-transparent border-0 p-0">
            <button type="button" onClick={onClose}
              className="px-5 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-sm font-semibold transition-all">
              Batal
            </button>
            <button type="submit" disabled={saving}
              className="px-6 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-sm font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 disabled:opacity-60">
              {saving ? "Menyimpan..." : "Tambah Aset"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Update Price Dialog ───────────────────────────────────────────────────────
function UpdatePriceDialog({ open, asset, onClose, onSave }: {
  open: boolean;
  asset: AssetRow | null;
  onClose: () => void;
  onSave: (id: string, currentValue: number) => Promise<void>;
}) {
  // pricePerUnit = current market price per base unit (per lembar, per gram, per koin, per unit)
  const [pricePerUnit, setPricePerUnit] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cfg = asset ? ASSET_CONFIG[asset.asset_type] : null;
  const baseUnitsPerHolding = asset ? asset.total_units * (cfg?.lotSize ?? 1) : 1;

  // Seed the input with the implied current price per unit from existing data
  useEffect(() => {
    if (open && asset && cfg) {
      const implied = baseUnitsPerHolding > 0 ? asset.current_value / baseUnitsPerHolding : undefined;
      setPricePerUnit(implied ?? undefined);
      setError(null);
    }
  }, [open, asset]);

  // Compute total market value from entered price-per-unit
  const computedTotal = pricePerUnit && asset ? pricePerUnit * baseUnitsPerHolding : undefined;

  const invested = asset ? getTotalInvested(asset) : 0;
  const pnl = (computedTotal ?? 0) - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pricePerUnit || pricePerUnit <= 0) { setError("Harga pasar harus lebih dari 0"); return; }
    const totalValue = pricePerUnit * baseUnitsPerHolding;
    const result = updatePriceSchema.safeParse({ current_value: totalValue });
    if (!result.success) { setError(result.error.issues[0].message); return; }
    setSaving(true);
    try {
      await onSave(asset!.id, result.data.current_value);
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui harga");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-bold text-foreground">Update Harga Pasar</DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground font-medium truncate">{asset?.asset_name}</span>
            {asset && <TypeBadge type={asset.asset_type} />}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Current holding summary */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-muted/30 border border-border/40">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {cfg?.unitLabel === "lot" ? "Kepemilikan" : "Jumlah"}
              </p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {asset ? formatUnitsDisplay(asset.total_units, asset.asset_type) : "—"}
              </p>
              {asset?.asset_type === "Stocks" && asset.total_units > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {(asset.total_units * 100).toLocaleString("id-ID")} lembar
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Harga Beli Avg</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{formatIDRFull(asset?.average_buy_price ?? 0)}</p>
              <p className="text-[10px] text-muted-foreground">per {cfg?.unitLabel === "lot" ? "lembar" : cfg?.unitLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Modal Awal</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{asset ? formatIDR(getTotalInvested(asset)) : "—"}</p>
            </div>
          </div>

          {/* Current price per base unit */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Harga Pasar per {asset?.asset_type === "Stocks" ? "Lembar" : cfg?.unitLabel} Saat Ini (IDR)
            </Label>
            <CurrencyInput value={pricePerUnit} onChange={setPricePerUnit} placeholder="Rp 0" />
            {/* Show computed total market value */}
            {computedTotal !== undefined && computedTotal > 0 && (
              <p className="text-[10px] text-muted-foreground">
                Total nilai pasar:{" "}
                <span className="font-bold text-foreground">{formatIDRFull(computedTotal)}</span>
                {asset?.asset_type === "Stocks" && (
                  <span className="ml-1">
                    ({asset.total_units} lot × 100 × {formatIDRFull(pricePerUnit ?? 0)})
                  </span>
                )}
              </p>
            )}
          </div>

          {/* P&L Preview */}
          {computedTotal !== undefined && computedTotal > 0 && (
            <div className={`flex items-center justify-between p-3 rounded-2xl border ${
              pnl >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"
            }`}>
              <span className="text-xs font-bold text-muted-foreground">Estimasi P&L</span>
              <div className="text-right">
                <p className={`text-sm font-extrabold ${pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                  {pnl >= 0 ? "+" : ""}{formatIDRFull(pnl)}
                </p>
                <p className={`text-[10px] font-semibold ${pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                  {formatPct(pnlPct)}
                </p>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          <DialogFooter className="gap-2 pt-3 border-t border-border/40 flex-row justify-end bg-transparent border-0 p-0">
            <button type="button" onClick={onClose}
              className="px-5 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-sm font-semibold transition-all">
              Batal
            </button>
            <button type="submit" disabled={saving}
              className="px-6 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-sm font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 disabled:opacity-60">
              {saving ? "Menyimpan..." : "Update Harga"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main PortfolioManager ─────────────────────────────────────────────────────
interface PortfolioManagerProps {
  initialAssets: AssetRow[];
}

export default function PortfolioManager({ initialAssets }: PortfolioManagerProps) {
  const [assets, setAssets] = useState<AssetRow[]>(initialAssets);
  const [addOpen, setAddOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<AssetRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filterType, setFilterType] = useState<AssetType | "All">("All");

  // ── Aggregates (using getTotalInvested with lot-aware logic) ──────────────
  const totalPortfolioValue = useMemo(() => assets.reduce((s, a) => s + a.current_value, 0), [assets]);
  const totalInvestedCapital = useMemo(() => assets.reduce((s, a) => s + getTotalInvested(a), 0), [assets]);
  const totalPnL = totalPortfolioValue - totalInvestedCapital;
  const totalPnLPct = totalInvestedCapital > 0 ? (totalPnL / totalInvestedCapital) * 100 : 0;
  const isPositive = totalPnL >= 0;

  // ── Donut segments ────────────────────────────────────────────────────────
  const donutSegments = useMemo(() => {
    const byType: Partial<Record<AssetType, number>> = {};
    assets.forEach((a) => { byType[a.asset_type] = (byType[a.asset_type] ?? 0) + a.current_value; });
    return Object.entries(byType).map(([type, value]) => ({
      label: ASSET_CONFIG[type as AssetType].label,
      value: value as number,
      pct: totalPortfolioValue > 0 ? ((value as number) / totalPortfolioValue) * 100 : 0,
      color: ASSET_CONFIG[type as AssetType].donutColor,
    })).sort((a, b) => b.value - a.value);
  }, [assets, totalPortfolioValue]);

  // ── Filtered ──────────────────────────────────────────────────────────────
  const filteredAssets = useMemo(() =>
    filterType === "All" ? assets : assets.filter((a) => a.asset_type === filterType),
    [assets, filterType]
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  function toast(msg: string, type: "success" | "error" = "success") {
    window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: msg, type } }));
  }

  const handleAddAsset = useCallback(async (data: z.infer<typeof addAssetSchema>) => {
    if (isConfigured && supabase) {
      const { data: inserted, error } = await supabase
        .from("assets_portfolio").insert(data).select().single();
      if (error) { toast(`Gagal menambahkan aset: ${error.message}`, "error"); throw error; }
      setAssets((prev) => [inserted as AssetRow, ...prev]);
    } else {
      setAssets((prev) => [{
        id: "ap_" + Math.random().toString(36).substr(2, 9),
        ...data, updated_at: new Date().toISOString(),
      }, ...prev]);
    }
    const cfg = ASSET_CONFIG[data.asset_type];
    const unitsStr = formatUnitsDisplay(data.total_units, data.asset_type);
    toast(`Aset "${data.asset_name}" (${unitsStr}) berhasil ditambahkan`);
  }, []);

  const handleUpdatePrice = useCallback(async (id: string, currentValue: number) => {
    if (isConfigured && supabase) {
      const { error } = await supabase.from("assets_portfolio")
        .update({ current_value: currentValue, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) { toast(`Gagal update harga: ${error.message}`, "error"); throw error; }
    }
    setAssets((prev) => prev.map((a) =>
      a.id === id ? { ...a, current_value: currentValue, updated_at: new Date().toISOString() } : a
    ));
    const name = assets.find((a) => a.id === id)?.asset_name ?? "Aset";
    toast(`Harga pasar "${name}" berhasil diperbarui`);
  }, [assets]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (isConfigured && supabase) {
        const { error } = await supabase.from("assets_portfolio").delete().eq("id", deleteTarget.id);
        if (error) { toast(`Gagal hapus aset: ${error.message}`, "error"); return; }
      }
      setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      toast(`Aset "${deleteTarget.asset_name}" berhasil dihapus`);
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  }, [deleteTarget]);

  return (
    <div className="p-4 md:p-6 space-y-6 w-full max-w-6xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Asset Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pantau dan kelola seluruh aset investasi Anda dalam satu halaman.
          </p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold border mt-1 ${
          isConfigured
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          {isConfigured ? "Live — Supabase" : "Demo Mode"}
        </span>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Portfolio Value"
          value={formatIDR(totalPortfolioValue)}
          sub={`${assets.length} aset aktif`}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>}
        />
        <MetricCard
          label="Total Modal Awal"
          value={formatIDR(totalInvestedCapital)}
          sub="Sudah memperhitungkan lot size"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <MetricCard
          label="Total Floating P&L"
          value={`${isPositive ? "+" : ""}${formatIDR(totalPnL)}`}
          sub={formatPct(totalPnLPct)}
          isPositive={isPositive}
          icon={
            isPositive
              ? <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
              : <svg className="h-5 w-5 text-rose-500 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
          }
        />
      </div>

      {/* ── Donut + Legend ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start gap-5 p-5 bg-card border border-border/80 rounded-3xl shadow-sm">
        <div className="flex-none flex flex-col items-center gap-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B5C58] dark:text-teal-400 self-start">Alokasi Aset</h4>
          <p className="text-[11px] text-muted-foreground self-start mb-3">Distribusi berdasarkan nilai pasar</p>
          {donutSegments.length > 0
            ? <DonutChart segments={donutSegments} />
            : <div className="h-[180px] w-[180px] rounded-full bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">Tidak ada data</div>
          }
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-0 md:pt-8">
          {donutSegments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <div>
                  <p className="text-xs font-bold text-foreground">{seg.label}</p>
                  <p className="text-[10px] text-muted-foreground">{seg.pct.toFixed(1)}% dari portofolio</p>
                </div>
              </div>
              <p className="text-xs font-extrabold text-foreground tabular-nums">{formatIDR(seg.value)}</p>
            </div>
          ))}
          {donutSegments.length === 0 && (
            <div className="col-span-2 text-xs text-muted-foreground text-center py-4">Belum ada aset terdaftar</div>
          )}
        </div>
      </div>

      {/* ── Asset Table ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground">Daftar Aset</h3>
            <p className="text-xs text-muted-foreground">
              {filteredAssets.length} aset{filterType !== "All" ? ` · ${ASSET_CONFIG[filterType as AssetType].label}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Chips */}
            {(["All", "Stocks", "Crypto", "Gold", "Mutual_Funds"] as const).map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`h-8 px-3 rounded-xl text-[11px] font-bold border transition-all ${
                  filterType === t
                    ? "bg-[#1B5C58] dark:bg-[#2F7E79] text-white border-transparent shadow-sm"
                    : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                }`}>
                {t === "All" ? "Semua" : ASSET_CONFIG[t].label}
              </button>
            ))}
            {/* Add Asset Button */}
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-xs font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 whitespace-nowrap">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              + Tambah Aset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  <th className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-5 pr-3 py-3.5 text-left whitespace-nowrap">Aset</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-left hidden sm:table-cell whitespace-nowrap">Tipe</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-right hidden md:table-cell whitespace-nowrap">Kepemilikan</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-right hidden lg:table-cell whitespace-nowrap">Harga Beli Avg</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-right hidden lg:table-cell whitespace-nowrap">Modal Awal</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-right whitespace-nowrap">Nilai Pasar</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-right whitespace-nowrap">P&L</th>
                  <th className="w-[90px] pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                          <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">Belum ada aset terdaftar</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Klik "+ Tambah Aset" untuk mulai</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const invested = getTotalInvested(asset);
                    const pnl = getPnL(asset);
                    const pnlPct = getPnLPct(asset);
                    const positive = pnl >= 0;
                    const cfg = ASSET_CONFIG[asset.asset_type];

                    return (
                      <tr key={asset.id} className="border-b border-border/30 last:border-0 hover:bg-muted/25 transition-colors group">
                        {/* Asset Name */}
                        <td className="pl-5 pr-3 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${cfg.colors.bg} ${cfg.colors.text}`}>
                              {cfg.emoji}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-foreground truncate max-w-[130px]">{asset.asset_name}</p>
                              <p className="text-[10px] text-muted-foreground sm:hidden">{cfg.label}</p>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-3 py-3.5 hidden sm:table-cell">
                          <TypeBadge type={asset.asset_type} />
                        </td>

                        {/* Units — context-aware display */}
                        <td className="px-3 py-3.5 text-right hidden md:table-cell">
                          <div>
                            <p className="text-xs font-semibold text-foreground tabular-nums">
                              {formatUnitsDisplay(asset.total_units, asset.asset_type)}
                            </p>
                            {asset.asset_type === "Stocks" && (
                              <p className="text-[10px] text-muted-foreground tabular-nums">
                                {(asset.total_units * 100).toLocaleString("id-ID")} lembar
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Avg Buy Price — per lembar for stocks, per unit for others */}
                        <td className="px-3 py-3.5 text-right hidden lg:table-cell">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground tabular-nums">{formatIDRFull(asset.average_buy_price)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              /{asset.asset_type === "Stocks" ? "lembar" : cfg.unitLabel}
                            </p>
                          </div>
                        </td>

                        {/* Total Invested Capital (lot-aware) */}
                        <td className="px-3 py-3.5 text-right hidden lg:table-cell">
                          <p className="text-xs font-semibold text-muted-foreground tabular-nums">{formatIDR(invested)}</p>
                          {asset.asset_type === "Stocks" && (
                            <p className="text-[10px] text-muted-foreground">
                              {asset.total_units}×100×{formatIDRFull(asset.average_buy_price).replace("Rp\u00a0", "Rp")}
                            </p>
                          )}
                        </td>

                        {/* Current Value */}
                        <td className="px-3 py-3.5 text-right">
                          <div>
                            <p className="font-bold text-sm text-foreground tabular-nums">{formatIDR(asset.current_value)}</p>
                            <p className="text-[10px] text-muted-foreground tabular-nums">
                              {formatIDRFull(getCurrentPricePerUnit(asset))}/{asset.asset_type === "Stocks" ? "lembar" : cfg.unitLabel}
                            </p>
                          </div>
                        </td>

                        {/* P&L */}
                        <td className="px-3 py-3.5 text-right">
                          <p className={`font-bold text-sm tabular-nums ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                            {positive ? "+" : ""}{formatIDR(pnl)}
                          </p>
                          <p className={`text-[10px] font-semibold ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                            {formatPct(pnlPct)}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="pr-4 py-3.5">
                          <div className="flex items-center gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setUpdateTarget(asset)}
                              className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border/60 bg-background text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all whitespace-nowrap"
                              title="Update harga pasar">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Update
                            </button>
                            <button
                              onClick={() => setDeleteTarget(asset)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                              title="Hapus aset">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          {filteredAssets.length > 0 && (
            <div className="px-5 py-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground bg-muted/10">
              <div className="flex items-center gap-4">
                <span>Nilai Pasar: <span className="font-bold text-foreground tabular-nums">{formatIDRFull(filteredAssets.reduce((s, a) => s + a.current_value, 0))}</span></span>
                <span>Modal: <span className="font-bold text-foreground tabular-nums">{formatIDRFull(filteredAssets.reduce((s, a) => s + getTotalInvested(a), 0))}</span></span>
              </div>
              <span className={`font-bold tabular-nums ${
                filteredAssets.reduce((s, a) => s + getPnL(a), 0) >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-500 dark:text-rose-400"
              }`}>
                P&L: {formatIDRFull(filteredAssets.reduce((s, a) => s + getPnL(a), 0))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <AddAssetDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAddAsset} />
      <UpdatePriceDialog open={!!updateTarget} asset={updateTarget} onClose={() => setUpdateTarget(null)} onSave={handleUpdatePrice} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border border-border/80 rounded-3xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Hapus Aset?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Aset <span className="font-semibold text-foreground">"{deleteTarget?.asset_name}"</span> akan dihapus secara permanen dari portofolio Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl h-10 text-sm bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 hover:text-foreground">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}
              className="rounded-xl h-10 text-sm bg-rose-500 hover:bg-rose-600 text-white font-semibold disabled:opacity-60">
              {deleting ? "Menghapus..." : "Ya, Hapus Aset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
