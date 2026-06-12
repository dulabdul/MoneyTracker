import { c as createComponent } from './astro-component_BZpYguPY.mjs';
import 'piccolore';
import { o as renderComponent, k as renderTemplate } from './entrypoint_CEi4kyBi.mjs';
import { i as isConfigured, s as supabase, $ as $$Layout } from './Layout_BthChk5b.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, L as Label, S as Select, k as SelectTrigger, l as SelectValue, m as SelectContent, n as SelectItem, C as CurrencyInput, o as DialogFooter } from './CurrencyInput_CMt_8Wns.mjs';
import 'clsx';

const budgetFormSchema = z.object({
  category_id: z.string().min(1, "Kategori wajib dipilih"),
  limit_amount: z.number().positive("Batas anggaran harus lebih besar dari 0")
});
function formatIDR(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);
}
function getDaysRemaining(year, month) {
  const today = /* @__PURE__ */ new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const totalDays = new Date(year, month, 0).getDate();
  if (year < currentYear || year === currentYear && month < currentMonth) {
    return 0;
  }
  if (year > currentYear || year === currentYear && month > currentMonth) {
    return totalDays;
  }
  const currentDay = today.getDate();
  return Math.max(1, totalDays - currentDay + 1);
}
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember"
];
function AddEditBudgetDialog({
  open,
  onClose,
  onSave,
  editingBudget,
  categories,
  existingCategoryIds
}) {
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState(void 0);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      if (editingBudget) {
        setCategoryId(editingBudget.category_id);
        setLimitAmount(editingBudget.limit_amount);
      } else {
        setCategoryId("");
        setLimitAmount(void 0);
      }
      setError(null);
    }
  }, [open, editingBudget]);
  const availableCategories = useMemo(() => {
    const expenseOnly = categories.filter((c) => c.type === "EXPENSE");
    if (editingBudget) {
      return expenseOnly.filter((c) => c.id === editingBudget.category_id);
    }
    return expenseOnly.filter((c) => !existingCategoryIds.includes(c.id));
  }, [categories, existingCategoryIds, editingBudget]);
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const parseResult = budgetFormSchema.safeParse({
      category_id: categoryId,
      limit_amount: limitAmount ?? 0
    });
    if (!parseResult.success) {
      setError(parseResult.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      await onSave(parseResult.data);
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menyimpan anggaran.");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[420px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden", children: [
    /* @__PURE__ */ jsx(DialogHeader, { className: "px-6 pt-6 pb-4 border-b border-border/40", children: /* @__PURE__ */ jsx(DialogTitle, { className: "text-base font-bold text-foreground", children: editingBudget ? "Edit Batas Anggaran" : "Set Anggaran Baru" }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "px-6 py-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground", children: "Kategori Pengeluaran" }),
          editingBudget ? /* @__PURE__ */ jsx("div", { className: "h-10 px-3 rounded-xl border border-border/60 bg-muted/30 flex items-center text-sm font-semibold text-foreground/80", children: editingBudget.category_name }) : /* @__PURE__ */ jsxs(Select, { value: categoryId, onValueChange: setCategoryId, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "rounded-xl border-border/80 bg-background h-10 text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pilih Kategori" }) }),
            /* @__PURE__ */ jsx(SelectContent, { className: "bg-card border border-border/80 rounded-xl", children: availableCategories.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-3 text-xs text-center text-muted-foreground", children: "Semua kategori pengeluaran sudah memiliki anggaran." }) : availableCategories.map((cat) => /* @__PURE__ */ jsx(SelectItem, { value: cat.id, className: "text-sm rounded-lg", children: cat.name }, cat.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground", children: "Batas Anggaran Bulanan (IDR)" }),
          /* @__PURE__ */ jsx(
            CurrencyInput,
            {
              value: limitAmount,
              onChange: setLimitAmount,
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
            className: "px-5 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-sm font-semibold transition-all cursor-pointer",
            children: "Batal"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: saving || !editingBudget && availableCategories.length === 0,
            className: "px-6 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-sm font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 disabled:opacity-60 cursor-pointer",
            children: saving ? "Menyimpan..." : editingBudget ? "Simpan Perubahan" : "Tetapkan Anggaran"
          }
        )
      ] })
    ] })
  ] }) });
}
function BudgetManager({
  initialBudgets,
  categories,
  activeMonth,
  activeYear
}) {
  const [budgets, setBudgets] = useState(initialBudgets);
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    setBudgets(initialBudgets);
  }, [initialBudgets]);
  const triggerToast = useCallback((message, type = "success") => {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message, type }
      })
    );
  }, []);
  const totalBudgeted = useMemo(() => budgets.reduce((s, b) => s + b.limit_amount, 0), [budgets]);
  const totalSpent = useMemo(() => budgets.reduce((s, b) => s + b.total_spent, 0), [budgets]);
  const remainingBudget = totalBudgeted - totalSpent;
  const daysRemaining = useMemo(() => getDaysRemaining(activeYear, activeMonth), [activeYear, activeMonth]);
  const existingCategoryIds = useMemo(() => budgets.map((b) => b.category_id), [budgets]);
  const getSpentForCategory = useCallback(async (categoryId) => {
    if (!isConfigured || !supabase) return 0;
    try {
      const sDate = new Date(activeYear, activeMonth - 1, 1);
      const eDate = new Date(activeYear, activeMonth, 0, 23, 59, 59, 999);
      const { data, error } = await supabase.from("transactions").select("amount").eq("category_id", categoryId).eq("type", "EXPENSE").gte("created_at", sDate.toISOString()).lte("created_at", eDate.toISOString());
      if (error || !data) return 0;
      return data.reduce((s, t) => s + Number(t.amount), 0);
    } catch {
      return 0;
    }
  }, [activeMonth, activeYear]);
  const handleSaveBudget = useCallback(
    async (formData) => {
      const categoryName = categories.find((c) => c.id === formData.category_id)?.name ?? "Kategori";
      if (editingBudget) {
        if (isConfigured && supabase) {
          const { error } = await supabase.from("budgets").update({ limit_amount: formData.limit_amount }).eq("id", editingBudget.id);
          if (error) {
            triggerToast(`Gagal mengedit anggaran: ${error.message}`, "error");
            throw error;
          }
        }
        setBudgets(
          (prev) => prev.map(
            (b) => b.id === editingBudget.id ? { ...b, limit_amount: formData.limit_amount } : b
          )
        );
        triggerToast(`Anggaran kategori "${categoryName}" berhasil diperbarui.`);
      } else {
        const currentSpent = await getSpentForCategory(formData.category_id);
        let insertedId = "b_" + Math.random().toString(36).substring(2, 9);
        if (isConfigured && supabase) {
          const { data, error } = await supabase.from("budgets").insert({
            category_id: formData.category_id,
            limit_amount: formData.limit_amount,
            month: activeMonth,
            year: activeYear
          }).select().single();
          if (error) {
            triggerToast(`Gagal membuat anggaran: ${error.message}`, "error");
            throw error;
          }
          insertedId = data.id;
        }
        const newBudget = {
          id: insertedId,
          category_id: formData.category_id,
          category_name: categoryName,
          limit_amount: formData.limit_amount,
          total_spent: currentSpent,
          month: activeMonth,
          year: activeYear
        };
        setBudgets((prev) => [newBudget, ...prev]);
        triggerToast(`Anggaran untuk "${categoryName}" berhasil ditetapkan.`);
      }
    },
    [editingBudget, categories, activeMonth, activeYear, getSpentForCategory, triggerToast]
  );
  const handleDeleteBudget = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (isConfigured && supabase) {
        const { error } = await supabase.from("budgets").delete().eq("id", deleteTarget.id);
        if (error) {
          triggerToast(`Gagal menghapus anggaran: ${error.message}`, "error");
          return;
        }
      }
      setBudgets((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      triggerToast(`Anggaran kategori "${deleteTarget.category_name}" telah dihapus.`);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, triggerToast]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-6 space-y-6 w-full max-w-6xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { children: "Budgets" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 px-3 py-1 rounded-full bg-[#2F7E79]/10 text-[#2F7E79] dark:text-teal-400 border border-[#2F7E79]/20 text-xs font-bold font-sans", children: [
            /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) }),
            MONTH_NAMES[activeMonth - 1],
            " ",
            activeYear
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: "Tetapkan batas kuota pengeluaran taktis bulanan per kategori untuk menjaga kesehatan arus kas Anda." })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            setEditingBudget(null);
            setAddEditOpen(true);
          },
          className: "flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-xs font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 whitespace-nowrap cursor-pointer",
          children: [
            /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4v16m8-8H4" }) }),
            "Set Anggaran"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-5 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Total Anggaran" }),
          /* @__PURE__ */ jsx("p", { className: "text-xl font-extrabold text-foreground tabular-nums leading-none", children: formatIDR(totalBudgeted) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-5 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Total Pengeluaran" }),
          /* @__PURE__ */ jsx("p", { className: "text-xl font-extrabold text-foreground tabular-nums leading-none", children: formatIDR(totalSpent) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" }) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `p-5 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center justify-between`, children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Sisa Anggaran" }),
          /* @__PURE__ */ jsx("p", { className: `text-xl font-extrabold tabular-nums leading-none ${remainingBudget >= 0 ? "text-foreground" : "text-rose-500"}`, children: formatIDR(remainingBudget) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: `h-10 w-10 rounded-2xl flex items-center justify-center border ${remainingBudget >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"}`, children: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-foreground mb-4", children: "Rincian Anggaran Kategori" }),
      budgets.length === 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-3xl border border-border/80 bg-card p-12 text-center shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-2xl bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-muted-foreground", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" }) }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm text-foreground", children: "Belum ada anggaran yang ditetapkan" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: 'Mulailah dengan mengeklik tombol "Set Anggaran" di kanan atas.' })
        ] })
      ] }) }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: budgets.map((b) => {
        const spentPercent = b.limit_amount > 0 ? b.total_spent / b.limit_amount * 100 : 0;
        const isOver = b.total_spent > b.limit_amount;
        const overspentAmt = b.total_spent - b.limit_amount;
        let progressColorClass = "bg-emerald-500 dark:bg-emerald-400";
        let textStatusClass = "text-emerald-600 dark:text-emerald-400";
        if (spentPercent >= 70 && spentPercent <= 90) {
          progressColorClass = "bg-amber-500 dark:bg-amber-400";
          textStatusClass = "text-amber-600 dark:text-amber-400";
        } else if (spentPercent > 90) {
          progressColorClass = "bg-rose-500 dark:bg-rose-400";
          textStatusClass = "text-rose-600 dark:text-rose-400";
        }
        const dailyLimit = daysRemaining > 0 ? Math.max(0, b.limit_amount - b.total_spent) / daysRemaining : 0;
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: `group relative flex flex-col justify-between p-5 bg-card border rounded-3xl shadow-sm hover:shadow-md hover:border-border transition-all duration-200 overflow-hidden ${isOver ? "border-rose-500/30 dark:border-rose-500/20 bg-rose-500/[0.01]" : "border-border/80"}`,
            children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: `h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold border shrink-0 ${isOver ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-[#2F7E79]/10 border-[#2F7E79]/20 text-[#2F7E79] dark:text-teal-400"}`, children: "👛" }),
                    /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-foreground truncate", children: b.category_name })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => {
                          setEditingBudget(b);
                          setAddEditOpen(true);
                        },
                        className: "h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer",
                        title: "Edit anggaran",
                        children: /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" }) })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setDeleteTarget(b),
                        className: "h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer",
                        title: "Hapus anggaran",
                        children: /* @__PURE__ */ jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) })
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider", children: "Penggunaan" }),
                    /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-extrabold text-foreground tabular-nums", children: formatIDR(b.total_spent) }),
                      /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-semibold text-muted-foreground/80 tabular-nums", children: [
                        " ",
                        "/ ",
                        formatIDR(b.limit_amount)
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "w-full h-2 bg-muted/60 dark:bg-zinc-800/80 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: `h-full rounded-full transition-all duration-500 ${progressColorClass}`,
                      style: { width: `${Math.min(100, spentPercent)}%` }
                    }
                  ) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[10px] font-bold", children: [
                    /* @__PURE__ */ jsxs("span", { className: `${textStatusClass} tabular-nums`, children: [
                      Math.round(spentPercent),
                      "% terpakai"
                    ] }),
                    isOver && /* @__PURE__ */ jsxs("span", { className: "text-rose-500 animate-pulse tabular-nums", children: [
                      "Lebih ",
                      formatIDR(overspentAmt)
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-5 pt-3.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold uppercase tracking-wider", children: "Aman Harian" }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  isOver || dailyLimit <= 0 ? /* @__PURE__ */ jsx("span", { className: "font-extrabold text-rose-500", children: "Rp 0 / hari" }) : /* @__PURE__ */ jsxs("span", { className: "font-extrabold text-foreground tabular-nums", children: [
                    formatIDR(dailyLimit),
                    " ",
                    /* @__PURE__ */ jsx("span", { className: "font-normal text-muted-foreground", children: "/ hari" })
                  ] }),
                  daysRemaining > 0 ? /* @__PURE__ */ jsxs("p", { className: "text-[9px] text-muted-foreground/80 mt-0.5 font-medium", children: [
                    "(",
                    daysRemaining,
                    " hari tersisa)"
                  ] }) : /* @__PURE__ */ jsx("p", { className: "text-[9px] text-muted-foreground/80 mt-0.5 font-medium", children: "(Bulan berakhir)" })
                ] })
              ] })
            ]
          },
          b.id
        );
      }) })
    ] }),
    /* @__PURE__ */ jsx(
      AddEditBudgetDialog,
      {
        open: addEditOpen,
        onClose: () => {
          setAddEditOpen(false);
          setEditingBudget(null);
        },
        onSave: handleSaveBudget,
        editingBudget,
        categories,
        existingCategoryIds
      }
    ),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: () => setDeleteTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "bg-card border border-border/80 rounded-3xl shadow-xl", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-base font-bold", children: "Hapus Anggaran?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-sm text-muted-foreground", children: [
          "Anggaran untuk kategori ",
          /* @__PURE__ */ jsxs("span", { className: "font-semibold text-foreground", children: [
            '"',
            deleteTarget?.category_name,
            '"'
          ] }),
          " akan dihapus. Pengeluaran Anda untuk kategori ini tidak lagi dibatasi secara bulanan."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "rounded-xl h-10 text-sm bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 hover:text-foreground", children: "Batal" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: handleDeleteBudget,
            disabled: deleting,
            className: "rounded-xl h-10 text-sm bg-rose-500 hover:bg-rose-600 text-white font-semibold disabled:opacity-60",
            children: deleting ? "Menghapus..." : "Ya, Hapus Anggaran"
          }
        )
      ] })
    ] }) })
  ] });
}

const $$Budgets = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Budgets;
  const activeMonth = Number(Astro2.url.searchParams.get("month") || 6);
  const activeYear = Number(Astro2.url.searchParams.get("year") || 2026);
  let categories = [];
  let budgetsRaw = [];
  let spentMap = {};
  if (isConfigured && supabase) {
    try {
      const sDate = new Date(activeYear, activeMonth - 1, 1);
      const eDate = new Date(activeYear, activeMonth, 0, 23, 59, 59, 999);
      const [catRes, budgetRes, txRes] = await Promise.all([
        supabase.from("categories").select("id, name, type"),
        supabase.from("budgets").select("id, category_id, limit_amount, month, year").eq("month", activeMonth).eq("year", activeYear),
        supabase.from("transactions").select("category_id, amount").eq("type", "EXPENSE").gte("created_at", sDate.toISOString()).lte("created_at", eDate.toISOString())
      ]);
      if (!catRes.error && catRes.data) {
        categories = catRes.data;
      }
      if (!budgetRes.error && budgetRes.data) {
        budgetsRaw = budgetRes.data;
      }
      if (!txRes.error && txRes.data) {
        txRes.data.forEach((tx) => {
          const catId = tx.category_id;
          const amt = Number(tx.amount);
          spentMap[catId] = (spentMap[catId] || 0) + amt;
        });
      }
    } catch (err) {
      console.error("[budgets.astro] Failed to fetch data from Supabase:", err);
    }
  }
  const budgets = budgetsRaw.map((b) => {
    const cat = categories.find((c) => c.id === b.category_id);
    return {
      id: b.id,
      category_id: b.category_id,
      category_name: cat ? cat.name : "—",
      limit_amount: Number(b.limit_amount),
      total_spent: spentMap[b.category_id] || 0,
      month: b.month,
      year: b.year
    };
  });
  Astro2.response.headers.set("Cache-Control", "no-store");
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "FinGram — Budgets", "description": "Atur dan kendalikan pengeluaran bulanan Anda per kategori secara real-time." }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "BudgetManager", BudgetManager, { "client:load": true, "initialBudgets": budgets, "categories": categories, "activeMonth": activeMonth, "activeYear": activeYear, "client:component-hydration": "load", "client:component-path": "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/BudgetManager", "client:component-export": "default" })} ` })}`;
}, "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/pages/budgets.astro", void 0);

const $$file = "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/pages/budgets.astro";
const $$url = "/budgets";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Budgets,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
