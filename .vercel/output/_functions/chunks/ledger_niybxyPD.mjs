import { c as createComponent } from './astro-component_BZpYguPY.mjs';
import 'piccolore';
import { o as renderComponent, k as renderTemplate } from './entrypoint_CEi4kyBi.mjs';
import { i as isConfigured, s as supabase, g as getTransactionDelta, a as adjustWalletBalance, $ as $$Layout } from './Layout_BthChk5b.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { p as cn, A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, S as Select, k as SelectTrigger, l as SelectValue, m as SelectContent, n as SelectItem, C as CurrencyInput, o as DialogFooter, L as Label } from './CurrencyInput_CMt_8Wns.mjs';
import { I as Input } from './input_CRWT8b1J.mjs';
import { F as FilterControls } from './FilterControls_BOUz61h1.mjs';

function Table({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "table-container",
      className: "relative w-full overflow-x-auto",
      children: /* @__PURE__ */ jsx(
        "table",
        {
          "data-slot": "table",
          className: cn("w-full caption-bottom text-sm", className),
          ...props
        }
      )
    }
  );
}
function TableHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "thead",
    {
      "data-slot": "table-header",
      className: cn("[&_tr]:border-b", className),
      ...props
    }
  );
}
function TableBody({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tbody",
    {
      "data-slot": "table-body",
      className: cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  );
}
function TableRow({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tr",
    {
      "data-slot": "table-row",
      className: cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      ),
      ...props
    }
  );
}
function TableHead({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "th",
    {
      "data-slot": "table-head",
      className: cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      ),
      ...props
    }
  );
}
function TableCell({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "td",
    {
      "data-slot": "table-cell",
      className: cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      ),
      ...props
    }
  );
}

const PAGE_SIZE = 10;
const txSchema = z.object({
  description: z.string().min(1, "Deskripsi tidak boleh kosong"),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  type: z.enum(["INCOME", "EXPENSE", "INVESTMENT_BUY", "INVESTMENT_SELL"]),
  wallet_id: z.string().min(1, "Pilih akun"),
  category_id: z.string().min(1, "Pilih kategori")
});
function formatIDR(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
function formatDate(dateStr) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  }).format(new Date(dateStr));
}
function getTypeBadge(type) {
  const map = {
    INCOME: { label: "Pemasukan", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
    EXPENSE: { label: "Pengeluaran", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
    INVESTMENT_BUY: { label: "Invest. Beli", cls: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
    INVESTMENT_SELL: { label: "Invest. Jual", cls: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20" }
  };
  const { label, cls } = map[type];
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${cls}`, children: label });
}
function getAmountDisplay(amount, type) {
  const isPositive = type === "INCOME" || type === "INVESTMENT_SELL";
  return /* @__PURE__ */ jsxs("span", { className: `font-bold tabular-nums text-sm ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`, children: [
    isPositive ? "+" : "-",
    formatIDR(amount)
  ] });
}
function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize
}) {
  if (totalPages <= 1) return null;
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/10", children: [
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground hidden sm:block", children: [
      "Menampilkan ",
      /* @__PURE__ */ jsxs("span", { className: "font-semibold text-foreground", children: [
        start,
        "–",
        end
      ] }),
      " dari ",
      /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: totalItems }),
      " transaksi"
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground sm:hidden", children: [
      start,
      "–",
      end,
      " / ",
      totalItems
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onPageChange(page - 1),
          disabled: page === 1,
          className: "h-7 w-7 flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs",
          "aria-label": "Previous page",
          children: /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" }) })
        }
      ),
      pages.map(
        (p, i) => p === "..." ? /* @__PURE__ */ jsx("span", { className: "h-7 w-7 flex items-center justify-center text-xs text-muted-foreground", children: "…" }, `ellipsis-${i}`) : /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onPageChange(p),
            className: `h-7 min-w-[28px] px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${page === p ? "bg-[#1B5C58] dark:bg-[#2F7E79] text-white shadow-sm" : "border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"}`,
            children: p
          },
          p
        )
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onPageChange(page + 1),
          disabled: page === totalPages,
          className: "h-7 w-7 flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs",
          "aria-label": "Next page",
          children: /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) })
        }
      )
    ] })
  ] });
}
function FormField({ label, error, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsx("label", { className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground", children: label }),
    children,
    error && /* @__PURE__ */ jsx("p", { className: "text-xs text-rose-500 font-medium mt-1", children: error })
  ] });
}
function TxFormDialog({
  open,
  onClose,
  onSave,
  wallets,
  categories,
  initial
}) {
  const [form, setForm] = useState({
    description: "",
    amount: void 0,
    type: "INCOME",
    wallet_id: "",
    category_id: "",
    ...initial
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      setForm({
        description: initial?.description ?? "",
        amount: initial?.amount ?? void 0,
        type: initial?.type ?? "INCOME",
        wallet_id: initial?.wallet_id ?? "",
        category_id: initial?.category_id ?? ""
      });
      setErrors({});
    }
  }, [open]);
  const filteredCategories = useMemo(
    () => categories.filter((c) => !form.type || c.type === form.type),
    [categories, form.type]
  );
  async function handleSubmit(e) {
    e.preventDefault();
    const result = txSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0]] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    await onSave(result.data);
    setSaving(false);
    onClose();
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[460px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden", children: [
    /* @__PURE__ */ jsx(DialogHeader, { className: "px-6 pt-6 pb-4 border-b border-border/40", children: /* @__PURE__ */ jsx(DialogTitle, { className: "text-base font-bold text-foreground", children: initial?.description ? "Edit Transaksi" : "Tambah Transaksi Baru" }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "px-6 py-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsx(FormField, { label: "Jenis", error: errors.type, children: /* @__PURE__ */ jsxs(
          Select,
          {
            value: form.type,
            onValueChange: (v) => setForm((p) => ({ ...p, type: v, category_id: "" })),
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "INCOME", children: "Pemasukan" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "EXPENSE", children: "Pengeluaran" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "INVESTMENT_BUY", children: "Investasi Beli" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "INVESTMENT_SELL", children: "Investasi Jual" })
              ] })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx(FormField, { label: "Akun", error: errors.wallet_id, children: /* @__PURE__ */ jsxs(Select, { value: form.wallet_id ?? "", onValueChange: (v) => setForm((p) => ({ ...p, wallet_id: v })), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pilih..." }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: wallets.map((w) => /* @__PURE__ */ jsx(SelectItem, { value: w.id, children: w.name }, w.id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(FormField, { label: "Deskripsi", error: errors.description, children: /* @__PURE__ */ jsx(
        Input,
        {
          value: form.description ?? "",
          onChange: (e) => setForm((p) => ({ ...p, description: e.target.value })),
          placeholder: "Contoh: Gaji Bulan Juni",
          className: "rounded-xl border-border/80 bg-background h-10 text-sm"
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsx(FormField, { label: "Nominal (IDR)", error: errors.amount, children: /* @__PURE__ */ jsx(
          CurrencyInput,
          {
            value: form.amount,
            onChange: (v) => setForm((p) => ({ ...p, amount: v })),
            placeholder: "Rp 0"
          }
        ) }),
        /* @__PURE__ */ jsx(FormField, { label: "Kategori", error: errors.category_id, children: /* @__PURE__ */ jsxs(Select, { value: form.category_id ?? "", onValueChange: (v) => setForm((p) => ({ ...p, category_id: v })), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pilih..." }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: filteredCategories.map((c) => /* @__PURE__ */ jsx(SelectItem, { value: c.id, children: c.name }, c.id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 pt-3 border-t border-border/40 mt-6", children: [
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
            children: saving ? "Menyimpan..." : "Simpan Transaksi"
          }
        )
      ] })
    ] })
  ] }) });
}
const accountSchema = z.object({
  name: z.string().min(1, "Nama akun tidak boleh kosong"),
  balance: z.coerce.number().min(0, "Saldo awal tidak boleh negatif")
});
const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori tidak boleh kosong"),
  type: z.enum(["INCOME", "EXPENSE", "INVESTMENT_BUY", "INVESTMENT_SELL"])
});
function AddAccountDialog({
  open,
  onClose,
  onSave
}) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState(void 0);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      setName("");
      setBalance(void 0);
      setError(null);
    }
  }, [open]);
  async function handleSubmit(e) {
    e.preventDefault();
    const result = accountSchema.safeParse({ name, balance });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      await onSave(result.data);
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menyimpan akun");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[420px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden", children: [
    /* @__PURE__ */ jsx(DialogHeader, { className: "px-6 pt-6 pb-4 border-b border-border/40", children: /* @__PURE__ */ jsx(DialogTitle, { className: "text-base font-bold text-foreground", children: "Tambah Akun Baru" }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "px-6 py-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground", children: "Nama Akun" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: name,
              onChange: (e) => setName(e.target.value),
              placeholder: "Contoh: BCA Utama, ShopeePay",
              className: "rounded-xl border-border/80 bg-background h-10 text-sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground", children: "Saldo Awal (IDR)" }),
          /* @__PURE__ */ jsx(
            CurrencyInput,
            {
              value: balance,
              onChange: setBalance,
              placeholder: "Rp 0"
            }
          )
        ] })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "text-xs text-rose-500 font-medium", children: error }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 pt-3 border-t border-border/40 mt-6", children: [
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
            children: saving ? "Menyimpan..." : "Simpan Akun"
          }
        )
      ] })
    ] })
  ] }) });
}
function AddCategoryDialog({
  open,
  onClose,
  onSave
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      setName("");
      setType("EXPENSE");
      setError(null);
    }
  }, [open]);
  async function handleSubmit(e) {
    e.preventDefault();
    const result = categorySchema.safeParse({ name, type });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      await onSave(result.data);
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menyimpan kategori");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[420px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden", children: [
    /* @__PURE__ */ jsx(DialogHeader, { className: "px-6 pt-6 pb-4 border-b border-border/40", children: /* @__PURE__ */ jsx(DialogTitle, { className: "text-base font-bold text-foreground", children: "Tambah Kategori Baru" }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "px-6 py-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground", children: "Nama Kategori" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: name,
              onChange: (e) => setName(e.target.value),
              placeholder: "Contoh: Makanan, Transportasi, Gaji",
              className: "rounded-xl border-border/80 bg-background h-10 text-sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground", children: "Jenis Transaksi" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: type,
              onValueChange: (v) => setType(v),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "INCOME", children: "Pemasukan" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "EXPENSE", children: "Pengeluaran" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "INVESTMENT_BUY", children: "Investasi Beli" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "INVESTMENT_SELL", children: "Investasi Jual" })
                ] })
              ]
            }
          )
        ] })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "text-xs text-rose-500 font-medium", children: error }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 pt-3 border-t border-border/40 mt-6", children: [
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
            children: saving ? "Menyimpan..." : "Simpan Kategori"
          }
        )
      ] })
    ] })
  ] }) });
}
function LedgerManager({
  initialTransactions,
  initialWallets,
  initialCategories,
  openNew = false
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [wallets, setWallets] = useState(initialWallets);
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [filterYear, setFilterYear] = useState(2026);
  const [filterMonth, setFilterMonth] = useState(6);
  const [filterDate, setFilterDate] = useState(void 0);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(openNew);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dbError, setDbError] = useState(null);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter((tx) => {
      const matchSearch = !q || tx.description.toLowerCase().includes(q) || tx.wallet_name.toLowerCase().includes(q) || tx.category_name.toLowerCase().includes(q);
      let matchType = true;
      if (filterType === "income") {
        matchType = tx.type === "INCOME" || tx.type === "INVESTMENT_SELL";
      } else if (filterType === "spend") {
        matchType = tx.type === "EXPENSE" || tx.type === "INVESTMENT_BUY";
      }
      let matchDate = true;
      const txDate = new Date(tx.created_at);
      if (filterPeriod === "month") {
        matchDate = txDate.getFullYear() === filterYear && txDate.getMonth() + 1 === filterMonth;
      } else if (filterPeriod === "year") {
        matchDate = txDate.getFullYear() === filterYear;
      } else if (filterPeriod === "date" && filterDate) {
        const targetD = new Date(filterDate);
        matchDate = txDate.getFullYear() === targetD.getFullYear() && txDate.getMonth() === targetD.getMonth() && txDate.getDate() === targetD.getDate();
      }
      return matchSearch && matchType && matchDate;
    });
  }, [transactions, search, filterType, filterPeriod, filterYear, filterMonth, filterDate]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );
  const handleSearch = (v) => {
    setSearch(v);
    setPage(1);
  };
  const handleFilterControlsChange = (state) => {
    setFilterType(state.type);
    setFilterPeriod(state.period);
    setFilterYear(state.year);
    setFilterMonth(state.month);
    setFilterDate(state.date);
    setPage(1);
  };
  const totalIncome = useMemo(() => filtered.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0), [filtered]);
  const getWalletName = (id) => wallets.find((w) => w.id === id)?.name ?? "—";
  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name ?? "—";
  const handleAdd = useCallback(async (data) => {
    if (isConfigured && supabase) {
      const { data: inserted, error } = await supabase.from("transactions").insert({ ...data }).select("*, wallets(name), categories(name)").single();
      if (error) {
        setDbError(error.message);
        return;
      }
      const row = {
        ...inserted,
        wallet_name: inserted.wallets?.name ?? getWalletName(data.wallet_id),
        category_name: inserted.categories?.name ?? getCategoryName(data.category_id)
      };
      setTransactions((prev) => [row, ...prev]);
      const delta = getTransactionDelta(data.amount, data.type);
      const updatedWallet = await adjustWalletBalance(data.wallet_id, delta);
      if (updatedWallet) {
        setWallets((prev) => prev.map((w) => w.id === updatedWallet.id ? updatedWallet : w));
        window.dispatchEvent(new CustomEvent("wallet-balance-updated", {
          detail: { walletId: updatedWallet.id, newBalance: updatedWallet.balance }
        }));
      }
    } else {
      setTransactions((prev) => [{
        id: "tx_" + Math.random().toString(36).substr(2, 9),
        ...data,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        wallet_name: getWalletName(data.wallet_id),
        category_name: getCategoryName(data.category_id)
      }, ...prev]);
      const delta = getTransactionDelta(data.amount, data.type);
      setWallets((prev) => prev.map(
        (w) => w.id === data.wallet_id ? { ...w, balance: w.balance + delta } : w
      ));
    }
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: { message: `Berhasil menambahkan transaksi "${data.description}"`, type: "success" }
    }));
  }, [wallets, categories]);
  const handleAddAccount = useCallback(async (data) => {
    if (isConfigured && supabase) {
      const { data: inserted, error } = await supabase.from("wallets").insert({ name: data.name, balance: data.balance }).select().single();
      if (error) {
        setDbError(error.message);
        throw error;
      }
      setWallets((prev) => [...prev, inserted]);
    } else {
      const newAcc = {
        id: "w_" + Math.random().toString(36).substr(2, 9),
        name: data.name,
        balance: data.balance
      };
      setWallets((prev) => [...prev, newAcc]);
    }
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: { message: `Berhasil menambahkan akun "${data.name}"`, type: "success" }
    }));
  }, []);
  const handleAddCategory = useCallback(async (data) => {
    if (isConfigured && supabase) {
      const { data: inserted, error } = await supabase.from("categories").insert({ name: data.name, type: data.type }).select().single();
      if (error) {
        setDbError(error.message);
        throw error;
      }
      setCategories((prev) => [...prev, inserted]);
    } else {
      const newCat = {
        id: "c_" + Math.random().toString(36).substr(2, 9),
        name: data.name,
        type: data.type
      };
      setCategories((prev) => [...prev, newCat]);
    }
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: { message: `Berhasil menambahkan kategori "${data.name}"`, type: "success" }
    }));
  }, []);
  const handleEdit = useCallback(async (data) => {
    if (!editTarget) return;
    if (isConfigured && supabase) {
      const { error } = await supabase.from("transactions").update(data).eq("id", editTarget.id);
      if (error) {
        setDbError(error.message);
        return;
      }
      const oldDelta = getTransactionDelta(editTarget.amount, editTarget.type);
      const newDelta = getTransactionDelta(data.amount, data.type);
      if (editTarget.wallet_id === data.wallet_id) {
        const netDelta = newDelta - oldDelta;
        if (netDelta !== 0) {
          const updatedWallet = await adjustWalletBalance(data.wallet_id, netDelta);
          if (updatedWallet) {
            setWallets((prev) => prev.map((w) => w.id === updatedWallet.id ? updatedWallet : w));
            window.dispatchEvent(new CustomEvent("wallet-balance-updated", {
              detail: { walletId: updatedWallet.id, newBalance: updatedWallet.balance }
            }));
          }
        }
      } else {
        const [updatedOld, updatedNew] = await Promise.all([
          adjustWalletBalance(editTarget.wallet_id, -oldDelta),
          adjustWalletBalance(data.wallet_id, newDelta)
        ]);
        [updatedOld, updatedNew].forEach((w) => {
          if (w) {
            setWallets((prev) => prev.map((ww) => ww.id === w.id ? w : ww));
            window.dispatchEvent(new CustomEvent("wallet-balance-updated", {
              detail: { walletId: w.id, newBalance: w.balance }
            }));
          }
        });
      }
    } else {
      const oldDelta = getTransactionDelta(editTarget.amount, editTarget.type);
      const newDelta = getTransactionDelta(data.amount, data.type);
      setWallets((prev) => prev.map((w) => {
        if (w.id === editTarget.wallet_id && w.id === data.wallet_id) {
          return { ...w, balance: w.balance - oldDelta + newDelta };
        } else if (w.id === editTarget.wallet_id) {
          return { ...w, balance: w.balance - oldDelta };
        } else if (w.id === data.wallet_id) {
          return { ...w, balance: w.balance + newDelta };
        }
        return w;
      }));
    }
    setTransactions((prev) => prev.map(
      (tx) => tx.id === editTarget.id ? { ...tx, ...data, wallet_name: getWalletName(data.wallet_id), category_name: getCategoryName(data.category_id) } : tx
    ));
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: { message: `Berhasil memperbarui transaksi "${data.description}"`, type: "success" }
    }));
    setEditTarget(null);
  }, [editTarget, wallets, categories]);
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    if (isConfigured && supabase) {
      const { error } = await supabase.from("transactions").delete().eq("id", deleteTarget.id);
      if (error) {
        setDbError(error.message);
        return;
      }
      const reverseDelta = -getTransactionDelta(deleteTarget.amount, deleteTarget.type);
      const updatedWallet = await adjustWalletBalance(deleteTarget.wallet_id, reverseDelta);
      if (updatedWallet) {
        setWallets((prev) => prev.map((w) => w.id === updatedWallet.id ? updatedWallet : w));
        window.dispatchEvent(new CustomEvent("wallet-balance-updated", {
          detail: { walletId: updatedWallet.id, newBalance: updatedWallet.balance }
        }));
      }
    } else {
      const reverseDelta = -getTransactionDelta(deleteTarget.amount, deleteTarget.type);
      setWallets((prev) => prev.map(
        (w) => w.id === deleteTarget.wallet_id ? { ...w, balance: w.balance + reverseDelta } : w
      ));
    }
    const targetName = deleteTarget.description;
    setTransactions((prev) => prev.filter((tx) => tx.id !== deleteTarget.id));
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: { message: `Berhasil menghapus transaksi "${targetName}"`, type: "success" }
    }));
    setDeleteTarget(null);
  }, [deleteTarget]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-6 space-y-5 w-full max-w-6xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-extrabold tracking-tight text-foreground", children: "Transaction Ledger" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: "Kelola seluruh transaksi pemasukan, pengeluaran, dan investasi Anda." })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: `shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold border mt-1 ${isConfigured ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"}`, children: [
        /* @__PURE__ */ jsx("span", { className: `h-1.5 w-1.5 rounded-full ${isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}` }),
        isConfigured ? "Live — Supabase" : "Demo Mode"
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      FilterControls,
      {
        type: filterType,
        period: filterPeriod,
        year: filterYear,
        month: filterMonth,
        date: filterDate,
        onChange: handleFilterControlsChange
      }
    ),
    dbError && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium", children: [
      /* @__PURE__ */ jsx("svg", { className: "h-4 w-4 shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }),
      dbError
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:max-w-sm", children: [
        /* @__PURE__ */ jsx("svg", { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" }) }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: search,
            onChange: (e) => handleSearch(e.target.value),
            placeholder: "Cari deskripsi, kategori, akun...",
            className: "pl-9 rounded-xl border-border/80 bg-card/60 h-10 text-sm w-full"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap sm:flex-nowrap", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setAccountOpen(true),
            className: "flex items-center gap-1.5 px-4 py-2.5 h-10 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground text-xs font-bold transition-all active:scale-95 whitespace-nowrap",
            children: [
              /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4v16m8-8H4" }) }),
              "+ Akun"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setCategoryOpen(true),
            className: "flex items-center gap-1.5 px-4 py-2.5 h-10 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground text-xs font-bold transition-all active:scale-95 whitespace-nowrap",
            children: [
              /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4v16m8-8H4" }) }),
              "+ Kategori"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setAddOpen(true),
            className: "flex items-center gap-1.5 px-4 py-2.5 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-xs font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 whitespace-nowrap",
            children: [
              /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4v16m8-8H4" }) }),
              "Tambah Transaksi"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { className: "border-border/60 hover:bg-transparent bg-muted/20", children: [
          /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-5 pr-3 py-3 w-[150px]", children: "Tanggal" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3", children: "Deskripsi" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 w-[120px] hidden sm:table-cell", children: "Jenis" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 w-[140px] hidden md:table-cell", children: "Kategori" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 w-[110px] hidden lg:table-cell", children: "Akun" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 w-[140px] text-right", children: "Nominal" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-[60px] pr-4" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: paginated.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 7, className: "text-center py-20", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-2xl bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-muted-foreground", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm text-foreground", children: "Tidak ada transaksi ditemukan" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Coba ubah filter atau tambahkan transaksi baru" })
          ] })
        ] }) }) }) : paginated.map((tx) => /* @__PURE__ */ jsxs(TableRow, { className: "border-border/30 hover:bg-muted/25 transition-colors group", children: [
          /* @__PURE__ */ jsx(TableCell, { className: "pl-5 pr-3 py-3.5", children: /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium whitespace-nowrap", children: formatDate(tx.created_at) }) }),
          /* @__PURE__ */ jsxs(TableCell, { className: "px-3 py-3.5", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground leading-tight max-w-[200px] truncate", children: tx.description }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5 sm:hidden", children: tx.category_name })
          ] }),
          /* @__PURE__ */ jsx(TableCell, { className: "px-3 py-3.5 hidden sm:table-cell", children: getTypeBadge(tx.type) }),
          /* @__PURE__ */ jsx(TableCell, { className: "px-3 py-3.5 hidden md:table-cell", children: /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium", children: tx.category_name }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "px-3 py-3.5 hidden lg:table-cell", children: /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium", children: tx.wallet_name }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "px-3 py-3.5 text-right", children: getAmountDisplay(tx.amount, tx.type) }),
          /* @__PURE__ */ jsx(TableCell, { className: "pr-4 py-3.5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setEditTarget(tx),
                className: "h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all",
                title: "Edit",
                children: /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" }) })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setDeleteTarget(tx),
                className: "h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all",
                title: "Hapus",
                children: /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) })
              }
            )
          ] }) })
        ] }, tx.id)) })
      ] }) }),
      filtered.length > 0 && /* @__PURE__ */ jsx("div", { className: "px-5 py-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground bg-muted/10", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Pemasukan:",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-bold text-emerald-600 dark:text-emerald-400", children: formatIDR(totalIncome) })
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          "Pengeluaran:",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-bold text-rose-500 dark:text-rose-400", children: formatIDR(totalExpense) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(
        Pagination,
        {
          page: safePage,
          totalPages,
          onPageChange: setPage,
          totalItems: filtered.length,
          pageSize: PAGE_SIZE
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      TxFormDialog,
      {
        open: addOpen,
        onClose: () => setAddOpen(false),
        onSave: handleAdd,
        wallets,
        categories
      }
    ),
    /* @__PURE__ */ jsx(
      AddAccountDialog,
      {
        open: accountOpen,
        onClose: () => setAccountOpen(false),
        onSave: handleAddAccount
      }
    ),
    /* @__PURE__ */ jsx(
      AddCategoryDialog,
      {
        open: categoryOpen,
        onClose: () => setCategoryOpen(false),
        onSave: handleAddCategory
      }
    ),
    /* @__PURE__ */ jsx(
      TxFormDialog,
      {
        open: !!editTarget,
        onClose: () => setEditTarget(null),
        onSave: handleEdit,
        wallets,
        categories,
        initial: editTarget ? {
          description: editTarget.description,
          amount: editTarget.amount,
          type: editTarget.type,
          wallet_id: editTarget.wallet_id,
          category_id: editTarget.category_id
        } : void 0
      }
    ),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: () => setDeleteTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "bg-card border border-border/80 rounded-3xl shadow-xl", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-base font-bold", children: "Hapus Transaksi?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-sm text-muted-foreground", children: [
          "Transaksi ",
          /* @__PURE__ */ jsxs("span", { className: "font-semibold text-foreground", children: [
            '"',
            deleteTarget?.description,
            '"'
          ] }),
          " akan dihapus secara permanen."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "rounded-xl h-10 text-sm bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 hover:text-foreground", children: "Batal" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: handleDelete,
            className: "rounded-xl h-10 text-sm bg-rose-500 hover:bg-rose-600 text-white font-semibold",
            children: "Ya, Hapus"
          }
        )
      ] })
    ] }) })
  ] });
}

const $$Ledger = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Ledger;
  const MOCK_WALLETS = [];
  const MOCK_CATEGORIES = [];
  let transactions = [];
  let wallets = MOCK_WALLETS;
  let categories = MOCK_CATEGORIES;
  if (isConfigured && supabase) {
    try {
      const [txRes, walletRes, catRes] = await Promise.all([
        supabase.from("transactions").select("*, wallets(name), categories(name)").order("created_at", { ascending: false }).limit(500),
        supabase.from("wallets").select("id, name, balance"),
        supabase.from("categories").select("id, name, type")
      ]);
      if (!txRes.error && txRes.data) {
        transactions = txRes.data.map((row) => ({
          ...row,
          wallet_name: row.wallets?.name ?? "—",
          category_name: row.categories?.name ?? "—"
        }));
      }
      if (!walletRes.error && walletRes.data) wallets = walletRes.data;
      if (!catRes.error && catRes.data) categories = catRes.data;
    } catch {
    }
  }
  const openNew = Astro2.url.searchParams.get("action") === "new";
  Astro2.response.headers.set("Cache-Control", "no-store");
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "FinGram — Transaction Ledger", "description": "Kelola seluruh transaksi pemasukan, pengeluaran, dan investasi dalam satu tampilan ledger yang terorganisir." }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "LedgerManager", LedgerManager, { "client:load": true, "initialTransactions": transactions, "initialWallets": wallets, "initialCategories": categories, "openNew": openNew, "client:component-hydration": "load", "client:component-path": "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/LedgerManager", "client:component-export": "default" })} ` })}`;
}, "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/pages/ledger.astro", void 0);

const $$file = "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/pages/ledger.astro";
const $$url = "/ledger";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Ledger,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
