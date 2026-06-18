import { useState, useCallback, useMemo, useEffect } from "react";
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

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface BudgetRow {
  id: string;
  category_id: string;
  category_name: string;
  limit_amount: number;
  total_spent: number;
  month: number;
  year: number;
}

export interface Category {
  id: string;
  name: string;
  type: string;
}

interface BudgetManagerProps {
  initialBudgets: BudgetRow[];
  categories: Category[];
  activeMonth: number;
  activeYear: number;
}

// ─── Validation Schemas ────────────────────────────────────────────────────────
const budgetFormSchema = z.object({
  category_id: z.string().min(1, "Kategori wajib dipilih"),
  limit_amount: z.number().positive("Batas anggaran harus lebih besar dari 0"),
});

// ─── Formatters & Date Helpers ──────────────────────────────────────────────────
function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function getDaysRemaining(year: number, month: number): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const totalDays = new Date(year, month, 0).getDate();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 0; // Past month
  }
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    return totalDays; // Future month
  }
  // Current month
  const currentDay = today.getDate();
  return Math.max(1, totalDays - currentDay + 1);
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// ─── Standalone Form Components (Module Level) ───────────────────────────────────

interface AddEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { category_id: string; limit_amount: number }) => Promise<void>;
  editingBudget: BudgetRow | null;
  categories: Category[];
  existingCategoryIds: string[];
}

function AddEditBudgetDialog({
  open,
  onClose,
  onSave,
  editingBudget,
  categories,
  existingCategoryIds,
}: AddEditDialogProps) {
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingBudget) {
        setCategoryId(editingBudget.category_id);
        setLimitAmount(editingBudget.limit_amount);
      } else {
        setCategoryId("");
        setLimitAmount(undefined);
      }
      setError(null);
    }
  }, [open, editingBudget]);

  // Filter categories to only EXPENSE, and if adding new, exclude categories that already have a budget
  const availableCategories = useMemo(() => {
    const expenseOnly = categories.filter((c) => c.type === "EXPENSE");
    if (editingBudget) {
      return expenseOnly.filter((c) => c.id === editingBudget.category_id);
    }
    return expenseOnly.filter((c) => !existingCategoryIds.includes(c.id));
  }, [categories, existingCategoryIds, editingBudget]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parseResult = budgetFormSchema.safeParse({
      category_id: categoryId,
      limit_amount: limitAmount ?? 0,
    });

    if (!parseResult.success) {
      setError(parseResult.error.issues[0].message);
      return;
    }

    setSaving(true);
    try {
      await onSave(parseResult.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan anggaran.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-bold text-foreground">
            {editingBudget ? "Edit Batas Anggaran" : "Set Anggaran Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Kategori Pengeluaran
              </Label>
              {editingBudget ? (
                <div className="h-10 px-3 rounded-xl border border-border/60 bg-muted/30 flex items-center text-sm font-semibold text-foreground/80">
                  {editingBudget.category_name}
                </div>
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="rounded-xl border-border/80 bg-background h-10 text-sm">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border/80 rounded-xl">
                    {availableCategories.length === 0 ? (
                      <div className="p-3 text-xs text-center text-muted-foreground">
                        Semua kategori pengeluaran sudah memiliki anggaran.
                      </div>
                    ) : (
                      availableCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-sm rounded-lg">
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Batas Anggaran Bulanan (IDR)
              </Label>
              <CurrencyInput
                value={limitAmount}
                onChange={setLimitAmount}
                placeholder="Rp 0"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          <DialogFooter className="gap-2 pt-3 border-t border-border/40 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-sm font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || (!editingBudget && availableCategories.length === 0)}
              className="px-6 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-sm font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Menyimpan..." : editingBudget ? "Simpan Perubahan" : "Tetapkan Anggaran"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main BudgetManager Component ──────────────────────────────────────────────
export default function BudgetManager({
  initialBudgets,
  categories,
  activeMonth,
  activeYear,
}: BudgetManagerProps) {
  const [budgets, setBudgets] = useState<BudgetRow[]>(initialBudgets);
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Synchronize with server if initialBudgets updates
  useEffect(() => {
    setBudgets(initialBudgets);
  }, [initialBudgets]);

  const reloadData = useCallback(async () => {
    if (isConfigured && supabase) {
      try {
        const sDate = new Date(activeYear, activeMonth - 1, 1);
        const eDate = new Date(activeYear, activeMonth, 0, 23, 59, 59, 999);

        const [budgetRes, txRes] = await Promise.all([
          supabase
            .from("budgets")
            .select("id, category_id, limit_amount, month, year")
            .eq("month", activeMonth)
            .eq("year", activeYear),
          supabase
            .from("transactions")
            .select("category_id, amount")
            .eq("type", "EXPENSE")
            .gte("created_at", sDate.toISOString())
            .lte("created_at", eDate.toISOString())
        ]);

        const spentMap: Record<string, number> = {};
        if (txRes.data) {
          txRes.data.forEach((tx: any) => {
            const catId = tx.category_id;
            const amt = Number(tx.amount);
            spentMap[catId] = (spentMap[catId] || 0) + amt;
          });
        }

        if (budgetRes.data) {
          const freshBudgets = budgetRes.data.map((b) => {
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
          setBudgets(freshBudgets);
        }
      } catch (err) {
        console.error("Failed to refetch budget data:", err);
      }
    }
  }, [activeYear, activeMonth, categories]);

  useEffect(() => {
    window.addEventListener("refresh-data", reloadData);
    return () => window.removeEventListener("refresh-data", reloadData);
  }, [reloadData]);

  // Trigger custom toast notification
  const triggerToast = useCallback((message: string, type: "success" | "error" = "success") => {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message, type },
      })
    );
  }, []);

  // Compute stats
  const totalBudgeted = useMemo(() => budgets.reduce((s, b) => s + b.limit_amount, 0), [budgets]);
  const totalSpent = useMemo(() => budgets.reduce((s, b) => s + b.total_spent, 0), [budgets]);
  const remainingBudget = totalBudgeted - totalSpent;
  const daysRemaining = useMemo(() => getDaysRemaining(activeYear, activeMonth), [activeYear, activeMonth]);

  // Collect budget category IDs to block duplicates in Select dropdown
  const existingCategoryIds = useMemo(() => budgets.map((b) => b.category_id), [budgets]);

  // Helper to fetch the spent amount of a category during runtime insertions
  const getSpentForCategory = useCallback(async (categoryId: string): Promise<number> => {
    if (!isConfigured || !supabase) return 0;
    try {
      const sDate = new Date(activeYear, activeMonth - 1, 1);
      const eDate = new Date(activeYear, activeMonth, 0, 23, 59, 59, 999);
      const { data, error } = await supabase
        .from("transactions")
        .select("amount")
        .eq("category_id", categoryId)
        .eq("type", "EXPENSE")
        .gte("created_at", sDate.toISOString())
        .lte("created_at", eDate.toISOString());

      if (error || !data) return 0;
      return data.reduce((s, t) => s + Number(t.amount), 0);
    } catch {
      return 0;
    }
  }, [activeMonth, activeYear]);

  // CRUD Handler: Create or Update
  const handleSaveBudget = useCallback(
    async (formData: { category_id: string; limit_amount: number }) => {
      const categoryName = categories.find((c) => c.id === formData.category_id)?.name ?? "Kategori";

      if (editingBudget) {
        // Edit Action
        if (isConfigured && supabase) {
          const { error } = await supabase
            .from("budgets")
            .update({ limit_amount: formData.limit_amount })
            .eq("id", editingBudget.id);

          if (error) {
            triggerToast(`Gagal mengedit anggaran: ${error.message}`, "error");
            throw error;
          }
        }

        setBudgets((prev) =>
          prev.map((b) =>
            b.id === editingBudget.id ? { ...b, limit_amount: formData.limit_amount } : b
          )
        );
        triggerToast(`Anggaran kategori "${categoryName}" berhasil diperbarui.`);
      } else {
        // Create Action
        const currentSpent = await getSpentForCategory(formData.category_id);
        let insertedId = "b_" + Math.random().toString(36).substring(2, 9);

        if (isConfigured && supabase) {
          const { data, error } = await supabase
            .from("budgets")
            .insert({
              category_id: formData.category_id,
              limit_amount: formData.limit_amount,
              month: activeMonth,
              year: activeYear,
            })
            .select()
            .single();

          if (error) {
            triggerToast(`Gagal membuat anggaran: ${error.message}`, "error");
            throw error;
          }
          insertedId = data.id;
        }

        const newBudget: BudgetRow = {
          id: insertedId,
          category_id: formData.category_id,
          category_name: categoryName,
          limit_amount: formData.limit_amount,
          total_spent: currentSpent,
          month: activeMonth,
          year: activeYear,
        };

        setBudgets((prev) => [newBudget, ...prev]);
        triggerToast(`Anggaran untuk "${categoryName}" berhasil ditetapkan.`);
      }
      window.dispatchEvent(new CustomEvent("refresh-data"));
    },
    [editingBudget, categories, activeMonth, activeYear, getSpentForCategory, triggerToast]
  );

  // CRUD Handler: Delete
  const handleDeleteBudget = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (isConfigured && supabase) {
        const { error } = await supabase
          .from("budgets")
          .delete()
          .eq("id", deleteTarget.id);

        if (error) {
          triggerToast(`Gagal menghapus anggaran: ${error.message}`, "error");
          return;
        }
      }

      setBudgets((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      triggerToast(`Anggaran kategori "${deleteTarget.category_name}" telah dihapus.`);
      window.dispatchEvent(new CustomEvent("refresh-data"));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, triggerToast]);

  return (
    <div className="p-4 md:p-6 space-y-6 w-full max-w-6xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <span>Budgets</span>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#2F7E79]/10 text-[#2F7E79] dark:text-teal-400 border border-[#2F7E79]/20 text-xs font-bold font-sans">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {MONTH_NAMES[activeMonth - 1]} {activeYear}
            </div>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tetapkan batas kuota pengeluaran taktis bulanan per kategori untuk menjaga kesehatan arus kas Anda.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBudget(null);
            setAddEditOpen(true);
          }}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-xs font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Set Anggaran
        </button>
      </div>

      {/* ── 3 Top Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Budget */}
        <div className="p-5 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Anggaran</span>
            <p className="text-xl font-extrabold text-foreground tabular-nums leading-none">{formatIDR(totalBudgeted)}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Card 2: Total Spent */}
        <div className="p-5 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Pengeluaran</span>
            <p className="text-xl font-extrabold text-foreground tabular-nums leading-none">{formatIDR(totalSpent)}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Card 3: Remaining */}
        <div className={`p-5 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center justify-between`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sisa Anggaran</span>
            <p className={`text-xl font-extrabold tabular-nums leading-none ${remainingBudget >= 0 ? "text-foreground" : "text-rose-500"}`}>
              {formatIDR(remainingBudget)}
            </p>
          </div>
          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border ${
            remainingBudget >= 0 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          }`}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Category Budgets List ────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-bold text-foreground mb-4">Rincian Anggaran Kategori</h3>

        {budgets.length === 0 ? (
          <div className="rounded-3xl border border-border/80 bg-card p-12 text-center shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Belum ada anggaran yang ditetapkan</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mulailah dengan mengeklik tombol "Set Anggaran" di kanan atas.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const spentPercent = b.limit_amount > 0 ? (b.total_spent / b.limit_amount) * 100 : 0;
              const isOver = b.total_spent > b.limit_amount;
              const overspentAmt = b.total_spent - b.limit_amount;

              // Progress Bar Color Logic
              let progressColorClass = "bg-emerald-500 dark:bg-emerald-400";
              let textStatusClass = "text-emerald-600 dark:text-emerald-400";
              if (spentPercent >= 70 && spentPercent <= 90) {
                progressColorClass = "bg-amber-500 dark:bg-amber-400";
                textStatusClass = "text-amber-600 dark:text-amber-400";
              } else if (spentPercent > 90) {
                progressColorClass = "bg-rose-500 dark:bg-rose-400";
                textStatusClass = "text-rose-600 dark:text-rose-400";
              }

              // Daily Safe-to-Spend Calculation
              // If it is in the past, daysRemaining is 0.
              const dailyLimit = daysRemaining > 0 ? Math.max(0, b.limit_amount - b.total_spent) / daysRemaining : 0;

              return (
                <div
                  key={b.id}
                  className={`group relative flex flex-col justify-between p-5 bg-card border rounded-3xl shadow-sm hover:shadow-md hover:border-border transition-all duration-200 overflow-hidden ${
                    isOver ? "border-rose-500/30 dark:border-rose-500/20 bg-rose-500/[0.01]" : "border-border/80"
                  }`}
                >
                  <div>
                    {/* Card Top: Title & Quick actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold border shrink-0 ${
                          isOver 
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-500" 
                            : "bg-[#2F7E79]/10 border-[#2F7E79]/20 text-[#2F7E79] dark:text-teal-400"
                        }`}>
                          👛
                        </div>
                        <span className="font-bold text-sm text-foreground truncate">{b.category_name}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingBudget(b);
                            setAddEditOpen(true);
                          }}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                          title="Edit anggaran"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(b)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Hapus anggaran"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="mt-4 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Penggunaan
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-foreground tabular-nums">
                            {formatIDR(b.total_spent)}
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground/80 tabular-nums">
                            {" "}/ {formatIDR(b.limit_amount)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar Container */}
                      <div className="w-full h-2 bg-muted/60 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progressColorClass}`}
                          style={{ width: `${Math.min(100, spentPercent)}%` }}
                        />
                      </div>

                      {/* Progress Label / Overspent warn */}
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className={`${textStatusClass} tabular-nums`}>
                          {Math.round(spentPercent)}% terpakai
                        </span>
                        {isOver && (
                          <span className="text-rose-500 animate-pulse tabular-nums">
                            Lebih {formatIDR(overspentAmt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Safe to spend indicator */}
                  <div className="mt-5 pt-3.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider">Aman Harian</span>
                    <div className="text-right">
                      {isOver || dailyLimit <= 0 ? (
                        <span className="font-extrabold text-rose-500">Rp 0 / hari</span>
                      ) : (
                        <span className="font-extrabold text-foreground tabular-nums">
                          {formatIDR(dailyLimit)} <span className="font-normal text-muted-foreground">/ hari</span>
                        </span>
                      )}
                      {daysRemaining > 0 ? (
                        <p className="text-[9px] text-muted-foreground/80 mt-0.5 font-medium">
                          ({daysRemaining} hari tersisa)
                        </p>
                      ) : (
                        <p className="text-[9px] text-muted-foreground/80 mt-0.5 font-medium">
                          (Bulan berakhir)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add/Edit Dialog ────────────────────────────────────────────── */}
      <AddEditBudgetDialog
        open={addEditOpen}
        onClose={() => {
          setAddEditOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        editingBudget={editingBudget}
        categories={categories}
        existingCategoryIds={existingCategoryIds}
      />

      {/* ── Delete Confirm AlertDialog ─────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border border-border/80 rounded-3xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Hapus Anggaran?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Anggaran untuk kategori <span className="font-semibold text-foreground">"{deleteTarget?.category_name}"</span> akan dihapus. Pengeluaran Anda untuk kategori ini tidak lagi dibatasi secara bulanan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl h-10 text-sm bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 hover:text-foreground">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBudget}
              disabled={deleting}
              className="rounded-xl h-10 text-sm bg-rose-500 hover:bg-rose-600 text-white font-semibold disabled:opacity-60"
            >
              {deleting ? "Menghapus..." : "Ya, Hapus Anggaran"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
