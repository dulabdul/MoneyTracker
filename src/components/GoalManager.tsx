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
import DatePicker from "@/components/ui/DatePicker";
import { supabase, isConfigured } from "@/lib/supabase";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface FinancialGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  notes?: string;
  status: "active" | "achieved" | "paused";
  created_at: string;
}

interface GoalManagerProps {
  initialGoals: FinancialGoal[];
}

// ─── Validation Schemas ────────────────────────────────────────────────────────
const goalFormSchema = z.object({
  name: z.string().min(1, "Nama kantong tabungan wajib diisi"),
  target_amount: z.number().positive("Target tabungan harus lebih besar dari 0"),
  target_date: z.string().min(1, "Tanggal tenggat waktu wajib ditentukan"),
  notes: z.string().optional(),
  status: z.enum(["active", "achieved", "paused"]).default("active"),
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getDaysRemaining(dateStr: string): { days: number; text: string; isPast: boolean } {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), text: `${Math.abs(diffDays)} hari yang lalu`, isPast: true };
  } else if (diffDays === 0) {
    return { days: 0, text: "Hari ini", isPast: false };
  } else {
    return { days: diffDays, text: `${diffDays} hari lagi`, isPast: false };
  }
}

// ─── Standalone Form Components ──────────────────────────────────────────────────
interface AddEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    target_amount: number;
    target_date: string;
    notes?: string;
    status: "active" | "achieved" | "paused";
  }) => Promise<void>;
  editingGoal: FinancialGoal | null;
}

function AddEditGoalDialog({ open, onClose, onSave, editingGoal }: AddEditDialogProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState<number | undefined>(undefined);
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"active" | "achieved" | "paused">("active");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingGoal) {
        setName(editingGoal.name);
        setTargetAmount(editingGoal.target_amount);
        setTargetDate(editingGoal.target_date);
        setNotes(editingGoal.notes || "");
        setStatus(editingGoal.status);
      } else {
        setName("");
        setTargetAmount(undefined);
        // Default to 6 months from now
        const sixMonthsNow = new Date();
        sixMonthsNow.setMonth(sixMonthsNow.getMonth() + 6);
        setTargetDate(sixMonthsNow.toISOString().split("T")[0]);
        setNotes("");
        setStatus("active");
      }
      setError(null);
    }
  }, [open, editingGoal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      target_amount: targetAmount ?? 0,
      target_date: targetDate,
      notes: notes.trim() || undefined,
      status,
    };

    const parseResult = goalFormSchema.safeParse(payload);

    if (!parseResult.success) {
      setError(parseResult.error.issues[0].message);
      return;
    }

    setSaving(true);
    try {
      await onSave(parseResult.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan target tabungan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-bold text-foreground">
            {editingGoal ? "Edit Target Tabungan" : "Buat Target Tabungan Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 w-full min-w-0 overflow-hidden">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Nama Target / Kantong
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Beli Laptop Baru, Liburan Akhir Tahun"
                className="rounded-xl border-border/80 bg-background h-10 text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Nominal Target Tabungan (IDR)
              </Label>
              <CurrencyInput
                value={targetAmount}
                onChange={setTargetAmount}
                placeholder="Rp 0"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Tenggat Waktu Pencapaian
              </Label>
              <DatePicker
                value={targetDate}
                onChange={setTargetDate}
              />
            </div>

            {editingGoal && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Status Kantong
                </Label>
                 <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="rounded-xl border-border/80 bg-background h-10 text-sm font-semibold min-w-0">
                    <span className="block truncate text-left w-full min-w-0 flex-1">
                      <SelectValue placeholder="Pilih Status" />
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border/80 rounded-xl">
                    <SelectItem value="active" className="text-sm rounded-lg">Aktif</SelectItem>
                    <SelectItem value="achieved" className="text-sm rounded-lg">Tercapai (Achieved)</SelectItem>
                    <SelectItem value="paused" className="text-sm rounded-lg">Ditangguhkan (Paused)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Catatan Tambahan (Opsional)
              </Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Nabung 500rb per bulan"
                className="rounded-xl border-border/80 bg-background h-10 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          <DialogFooter className="-mx-6 -mb-5 mt-6 px-6 py-4 flex flex-col-reverse sm:flex-row bg-muted/30 dark:bg-muted/10 border-t border-border/40 rounded-b-3xl gap-2.5 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-sm font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-sm font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Menyimpan..." : "Simpan Target"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main GoalManager Component ──────────────────────────────────────────────
export default function GoalManager({ initialGoals }: GoalManagerProps) {
  const [goals, setGoals] = useState<FinancialGoal[]>(initialGoals);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "achieved" | "paused">("all");
  const [sortBy, setSortBy] = useState<"date" | "target" | "progress" | "created">("date");
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinancialGoal | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sync with initialGoals
  useEffect(() => {
    setGoals(initialGoals);
  }, [initialGoals]);

  const reloadData = useCallback(async () => {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("financial_goals")
          .select("*")
          .order("target_date", { ascending: true });

        if (!error && data) {
          setGoals(data.map((g: any) => ({
            id: g.id,
            name: g.name,
            target_amount: Number(g.target_amount),
            current_amount: Number(g.current_amount),
            target_date: g.target_date,
            status: g.status as "active" | "achieved" | "paused",
            notes: g.notes || "",
            created_at: g.created_at,
          })));
        }
      } catch (err) {
        console.error("Failed to refetch goals data:", err);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("refresh-data", reloadData);
    return () => window.removeEventListener("refresh-data", reloadData);
  }, [reloadData]);

  // Trigger toast
  const triggerToast = useCallback((message: string, type: "success" | "error" = "success") => {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message, type },
      })
    );
  }, []);

  // Compute stats
  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.current_amount, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.target_amount, 0), [goals]);
  const globalProgress = useMemo(() => {
    return totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
  }, [totalSaved, totalTarget]);

  // Filter and sort goals
  const processedGoals = useMemo(() => {
    let result = [...goals];

    // Filter
    if (filterStatus !== "all") {
      result = result.filter((g) => g.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
      }
      if (sortBy === "target") {
        return b.target_amount - a.target_amount;
      }
      if (sortBy === "progress") {
        const pctA = a.target_amount > 0 ? a.current_amount / a.target_amount : 0;
        const pctB = b.target_amount > 0 ? b.current_amount / b.target_amount : 0;
        return b.current_amount - a.current_amount; // fallback or sort by percentage
      }
      // Created
      return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
    });

    return result;
  }, [goals, filterStatus, sortBy]);

  // CRUD: Create/Update
  const handleSaveGoal = useCallback(
    async (formData: {
      name: string;
      target_amount: number;
      target_date: string;
      notes?: string;
      status: "active" | "achieved" | "paused";
    }) => {
      if (editingGoal) {
        // Edit Action
        if (isConfigured && supabase) {
          const { error } = await supabase
            .from("financial_goals")
            .update({
              name: formData.name,
              target_amount: formData.target_amount,
              target_date: formData.target_date,
              notes: formData.notes || null,
              status: formData.status,
            })
            .eq("id", editingGoal.id);

          if (error) {
            triggerToast(`Gagal mengedit target tabungan: ${error.message}`, "error");
            throw error;
          }
        }

        setGoals((prev) =>
          prev.map((g) =>
            g.id === editingGoal.id
              ? {
                  ...g,
                  name: formData.name,
                  target_amount: formData.target_amount,
                  target_date: formData.target_date,
                  notes: formData.notes,
                  status: formData.status,
                }
              : g
          )
        );
        triggerToast(`Target tabungan "${formData.name}" berhasil diperbarui.`);
      } else {
        // Create Action
        let insertedId = "g_" + Math.random().toString(36).substring(2, 9);
        const createdAt = new Date().toISOString();

        if (isConfigured && supabase) {
          const { data, error } = await supabase
            .from("financial_goals")
            .insert({
              name: formData.name,
              target_amount: formData.target_amount,
              target_date: formData.target_date,
              notes: formData.notes || null,
              status: formData.status,
              current_amount: 0.00,
            })
            .select()
            .single();

          if (error) {
            triggerToast(`Gagal membuat target tabungan: ${error.message}`, "error");
            throw error;
          }
          insertedId = data.id;
        }

        const newGoal: FinancialGoal = {
          id: insertedId,
          name: formData.name,
          target_amount: formData.target_amount,
          current_amount: 0,
          target_date: formData.target_date,
          notes: formData.notes,
          status: formData.status,
          created_at: createdAt,
        };

        setGoals((prev) => [newGoal, ...prev]);
        triggerToast(`Kantong tabungan "${formData.name}" berhasil dibuat.`);
      }
      window.dispatchEvent(new CustomEvent("refresh-data"));
    },
    [editingGoal, triggerToast]
  );

  // CRUD: Delete
  const handleDeleteGoal = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (isConfigured && supabase) {
        const { error } = await supabase
          .from("financial_goals")
          .delete()
          .eq("id", deleteTarget.id);

        if (error) {
          triggerToast(`Gagal menghapus target tabungan: ${error.message}`, "error");
          return;
        }
      }

      setGoals((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      triggerToast(`Kantong tabungan "${deleteTarget.name}" telah dihapus.`);
      window.dispatchEvent(new CustomEvent("refresh-data"));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, triggerToast]);

  return (
    <div className="p-4 md:p-6 space-y-6 w-full max-w-6xl mx-auto pb-28 md:pb-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <span>Financial Goals</span>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#2F7E79]/10 text-[#2F7E79] dark:text-teal-400 border border-[#2F7E79]/20 text-xs font-bold font-sans">
              🎯 Kantong Tabungan
            </div>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola pos alokasi tabungan, rencanakan pembelian barang impian, dan pantau kemajuan target Anda.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setAddEditOpen(true);
          }}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-xs font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Kantong Baru
        </button>
      </div>

      {/* ── Summary Stats Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Saved */}
        <div class="p-5 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Dana Terkumpul</span>
            <p className="text-xl font-extrabold text-foreground tabular-nums leading-none">{formatIDR(totalSaved)}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Card 2: Total Target */}
        <div class="p-5 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Akumulasi Target</span>
            <p className="text-xl font-extrabold text-foreground tabular-nums leading-none">{formatIDR(totalTarget)}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-[#2F7E79]/10 text-[#2F7E79] dark:text-teal-400 border border-[#2F7E79]/20 flex items-center justify-center">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
        </div>

        {/* Card 3: Global Progress */}
        <div class="p-5 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Global Progress</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-xl font-extrabold text-foreground tabular-nums leading-none">{globalProgress}%</p>
              <span className="text-[10px] text-muted-foreground font-semibold">dari total target</span>
            </div>
            <div className="h-1.5 w-full bg-muted/60 dark:bg-zinc-800/80 rounded-full overflow-hidden mt-2 max-w-[200px]">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Filters & Sorting Controls ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card border border-border/80 p-3 rounded-2xl shadow-sm">
        {/* Status Filters */}
        <div className="flex flex-wrap bg-muted/60 p-0.5 rounded-xl border border-border/40 select-none flex-1">
          <button
            onClick={() => setFilterStatus("all")}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "all"
                ? "text-primary-foreground bg-[#2F7E79] dark:bg-teal-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua ({goals.length})
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "active"
                ? "text-primary-foreground bg-[#2F7E79] dark:bg-teal-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Aktif ({goals.filter((g) => g.status === "active").length})
          </button>
          <button
            onClick={() => setFilterStatus("achieved")}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "achieved"
                ? "text-primary-foreground bg-[#2F7E79] dark:bg-teal-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tercapai ({goals.filter((g) => g.status === "achieved").length})
          </button>
          <button
            onClick={() => setFilterStatus("paused")}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "paused"
                ? "text-primary-foreground bg-[#2F7E79] dark:bg-teal-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ditunda ({goals.filter((g) => g.status === "paused").length})
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-semibold whitespace-nowrap">Urutkan:</span>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="rounded-xl border-border/80 bg-background h-9 text-xs font-bold w-[140px] shadow-sm">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border/80 rounded-xl">
              <SelectItem value="date" className="text-xs rounded-lg">Tenggat Terdekat</SelectItem>
              <SelectItem value="target" className="text-xs rounded-lg">Target Terbesar</SelectItem>
              <SelectItem value="progress" className="text-xs rounded-lg">Alokasi Terbanyak</SelectItem>
              <SelectItem value="created" className="text-xs rounded-lg">Baru Dibuat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Goals Grid Card ────────────────────────────────────────────── */}
      <div>
        {processedGoals.length === 0 ? (
          <div className="rounded-3xl border border-border/80 bg-card p-16 text-center shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Tidak ada target tabungan ditemukan</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mulai dengan membuat target baru untuk mewujudkan rencana keuangan Anda.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {processedGoals.map((goal) => {
              const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;
              const isAchieved = goal.status === "achieved" || goal.current_amount >= goal.target_amount;
              const isPaused = goal.status === "paused";
              const dateInfo = getDaysRemaining(goal.target_date);

              // Colors based on status
              let progressColorClass = "bg-gradient-to-r from-teal-500 to-emerald-500";
              let badgeClass = "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
              let badgeText = "Aktif";

              if (isPaused) {
                progressColorClass = "bg-zinc-400 dark:bg-zinc-600";
                badgeClass = "bg-zinc-500/10 dark:bg-zinc-500/20 text-zinc-600 dark:text-zinc-400";
                badgeText = "Ditunda";
              } else if (isAchieved) {
                progressColorClass = "bg-gradient-to-r from-amber-500 to-yellow-500";
                badgeClass = "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400";
                badgeText = "Tercapai";
              }

              return (
                <div
                  key={goal.id}
                  className={`group relative flex flex-col justify-between p-5 bg-card border rounded-3xl shadow-sm hover:shadow-md hover:border-border transition-all duration-200 overflow-hidden ${
                    isAchieved ? "border-amber-500/30 dark:border-amber-500/20 bg-amber-500/[0.01]" : "border-border/80"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top: Status & Actions */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeClass}`}>
                        {badgeText}
                      </span>

                      {/* Hover Edit / Delete tools */}
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingGoal(goal);
                            setAddEditOpen(true);
                          }}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                          title="Edit target"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(goal)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Hapus target"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Mid: Title & Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        <h4 className="font-extrabold text-base text-foreground leading-tight line-clamp-1">{goal.name}</h4>
                      </div>
                      
                      {goal.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 pl-7 font-medium">
                          {goal.notes}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar & Numbers */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Pencapaian</span>
                        <span className={`text-[11px] font-black ${isAchieved ? "text-amber-500" : "text-emerald-500"}`}>{pct}%</span>
                      </div>
                      
                      <div className="w-full h-2 bg-muted/60 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progressColorClass}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] font-bold text-foreground/90 tabular-nums">
                        <span>{formatIDR(goal.current_amount)}</span>
                        <span className="text-muted-foreground/80 font-semibold">Target: {formatIDR(goal.target_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Date remaining & Quick Save Deposit action */}
                  <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Tenggat Waktu</span>
                      <span className={`text-[10px] font-bold block ${dateInfo.isPast && !isAchieved ? "text-rose-500" : "text-foreground"}`}>
                        {formatDate(goal.target_date)}
                      </span>
                      <span className={`text-[9px] block font-semibold ${dateInfo.isPast && !isAchieved ? "text-rose-500/80" : "text-muted-foreground/80"}`}>
                        ({dateInfo.text})
                      </span>
                    </div>

                    {!isAchieved && !isPaused && (
                      <a
                        href={`/transfers?action=new&goal_id=${goal.id}`}
                        className="flex items-center gap-1 h-8 px-3 rounded-lg bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-[10px] font-black tracking-wide uppercase shadow-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer decoration-none"
                      >
                        + Isi Kantong
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add/Edit Dialog ────────────────────────────────────────────── */}
      <AddEditGoalDialog
        open={addEditOpen}
        onClose={() => {
          setAddEditOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        editingGoal={editingGoal}
      />

      {/* ── Delete Confirmation Dialog ─────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border border-border/80 rounded-3xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Hapus Kantong Tabungan?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Apakah Anda yakin ingin menghapus kantong tabungan <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
              Semua alokasi saldo target ini akan dilepas (namun saldo rekening asal tidak berubah).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl h-10 text-sm bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 hover:text-foreground">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGoal}
              disabled={deleting}
              className="rounded-xl h-10 text-sm bg-rose-500 hover:bg-rose-600 text-white font-semibold disabled:opacity-60"
            >
              {deleting ? "Menghapus..." : "Ya, Hapus Target"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
