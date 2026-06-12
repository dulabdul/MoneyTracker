import { c as createComponent } from './astro-component_BZpYguPY.mjs';
import 'piccolore';
import { o as renderComponent, k as renderTemplate } from './entrypoint_CEi4kyBi.mjs';
import { i as isConfigured, s as supabase, $ as $$Layout } from './Layout_BthChk5b.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, S as Select, k as SelectTrigger, l as SelectValue, m as SelectContent, n as SelectItem, C as CurrencyInput, o as DialogFooter, L as Label } from './CurrencyInput_CMt_8Wns.mjs';
import { I as Input } from './input_CRWT8b1J.mjs';

const ASSET_CONFIG = {
  Stocks: {
    label: "Saham",
    emoji: "📈",
    unitLabel: "lot",
    priceLabel: "Harga per Lembar (IDR)",
    lotSize: 100,
    // 1 lot IDX = 100 lembar saham
    unitDecimals: 0,
    unitStep: "1",
    colors: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-500/20" },
    donutColor: "#3b82f6",
    hint: "Input dalam LOT. 1 lot IDX = 100 lembar saham. Harga beli = harga per lembar."
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
    hint: "Input jumlah koin bebas desimal (maks 8 desimal). Contoh: 0.25 BTC."
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
    hint: "Input jumlah gram emas yang dimiliki. Harga beli = harga per gram."
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
    hint: "Input jumlah unit reksa dana. Harga beli = NAV per unit saat pembelian."
  }
};
function getTotalInvested(asset) {
  const cfg = ASSET_CONFIG[asset.asset_type];
  return asset.total_units * cfg.lotSize * asset.average_buy_price;
}
function getCurrentPricePerUnit(asset) {
  const baseUnits = asset.total_units * ASSET_CONFIG[asset.asset_type].lotSize;
  return baseUnits > 0 ? asset.current_value / baseUnits : 0;
}
function getPnL(asset) {
  return asset.current_value - getTotalInvested(asset);
}
function getPnLPct(asset) {
  const inv = getTotalInvested(asset);
  return inv > 0 ? getPnL(asset) / inv * 100 : 0;
}
function formatIDR(n) {
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(2)}M`;
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(2)}jt`;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);
}
function formatIDRFull(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);
}
function formatPct(n) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}
function formatUnitsDisplay(n, type) {
  const cfg = ASSET_CONFIG[type];
  const formatted = n.toLocaleString("id-ID", {
    maximumFractionDigits: cfg.unitDecimals,
    minimumFractionDigits: 0
  });
  return `${formatted} ${cfg.unitLabel}`;
}
const addAssetSchema = z.object({
  asset_name: z.string().min(1, "Nama aset tidak boleh kosong"),
  asset_type: z.enum(["Gold", "Stocks", "Crypto", "Mutual_Funds"]),
  total_units: z.number().positive("Jumlah unit harus lebih dari 0"),
  average_buy_price: z.number().positive("Harga beli harus lebih dari 0"),
  current_value: z.number().min(0, "Nilai pasar tidak boleh negatif")
});
const updatePriceSchema = z.object({
  current_value: z.number().min(0, "Nilai pasar tidak boleh negatif")
});
function DonutChart({ segments }) {
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
    const dashLen = seg.pct / 100 * (circumference - totalGap / 360 * circumference);
    const el = { ...seg, dashLen, offset: circumference - cumulative };
    cumulative += dashLen + gapAngle / 360 * circumference;
    return el;
  });
  return /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-center", children: [
    /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, className: "-rotate-90", children: [
      /* @__PURE__ */ jsx("circle", { cx, cy, r: radius, fill: "none", stroke: "currentColor", strokeWidth, className: "text-muted/30" }),
      arcs.map((arc, i) => /* @__PURE__ */ jsx(
        "circle",
        {
          cx,
          cy,
          r: radius,
          fill: "none",
          stroke: arc.color,
          strokeWidth,
          strokeDasharray: `${arc.dashLen} ${circumference}`,
          strokeDashoffset: arc.offset,
          strokeLinecap: "butt",
          style: { transition: "stroke-dasharray 0.5s ease" }
        },
        i
      ))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
      /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Total" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-extrabold text-foreground leading-tight", children: formatIDR(segments.reduce((s, seg) => s + seg.value, 0)) })
    ] })
  ] });
}
function TypeBadge({ type }) {
  const { bg, text, border } = ASSET_CONFIG[type].colors;
  return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${bg} ${text} ${border}`, children: [
    ASSET_CONFIG[type].emoji,
    " ",
    ASSET_CONFIG[type].label
  ] });
}
function MetricCard({ label, value, sub, isPositive, icon }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-5 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all group", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors", children: icon })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-2xl font-extrabold tracking-tight text-foreground leading-none", children: value }),
      sub && /* @__PURE__ */ jsx("p", { className: `text-xs font-semibold mt-1.5 ${isPositive === void 0 ? "text-muted-foreground" : isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`, children: sub })
    ] })
  ] });
}
function FormField({ label, error, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsx(Label, { className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground", children: label }),
    children,
    error && /* @__PURE__ */ jsx("p", { className: "text-xs text-rose-500 font-medium", children: error })
  ] });
}
function AddAssetDialog({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    asset_name: "",
    asset_type: "Stocks",
    total_units: void 0,
    average_buy_price: void 0,
    current_price_per_unit: void 0
    // price per lembar/gram/koin/unit
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const cfg = ASSET_CONFIG[form.asset_type];
  const autoInvested = useMemo(() => {
    if (form.total_units && form.average_buy_price)
      return form.total_units * cfg.lotSize * form.average_buy_price;
    return void 0;
  }, [form.total_units, form.average_buy_price, cfg.lotSize]);
  const computedCurrentValue = useMemo(() => {
    if (form.total_units && form.current_price_per_unit)
      return form.total_units * cfg.lotSize * form.current_price_per_unit;
    return void 0;
  }, [form.total_units, form.current_price_per_unit, cfg.lotSize]);
  const previewPnL = autoInvested && computedCurrentValue ? computedCurrentValue - autoInvested : void 0;
  const previewPnLPct = autoInvested && previewPnL !== void 0 && autoInvested > 0 ? previewPnL / autoInvested * 100 : void 0;
  useEffect(() => {
    if (open) {
      setForm({ asset_name: "", asset_type: "Stocks", total_units: void 0, average_buy_price: void 0, current_price_per_unit: void 0 });
      setErrors({});
    }
  }, [open]);
  function handleTypeChange(v) {
    setForm((p) => ({ ...p, asset_type: v, total_units: void 0, average_buy_price: void 0, current_price_per_unit: void 0 }));
  }
  async function handleSubmit(e) {
    e.preventDefault();
    const computed_current_value = computedCurrentValue ?? 0;
    const result = addAssetSchema.safeParse({ ...form, current_value: computed_current_value });
    if (!result.success) {
      const errs = {};
      result.error.issues.forEach((i) => {
        errs[i.path[0]] = i.message;
      });
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await onSave(result.data);
      onClose();
    } catch {
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[520px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden", showCloseButton: false, children: [
    /* @__PURE__ */ jsxs(DialogHeader, { className: "px-6 pt-6 pb-4 border-b border-border/40", children: [
      /* @__PURE__ */ jsx(DialogTitle, { className: "text-base font-bold text-foreground", children: "Tambah Aset Baru" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Tambahkan aset investasi ke portofolio Anda." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "px-6 py-5 space-y-4", children: [
      /* @__PURE__ */ jsx(FormField, { label: "Nama Aset", error: errors.asset_name, children: /* @__PURE__ */ jsx(
        Input,
        {
          value: form.asset_name,
          onChange: (e) => setForm((p) => ({ ...p, asset_name: e.target.value })),
          placeholder: "Contoh: BBRI, Bitcoin (BTC), Antam 1 gram",
          className: "rounded-xl border-border/80 bg-background h-10 text-sm"
        }
      ) }),
      /* @__PURE__ */ jsxs(FormField, { label: "Jenis Aset", error: errors.asset_type, children: [
        /* @__PURE__ */ jsxs(Select, { value: form.asset_type, onValueChange: (v) => handleTypeChange(v), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: Object.keys(ASSET_CONFIG).map((t) => /* @__PURE__ */ jsxs(SelectItem, { value: t, children: [
            ASSET_CONFIG[t].emoji,
            " ",
            ASSET_CONFIG[t].label,
            " (",
            t,
            ")"
          ] }, t)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `flex items-start gap-2 px-3 py-2 rounded-xl text-[10px] leading-tight font-medium border ${cfg.colors.bg} ${cfg.colors.text} ${cfg.colors.border}`, children: [
          /* @__PURE__ */ jsx("span", { className: "shrink-0 mt-0.5", children: "ℹ️" }),
          /* @__PURE__ */ jsx("span", { children: cfg.hint })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs(FormField, { label: `Jumlah (${cfg.unitLabel})`, error: errors.total_units, children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              step: cfg.unitStep,
              min: cfg.unitDecimals === 0 ? 1 : 0,
              value: form.total_units ?? "",
              onChange: (e) => setForm((p) => ({ ...p, total_units: e.target.value === "" ? void 0 : Number(e.target.value) })),
              placeholder: form.asset_type === "Stocks" ? "15" : "0",
              className: "rounded-xl border-border/80 bg-background h-10 text-sm"
            }
          ),
          form.asset_type === "Stocks" && form.total_units && form.total_units > 0 && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
            "= ",
            (form.total_units * 100).toLocaleString("id-ID"),
            " lembar saham"
          ] })
        ] }),
        /* @__PURE__ */ jsxs(FormField, { label: cfg.priceLabel, error: errors.average_buy_price, children: [
          /* @__PURE__ */ jsx(
            CurrencyInput,
            {
              value: form.average_buy_price,
              onChange: (v) => setForm((p) => ({ ...p, average_buy_price: v })),
              placeholder: "Rp 0"
            }
          ),
          form.asset_type === "Stocks" && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: "Per lembar, bukan per lot" })
        ] })
      ] }),
      autoInvested !== void 0 && autoInvested > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-medium", children: "Modal awal:" }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("span", { className: "font-extrabold text-foreground tabular-nums", children: formatIDRFull(autoInvested) }),
          form.asset_type === "Stocks" && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
            form.total_units,
            " lot × 100 × ",
            formatIDRFull(form.average_buy_price ?? 0)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        FormField,
        {
          label: `Harga Pasar Saat Ini — per ${form.asset_type === "Stocks" ? "lembar" : cfg.unitLabel} (IDR)`,
          error: errors.current_value,
          children: [
            /* @__PURE__ */ jsx(
              CurrencyInput,
              {
                value: form.current_price_per_unit,
                onChange: (v) => setForm((p) => ({ ...p, current_price_per_unit: v })),
                placeholder: "Rp 0"
              }
            ),
            computedCurrentValue !== void 0 && computedCurrentValue > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-1 mt-1", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
                "Total nilai pasar: ",
                /* @__PURE__ */ jsx("span", { className: "font-bold text-foreground", children: formatIDRFull(computedCurrentValue) }),
                form.asset_type === "Stocks" && /* @__PURE__ */ jsxs("span", { className: "ml-1", children: [
                  "(",
                  form.total_units,
                  " lot × 100 × ",
                  formatIDRFull(form.current_price_per_unit ?? 0),
                  ")"
                ] })
              ] }),
              previewPnL !== void 0 && previewPnLPct !== void 0 && /* @__PURE__ */ jsxs("div", { className: `inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${previewPnL >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"}`, children: [
                previewPnL >= 0 ? "▲" : "▼",
                " P&L: ",
                previewPnL >= 0 ? "+" : "",
                formatIDR(previewPnL),
                " (",
                previewPnL >= 0 ? "+" : "",
                previewPnLPct.toFixed(2),
                "%)"
              ] })
            ] }) : /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
              "Masukkan harga pasar per ",
              form.asset_type === "Stocks" ? "lembar" : cfg.unitLabel,
              " hari ini."
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 pt-3 border-t border-border/40 flex-row justify-end bg-transparent border-0 p-0", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: "px-5 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-sm font-semibold transition-all",
            children: "Batal"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: saving,
            className: "px-6 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-sm font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 disabled:opacity-60",
            children: saving ? "Menyimpan..." : "Tambah Aset"
          }
        )
      ] })
    ] })
  ] }) });
}
function UpdatePriceDialog({ open, asset, onClose, onSave }) {
  const [pricePerUnit, setPricePerUnit] = useState(void 0);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const cfg = asset ? ASSET_CONFIG[asset.asset_type] : null;
  const baseUnitsPerHolding = asset ? asset.total_units * (cfg?.lotSize ?? 1) : 1;
  useEffect(() => {
    if (open && asset && cfg) {
      const implied = baseUnitsPerHolding > 0 ? asset.current_value / baseUnitsPerHolding : void 0;
      setPricePerUnit(implied ?? void 0);
      setError(null);
    }
  }, [open, asset]);
  const computedTotal = pricePerUnit && asset ? pricePerUnit * baseUnitsPerHolding : void 0;
  const invested = asset ? getTotalInvested(asset) : 0;
  const pnl = (computedTotal ?? 0) - invested;
  const pnlPct = invested > 0 ? pnl / invested * 100 : 0;
  async function handleSubmit(e) {
    e.preventDefault();
    if (!pricePerUnit || pricePerUnit <= 0) {
      setError("Harga pasar harus lebih dari 0");
      return;
    }
    const totalValue = pricePerUnit * baseUnitsPerHolding;
    const result = updatePriceSchema.safeParse({ current_value: totalValue });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      await onSave(asset.id, result.data.current_value);
      onClose();
    } catch (err) {
      setError(err.message || "Gagal memperbarui harga");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[440px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden", showCloseButton: false, children: [
    /* @__PURE__ */ jsxs(DialogHeader, { className: "px-6 pt-6 pb-4 border-b border-border/40", children: [
      /* @__PURE__ */ jsx(DialogTitle, { className: "text-base font-bold text-foreground", children: "Update Harga Pasar" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium truncate", children: asset?.asset_name }),
        asset && /* @__PURE__ */ jsx(TypeBadge, { type: asset.asset_type })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "px-6 py-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 p-3 rounded-2xl bg-muted/30 border border-border/40", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: cfg?.unitLabel === "lot" ? "Kepemilikan" : "Jumlah" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-foreground mt-0.5", children: asset ? formatUnitsDisplay(asset.total_units, asset.asset_type) : "—" }),
          asset?.asset_type === "Stocks" && asset.total_units > 0 && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
            (asset.total_units * 100).toLocaleString("id-ID"),
            " lembar"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Harga Beli Avg" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-foreground mt-0.5", children: formatIDRFull(asset?.average_buy_price ?? 0) }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
            "per ",
            cfg?.unitLabel === "lot" ? "lembar" : cfg?.unitLabel
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Modal Awal" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-foreground mt-0.5", children: asset ? formatIDR(getTotalInvested(asset)) : "—" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxs(Label, { className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground", children: [
          "Harga Pasar per ",
          asset?.asset_type === "Stocks" ? "Lembar" : cfg?.unitLabel,
          " Saat Ini (IDR)"
        ] }),
        /* @__PURE__ */ jsx(CurrencyInput, { value: pricePerUnit, onChange: setPricePerUnit, placeholder: "Rp 0" }),
        computedTotal !== void 0 && computedTotal > 0 && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
          "Total nilai pasar:",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-bold text-foreground", children: formatIDRFull(computedTotal) }),
          asset?.asset_type === "Stocks" && /* @__PURE__ */ jsxs("span", { className: "ml-1", children: [
            "(",
            asset.total_units,
            " lot × 100 × ",
            formatIDRFull(pricePerUnit ?? 0),
            ")"
          ] })
        ] })
      ] }),
      computedTotal !== void 0 && computedTotal > 0 && /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between p-3 rounded-2xl border ${pnl >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`, children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-muted-foreground", children: "Estimasi P&L" }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxs("p", { className: `text-sm font-extrabold ${pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`, children: [
            pnl >= 0 ? "+" : "",
            formatIDRFull(pnl)
          ] }),
          /* @__PURE__ */ jsx("p", { className: `text-[10px] font-semibold ${pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`, children: formatPct(pnlPct) })
        ] })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "text-xs text-rose-500 font-medium", children: error }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 pt-3 border-t border-border/40 flex-row justify-end bg-transparent border-0 p-0", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: "px-5 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-sm font-semibold transition-all",
            children: "Batal"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: saving,
            className: "px-6 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-sm font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 disabled:opacity-60",
            children: saving ? "Menyimpan..." : "Update Harga"
          }
        )
      ] })
    ] })
  ] }) });
}
function PortfolioManager({ initialAssets }) {
  const [assets, setAssets] = useState(initialAssets);
  const [addOpen, setAddOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const totalPortfolioValue = useMemo(() => assets.reduce((s, a) => s + a.current_value, 0), [assets]);
  const totalInvestedCapital = useMemo(() => assets.reduce((s, a) => s + getTotalInvested(a), 0), [assets]);
  const totalPnL = totalPortfolioValue - totalInvestedCapital;
  const totalPnLPct = totalInvestedCapital > 0 ? totalPnL / totalInvestedCapital * 100 : 0;
  const isPositive = totalPnL >= 0;
  const donutSegments = useMemo(() => {
    const byType = {};
    assets.forEach((a) => {
      byType[a.asset_type] = (byType[a.asset_type] ?? 0) + a.current_value;
    });
    return Object.entries(byType).map(([type, value]) => ({
      label: ASSET_CONFIG[type].label,
      value,
      pct: totalPortfolioValue > 0 ? value / totalPortfolioValue * 100 : 0,
      color: ASSET_CONFIG[type].donutColor
    })).sort((a, b) => b.value - a.value);
  }, [assets, totalPortfolioValue]);
  const filteredAssets = useMemo(
    () => filterType === "All" ? assets : assets.filter((a) => a.asset_type === filterType),
    [assets, filterType]
  );
  function toast(msg, type = "success") {
    window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: msg, type } }));
  }
  const handleAddAsset = useCallback(async (data) => {
    if (isConfigured && supabase) {
      const { data: inserted, error } = await supabase.from("assets_portfolio").insert(data).select().single();
      if (error) {
        toast(`Gagal menambahkan aset: ${error.message}`, "error");
        throw error;
      }
      setAssets((prev) => [inserted, ...prev]);
    } else {
      setAssets((prev) => [{
        id: "ap_" + Math.random().toString(36).substr(2, 9),
        ...data,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }, ...prev]);
    }
    ASSET_CONFIG[data.asset_type];
    const unitsStr = formatUnitsDisplay(data.total_units, data.asset_type);
    toast(`Aset "${data.asset_name}" (${unitsStr}) berhasil ditambahkan`);
  }, []);
  const handleUpdatePrice = useCallback(async (id, currentValue) => {
    if (isConfigured && supabase) {
      const { error } = await supabase.from("assets_portfolio").update({ current_value: currentValue, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
      if (error) {
        toast(`Gagal update harga: ${error.message}`, "error");
        throw error;
      }
    }
    setAssets((prev) => prev.map(
      (a) => a.id === id ? { ...a, current_value: currentValue, updated_at: (/* @__PURE__ */ new Date()).toISOString() } : a
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
        if (error) {
          toast(`Gagal hapus aset: ${error.message}`, "error");
          return;
        }
      }
      setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      toast(`Aset "${deleteTarget.asset_name}" berhasil dihapus`);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-6 space-y-6 w-full max-w-6xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-extrabold tracking-tight text-foreground", children: "Asset Portfolio" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: "Pantau dan kelola seluruh aset investasi Anda dalam satu halaman." })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: `shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold border mt-1 ${isConfigured ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"}`, children: [
        /* @__PURE__ */ jsx("span", { className: `h-1.5 w-1.5 rounded-full ${isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}` }),
        isConfigured ? "Live — Supabase" : "Demo Mode"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsx(
        MetricCard,
        {
          label: "Total Portfolio Value",
          value: formatIDR(totalPortfolioValue),
          sub: `${assets.length} aset aktif`,
          icon: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" }) })
        }
      ),
      /* @__PURE__ */ jsx(
        MetricCard,
        {
          label: "Total Modal Awal",
          value: formatIDR(totalInvestedCapital),
          sub: "Sudah memperhitungkan lot size",
          icon: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) })
        }
      ),
      /* @__PURE__ */ jsx(
        MetricCard,
        {
          label: "Total Floating P&L",
          value: `${isPositive ? "+" : ""}${formatIDR(totalPnL)}`,
          sub: formatPct(totalPnLPct),
          isPositive,
          icon: isPositive ? /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-emerald-600 dark:text-emerald-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 10l7-7m0 0l7 7m-7-7v18" }) }) : /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-rose-500 dark:text-rose-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 14l-7 7m0 0l-7-7m7 7V3" }) })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-start gap-5 p-5 bg-card border border-border/80 rounded-3xl shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-none flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-[#1B5C58] dark:text-teal-400 self-start", children: "Alokasi Aset" }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground self-start mb-3", children: "Distribusi berdasarkan nilai pasar" }),
        donutSegments.length > 0 ? /* @__PURE__ */ jsx(DonutChart, { segments: donutSegments }) : /* @__PURE__ */ jsx("div", { className: "h-[180px] w-[180px] rounded-full bg-muted/20 flex items-center justify-center text-xs text-muted-foreground", children: "Tidak ada data" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-0 md:pt-8", children: [
        donutSegments.map((seg) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/40", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx("div", { className: "h-3 w-3 rounded-full shrink-0", style: { backgroundColor: seg.color } }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-foreground", children: seg.label }),
              /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
                seg.pct.toFixed(1),
                "% dari portofolio"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs font-extrabold text-foreground tabular-nums", children: formatIDR(seg.value) })
        ] }, seg.label)),
        donutSegments.length === 0 && /* @__PURE__ */ jsx("div", { className: "col-span-2 text-xs text-muted-foreground text-center py-4", children: "Belum ada aset terdaftar" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-foreground", children: "Daftar Aset" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            filteredAssets.length,
            " aset",
            filterType !== "All" ? ` · ${ASSET_CONFIG[filterType].label}` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          ["All", "Stocks", "Crypto", "Gold", "Mutual_Funds"].map((t) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setFilterType(t),
              className: `h-8 px-3 rounded-xl text-[11px] font-bold border transition-all ${filterType === t ? "bg-[#1B5C58] dark:bg-[#2F7E79] text-white border-transparent shadow-sm" : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-border"}`,
              children: t === "All" ? "Semua" : ASSET_CONFIG[t].label
            },
            t
          )),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setAddOpen(true),
              className: "flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-xs font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 whitespace-nowrap",
              children: [
                /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4v16m8-8H4" }) }),
                "+ Tambah Aset"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm", children: [
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/60 bg-muted/20", children: [
            /* @__PURE__ */ jsx("th", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-5 pr-3 py-3.5 text-left whitespace-nowrap", children: "Aset" }),
            /* @__PURE__ */ jsx("th", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-left hidden sm:table-cell whitespace-nowrap", children: "Tipe" }),
            /* @__PURE__ */ jsx("th", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-right hidden md:table-cell whitespace-nowrap", children: "Kepemilikan" }),
            /* @__PURE__ */ jsx("th", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-right hidden lg:table-cell whitespace-nowrap", children: "Harga Beli Avg" }),
            /* @__PURE__ */ jsx("th", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-right hidden lg:table-cell whitespace-nowrap", children: "Modal Awal" }),
            /* @__PURE__ */ jsx("th", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-right whitespace-nowrap", children: "Nilai Pasar" }),
            /* @__PURE__ */ jsx("th", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-right whitespace-nowrap", children: "P&L" }),
            /* @__PURE__ */ jsx("th", { className: "w-[90px] pr-4" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: filteredAssets.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "text-center py-16", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-2xl bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-muted-foreground", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" }) }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm text-foreground", children: "Belum ada aset terdaftar" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: 'Klik "+ Tambah Aset" untuk mulai' })
            ] })
          ] }) }) }) : filteredAssets.map((asset) => {
            const invested = getTotalInvested(asset);
            const pnl = getPnL(asset);
            const pnlPct = getPnLPct(asset);
            const positive = pnl >= 0;
            const cfg = ASSET_CONFIG[asset.asset_type];
            return /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/30 last:border-0 hover:bg-muted/25 transition-colors group", children: [
              /* @__PURE__ */ jsx("td", { className: "pl-5 pr-3 py-3.5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                /* @__PURE__ */ jsx("div", { className: `h-8 w-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${cfg.colors.bg} ${cfg.colors.text}`, children: cfg.emoji }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-foreground truncate max-w-[130px]", children: asset.asset_name }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground sm:hidden", children: cfg.label })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-3.5 hidden sm:table-cell", children: /* @__PURE__ */ jsx(TypeBadge, { type: asset.asset_type }) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-3.5 text-right hidden md:table-cell", children: /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-foreground tabular-nums", children: formatUnitsDisplay(asset.total_units, asset.asset_type) }),
                asset.asset_type === "Stocks" && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground tabular-nums", children: [
                  (asset.total_units * 100).toLocaleString("id-ID"),
                  " lembar"
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-3.5 text-right hidden lg:table-cell", children: /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-muted-foreground tabular-nums", children: formatIDRFull(asset.average_buy_price) }),
                /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
                  "/",
                  asset.asset_type === "Stocks" ? "lembar" : cfg.unitLabel
                ] })
              ] }) }),
              /* @__PURE__ */ jsxs("td", { className: "px-3 py-3.5 text-right hidden lg:table-cell", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-muted-foreground tabular-nums", children: formatIDR(invested) }),
                asset.asset_type === "Stocks" && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
                  asset.total_units,
                  "×100×",
                  formatIDRFull(asset.average_buy_price).replace("Rp ", "Rp")
                ] })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-3.5 text-right", children: /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-foreground tabular-nums", children: formatIDR(asset.current_value) }),
                /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground tabular-nums", children: [
                  formatIDRFull(getCurrentPricePerUnit(asset)),
                  "/",
                  asset.asset_type === "Stocks" ? "lembar" : cfg.unitLabel
                ] })
              ] }) }),
              /* @__PURE__ */ jsxs("td", { className: "px-3 py-3.5 text-right", children: [
                /* @__PURE__ */ jsxs("p", { className: `font-bold text-sm tabular-nums ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`, children: [
                  positive ? "+" : "",
                  formatIDR(pnl)
                ] }),
                /* @__PURE__ */ jsx("p", { className: `text-[10px] font-semibold ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`, children: formatPct(pnlPct) })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "pr-4 py-3.5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setUpdateTarget(asset),
                    className: "flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border/60 bg-background text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all whitespace-nowrap",
                    title: "Update harga pasar",
                    children: [
                      /* @__PURE__ */ jsx("svg", { className: "h-3 w-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }),
                      "Update"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setDeleteTarget(asset),
                    className: "h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all",
                    title: "Hapus aset",
                    children: /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) })
                  }
                )
              ] }) })
            ] }, asset.id);
          }) })
        ] }) }),
        filteredAssets.length > 0 && /* @__PURE__ */ jsxs("div", { className: "px-5 py-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground bg-muted/10", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              "Nilai Pasar: ",
              /* @__PURE__ */ jsx("span", { className: "font-bold text-foreground tabular-nums", children: formatIDRFull(filteredAssets.reduce((s, a) => s + a.current_value, 0)) })
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Modal: ",
              /* @__PURE__ */ jsx("span", { className: "font-bold text-foreground tabular-nums", children: formatIDRFull(filteredAssets.reduce((s, a) => s + getTotalInvested(a), 0)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: `font-bold tabular-nums ${filteredAssets.reduce((s, a) => s + getPnL(a), 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`, children: [
            "P&L: ",
            formatIDRFull(filteredAssets.reduce((s, a) => s + getPnL(a), 0))
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(AddAssetDialog, { open: addOpen, onClose: () => setAddOpen(false), onSave: handleAddAsset }),
    /* @__PURE__ */ jsx(UpdatePriceDialog, { open: !!updateTarget, asset: updateTarget, onClose: () => setUpdateTarget(null), onSave: handleUpdatePrice }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: () => setDeleteTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "bg-card border border-border/80 rounded-3xl shadow-xl", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-base font-bold", children: "Hapus Aset?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-sm text-muted-foreground", children: [
          "Aset ",
          /* @__PURE__ */ jsxs("span", { className: "font-semibold text-foreground", children: [
            '"',
            deleteTarget?.asset_name,
            '"'
          ] }),
          " akan dihapus secara permanen dari portofolio Anda."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "rounded-xl h-10 text-sm bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 hover:text-foreground", children: "Batal" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: handleDelete,
            disabled: deleting,
            className: "rounded-xl h-10 text-sm bg-rose-500 hover:bg-rose-600 text-white font-semibold disabled:opacity-60",
            children: deleting ? "Menghapus..." : "Ya, Hapus Aset"
          }
        )
      ] })
    ] }) })
  ] });
}

const $$Portfolio = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Portfolio;
  let assets = [];
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("assets_portfolio").select("id, asset_name, asset_type, total_units, average_buy_price, current_value, updated_at").order("asset_type", { ascending: true }).order("current_value", { ascending: false });
      if (!error && data) {
        assets = data;
      }
    } catch (err) {
      console.error("[portfolio.astro] Failed to fetch assets:", err);
    }
  }
  Astro2.response.headers.set("Cache-Control", "s-maxage=30, stale-while-revalidate=120");
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "FinGram — Asset Portfolio", "description": "Pantau dan kelola seluruh portofolio aset investasi Anda: saham, kripto, emas, dan reksa dana." }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "PortfolioManager", PortfolioManager, { "client:load": true, "initialAssets": assets, "client:component-hydration": "load", "client:component-path": "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/PortfolioManager", "client:component-export": "default" })} ` })}`;
}, "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/pages/portfolio.astro", void 0);

const $$file = "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/pages/portfolio.astro";
const $$url = "/portfolio";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Portfolio,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
