import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { createBrowserScopedClient, isConfigured, adjustWalletBalance, getTransactionDelta } from "@/lib/supabase";
const supabase = createBrowserScopedClient();
import type { TransactionRow, Wallet, Category, TransactionType } from "@/lib/supabase";
import FilterControls from "./FilterControls";
import DatePicker from "@/components/ui/DatePicker";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

// ─── Validation Schema ────────────────────────────────────────────────────────
export const txSchema = z.object({
  description: z.string().min(1, "Deskripsi tidak boleh kosong"),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  type: z.enum(["INCOME", "EXPENSE", "INVESTMENT_BUY", "INVESTMENT_SELL"]),
  wallet_id: z.string().min(1, "Pilih akun"),
  category_id: z.string().min(1, "Pilih kategori"),
  created_at: z.string().optional(),
});

export type TxFormData = z.infer<typeof txSchema>;

// ─── Mock Fallback Data ───────────────────────────────────────────────────────
const MOCK_WALLETS: Wallet[] = [];
const MOCK_CATEGORIES: Category[] = [];
const MOCK_TRANSACTIONS: TransactionRow[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatIDR(amount: number) {
  return "Rp " + new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(dateStr));
}

function getTypeBadge(type: TransactionType) {
  const map: Record<TransactionType, { label: string; cls: string }> = {
    INCOME: { label: "Pemasukan", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
    EXPENSE: { label: "Pengeluaran", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
    INVESTMENT_BUY: { label: "Invest. Beli", cls: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
    INVESTMENT_SELL: { label: "Invest. Jual", cls: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20" },
  };
  const { label, cls } = map[type];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

function getAmountDisplay(amount: number, type: TransactionType) {
  const isPositive = type === "INCOME" || type === "INVESTMENT_SELL";
  return (
    <span className={`font-bold tabular-nums text-sm ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
      {isPositive ? "+" : "-"}{formatIDR(amount)}
    </span>
  );
}

// ─── Pagination Component ─────────────────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  totalItems: number;
  pageSize: number;
}) {
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const pages: (number | "...")[] = [];
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

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/10">
      <p className="text-xs text-muted-foreground hidden sm:block">
        Menampilkan <span className="font-semibold text-foreground">{start}–{end}</span> dari <span className="font-semibold text-foreground">{totalItems}</span> transaksi
      </p>
      <p className="text-xs text-muted-foreground sm:hidden">{start}–{end} / {totalItems}</p>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs"
          aria-label="Previous page"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page Numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="h-7 w-7 flex items-center justify-center text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`h-7 min-w-[28px] px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${page === p
                  ? "bg-[#1B5C58] dark:bg-[#2F7E79] text-white shadow-sm"
                  : "border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs"
          aria-label="Next page"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Form Field wrapper ────────────────────────────────────────────────────────
function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>}
    </div>
  );
}

// ─── Form Dialog ──────────────────────────────────────────────────────────────
export function TxFormDialog({
  open,
  onClose,
  onSave,
  wallets,
  categories,
  initial,
  onCategoryCreated,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: TxFormData) => Promise<void>;
  wallets: Wallet[];
  categories: Category[];
  initial?: Partial<TxFormData>;
  onCategoryCreated?: (category: Category) => void;
}) {
  const [form, setForm] = useState<Partial<TxFormData>>({
    description: "",
    amount: undefined,
    type: "INCOME",
    wallet_id: "",
    category_id: "",
    created_at: new Date().toISOString(),
    ...initial,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TxFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  // Local state for categories to allow inline additions
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategoryError, setAddingCategoryError] = useState<string | null>(null);
  const [isAddingCategoryLoading, setIsAddingCategoryLoading] = useState(false);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setForm({
        description: initial?.description ?? "",
        amount: initial?.amount ?? undefined,
        type: initial?.type ?? "INCOME",
        wallet_id: initial?.wallet_id ?? "",
        category_id: initial?.category_id ?? "",
        created_at: initial?.created_at ?? new Date().toISOString(),
      });
      setErrors({});
      setIsAddingCategory(false);
      setNewCategoryName("");
      setAddingCategoryError(null);
    }
  }, [open, initial]);

  async function handleCreateCategoryInline() {
    const name = newCategoryName.trim();
    if (!name) {
      setAddingCategoryError("Nama kategori tidak boleh kosong");
      return;
    }
    setAddingCategoryError(null);
    setIsAddingCategoryLoading(true);

    try {
      if (isConfigured && supabase) {
        const { data, error } = await supabase
          .from("categories")
          .insert({
            name: name,
            type: form.type || "EXPENSE",
          })
          .select("id, name, type")
          .single();

        if (error) throw error;
        if (data) {
          const newCat = data as Category;
          setLocalCategories((prev) => [...prev, newCat]);
          setForm((prev) => ({ ...prev, category_id: newCat.id }));
          if (onCategoryCreated) {
            onCategoryCreated(newCat);
          }
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: { message: `Kategori "${newCat.name}" berhasil dibuat`, type: "success" },
            })
          );
          setIsAddingCategory(false);
          setNewCategoryName("");
        }
      } else {
        // Demo mode fallback
        const mockId = "c_mock_" + Math.random().toString(36).substring(2, 9);
        const mockCat: Category = {
          id: mockId,
          name: name,
          type: form.type || "EXPENSE",
        };
        setLocalCategories((prev) => [...prev, mockCat]);
        setForm((prev) => ({ ...prev, category_id: mockId }));
        if (onCategoryCreated) {
          onCategoryCreated(mockCat);
        }
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: `[Demo] Kategori "${mockCat.name}" berhasil dibuat`, type: "success" },
          })
        );
        setIsAddingCategory(false);
        setNewCategoryName("");
      }
    } catch (err: any) {
      setAddingCategoryError(err.message || "Gagal membuat kategori");
    } finally {
      setIsAddingCategoryLoading(false);
    }
  }

  const filteredCategories = useMemo(
    () => localCategories.filter((c) => !form.type || c.type === form.type),
    [localCategories, form.type]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = txSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof TxFormData] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    await onSave(result.data);
    setSaving(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-visible">
        {/* Modal Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-bold text-foreground">
            {initial?.description ? "Edit Transaksi" : "Tambah Transaksi Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Type + Wallet side by side */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Jenis" error={errors.type}>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((p) => ({ ...p, type: v as TransactionType, category_id: "" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Pemasukan</SelectItem>
                  <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                  <SelectItem value="INVESTMENT_BUY">Investasi Beli</SelectItem>
                  <SelectItem value="INVESTMENT_SELL">Investasi Jual</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Akun" error={errors.wallet_id}>
              <Select value={form.wallet_id ?? ""} onValueChange={(v) => setForm((p) => ({ ...p, wallet_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Description */}
          <FormField label="Deskripsi" error={errors.description}>
            <Input
              value={form.description ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Contoh: Gaji Bulan Juni"
              className="rounded-xl border-border/80 bg-background h-10 text-sm"
            />
          </FormField>

          {/* Date Picker */}
          <FormField label="Tanggal Transaksi" error={errors.created_at}>
            <DatePicker
              value={form.created_at ? form.created_at.slice(0, 10) : ""}
              onChange={(val) => {
                const oldTime = form.created_at ? form.created_at.slice(11, 24) : new Date().toISOString().slice(11, 24);
                setForm((p) => ({ ...p, created_at: `${val}T${oldTime}` }));
              }}
            />
          </FormField>

          {/* Amount + Category side by side */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nominal (IDR)" error={errors.amount}>
              <CurrencyInput
                value={form.amount}
                onChange={(v) => setForm((p) => ({ ...p, amount: v }))}
                placeholder="Rp 0"
              />
            </FormField>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Kategori</label>
                {!isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="text-[10px] text-[#2F7E79] dark:text-teal-400 font-bold hover:underline cursor-pointer"
                  >
                    + Kategori Baru
                  </button>
                )}
              </div>
              <Select
                value={form.category_id ?? ""}
                onValueChange={(v) => setForm((p) => ({ ...p, category_id: v }))}
                disabled={isAddingCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border/80 rounded-xl">
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-sm rounded-lg">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && !isAddingCategory && <p className="text-xs text-rose-500 font-medium mt-1">{errors.category_id}</p>}
            </div>
          </div>

          {/* New Category Inline Card Panel (Full Width) */}
          {isAddingCategory && (
            <div className="p-4 bg-muted/40 border border-border/80 rounded-2xl space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F7E79] dark:text-teal-400">Buat Kategori Baru</span>
                {addingCategoryError && <span className="text-xs text-rose-500 font-medium">{addingCategoryError}</span>}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nama kategori baru..."
                    className="rounded-xl border-border/80 bg-background h-10 text-sm pr-8"
                    disabled={isAddingCategoryLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateCategoryInline();
                      }
                    }}
                    autoFocus
                  />
                  {isAddingCategoryLoading && (
                    <span className="absolute right-2.5 top-3.5 h-3.5 w-3.5 rounded-full border-2 border-teal-500/20 border-t-teal-500 animate-spin" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCreateCategoryInline}
                  disabled={isAddingCategoryLoading}
                  className="h-10 px-4 rounded-xl bg-[#2F7E79] hover:bg-[#1B5C58] text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName("");
                    setAddingCategoryError(null);
                  }}
                  disabled={isAddingCategoryLoading}
                  className="h-10 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-xs flex items-center justify-center transition-all cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-3 border-t border-border/40 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-sm font-semibold transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-sm font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Validation Schemas for Account & Category ────────────────────────────────
const accountSchema = z.object({
  name: z.string().min(1, "Nama akun tidak boleh kosong"),
  balance: z.coerce.number(),
  account_type: z.enum(["cash", "bank", "ewallet", "paylater", "credit_card"]),
  credit_limit: z.coerce.number().min(0).optional(),
  billing_date: z.coerce.number().min(1).max(31).nullable().optional(),
  billing_month_offset: z.number().int().min(0).max(1).optional().default(0),
  due_date: z.coerce.number().min(1).max(31).nullable().optional(),
  due_month_offset: z.number().int().min(0).max(1).optional().default(0),
});

const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori tidak boleh kosong"),
  type: z.enum(["INCOME", "EXPENSE", "INVESTMENT_BUY", "INVESTMENT_SELL"]),
});

// ─── AddAccountDialog ────────────────────────────────────────────────────────
type AccountFormData = {
  name: string;
  balance: number;
  account_type: 'cash' | 'bank' | 'ewallet' | 'paylater' | 'credit_card';
  credit_limit?: number;
  billing_date?: number | null;
  billing_month_offset?: number;
  due_date?: number | null;
  due_month_offset?: number;
};

function AddAccountDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AccountFormData) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [accountType, setAccountType] = useState<AccountFormData['account_type']>("cash");
  const [creditLimit, setCreditLimit] = useState<number | undefined>(undefined);
  const [billingDate, setBillingDate] = useState("");
  const [billingMonthOffset, setBillingMonthOffset] = useState<0 | 1>(0);
  const [dueDate, setDueDate] = useState("");
  const [dueMonthOffset, setDueMonthOffset] = useState<0 | 1>(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isCreditType = accountType === "paylater" || accountType === "credit_card";

  useEffect(() => {
    if (open) {
      setName("");
      setBalance(undefined);
      setAccountType("cash");
      setCreditLimit(undefined);
      setBillingDate("");
      setBillingMonthOffset(0);
      setDueDate("");
      setDueMonthOffset(0);
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = accountSchema.safeParse({
      name,
      balance: isCreditType ? 0 : (balance ?? 0),
      account_type: accountType,
      credit_limit: isCreditType ? (creditLimit ?? 0) : 0,
      billing_date: billingDate ? parseInt(billingDate, 10) : null,
      billing_month_offset: billingMonthOffset,
      due_date: dueDate ? parseInt(dueDate, 10) : null,
      due_month_offset: dueMonthOffset,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      await onSave(result.data as AccountFormData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan akun");
    } finally {
      setSaving(false);
    }
  }

  const accountTypeOptions: { value: AccountFormData['account_type']; label: string; icon: string }[] = [
    { value: "cash", label: "Tunai", icon: "💵" },
    { value: "bank", label: "Bank", icon: "🏦" },
    { value: "ewallet", label: "E-Wallet", icon: "📱" },
    { value: "paylater", label: "PayLater", icon: "⚡" },
    { value: "credit_card", label: "Kartu Kredit", icon: "💳" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-bold text-foreground">
            Tambah Akun Baru
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Account Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Jenis Akun</Label>
            <div className="grid grid-cols-5 gap-2">
              {accountTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAccountType(opt.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-[10px] font-bold transition-all ${accountType === opt.value
                      ? "border-[#2F7E79] bg-[#2F7E79]/10 text-[#1B5C58] dark:text-teal-400 shadow-sm"
                      : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/50"
                    }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span className="leading-tight text-center">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Name */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nama Akun</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCreditType ? "Contoh: SPayLater, BCA Mastercard" : "Contoh: BCA Utama, ShopeePay"}
              className="rounded-xl border-border/80 bg-background h-10 text-sm"
              autoFocus
            />
          </div>

          {/* Balance — only for non-credit accounts */}
          {!isCreditType && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Saldo Awal (IDR)</Label>
              <CurrencyInput
                value={balance}
                onChange={setBalance}
                placeholder="Rp 0"
              />
            </div>
          )}

          {/* Credit-specific fields */}
          {isCreditType && (
            <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Konfigurasi Kredit
              </p>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Limit Kredit (IDR)</Label>
                <CurrencyInput
                  value={creditLimit}
                  onChange={setCreditLimit}
                  placeholder="Rp 0"
                />
                <p className="text-[10px] text-muted-foreground">Batas kredit maksimum yang diizinkan.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Tanggal Closing Tagihan */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tgl Closing Tagihan</Label>
                  <div className="flex gap-1.5">
                    <Input
                      type="number"
                      min={1} max={31}
                      value={billingDate}
                      onChange={(e) => setBillingDate(e.target.value)}
                      placeholder="15"
                      className="rounded-xl border-border/80 bg-background h-10 text-sm w-[70px] shrink-0"
                    />
                    <div className="flex rounded-xl border border-border/80 overflow-hidden flex-1">
                      <button
                        type="button"
                        onClick={() => setBillingMonthOffset(0)}
                        className={`flex-1 h-10 text-[10px] font-bold transition-all ${billingMonthOffset === 0
                            ? "bg-[#2F7E79] text-white"
                            : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                      >
                        Bln Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingMonthOffset(1)}
                        className={`flex-1 h-10 text-[10px] font-bold transition-all border-l border-border/80 ${billingMonthOffset === 1
                            ? "bg-[#2F7E79] text-white"
                            : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                      >
                        Bln Depan
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground">Tanggal closing tagihan setiap bulan</p>
                </div>

                {/* Jatuh Tempo */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Jatuh Tempo</Label>
                  <div className="flex gap-1.5">
                    <Input
                      type="number"
                      min={1} max={31}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      placeholder="25"
                      className="rounded-xl border-border/80 bg-background h-10 text-sm w-[70px] shrink-0"
                    />
                    <div className="flex rounded-xl border border-border/80 overflow-hidden flex-1">
                      <button
                        type="button"
                        onClick={() => setDueMonthOffset(0)}
                        className={`flex-1 h-10 text-[10px] font-bold transition-all ${dueMonthOffset === 0
                            ? "bg-rose-500 text-white"
                            : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                      >
                        Bln Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => setDueMonthOffset(1)}
                        className={`flex-1 h-10 text-[10px] font-bold transition-all border-l border-border/80 ${dueMonthOffset === 1
                            ? "bg-rose-500 text-white"
                            : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                      >
                        Bln Depan
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground">Batas akhir pembayaran tagihan</p>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground/80">
                💡 Saldo awal akun kredit dimulai dari Rp 0 (tidak ada tagihan). Tagihan bertambah saat Anda mencatat pengeluaran menggunakan akun ini.
              </p>
            </div>
          )}

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          <DialogFooter className="gap-2 pt-3 border-t border-border/40 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-sm font-semibold transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-sm font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Akun"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── AddCategoryDialog ───────────────────────────────────────────────────────
function AddCategoryDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; type: TransactionType }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setType("EXPENSE");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
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
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan kategori");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-bold text-foreground">
            Tambah Kategori Baru
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nama Kategori</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Makanan, Transportasi, Gaji"
                className="rounded-xl border-border/80 bg-background h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Jenis Transaksi</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as TransactionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Pemasukan</SelectItem>
                  <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                  <SelectItem value="INVESTMENT_BUY">Investasi Beli</SelectItem>
                  <SelectItem value="INVESTMENT_SELL">Investasi Jual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          <DialogFooter className="gap-2 pt-3 border-t border-border/40 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-sm font-semibold transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-sm font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Kategori"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main LedgerManager ───────────────────────────────────────────────────────
interface LedgerManagerProps {
  initialTransactions: TransactionRow[];
  initialWallets: Wallet[];
  initialCategories: Category[];
  openNew?: boolean;
}

export default function LedgerManager({
  initialTransactions,
  initialWallets,
  initialCategories,
  openNew = false,
}: LedgerManagerProps) {
  const [transactions, setTransactions] = useState<TransactionRow[]>(initialTransactions);
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const reloadData = useCallback(async () => {
    if (isConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [txRes, walletRes] = await Promise.all([
          supabase
            .from("transactions")
            .select("*, wallets(name), categories(name)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(500),
          supabase.from("wallets")
            .select("id, name, balance, account_type, credit_limit, billing_date, billing_month_offset, due_date, due_month_offset")
            .eq("user_id", user.id),
        ]);

        if (txRes.data) {
          setTransactions(txRes.data.map((row: any) => ({
            ...row,
            wallet_name: row.wallets?.name ?? "—",
            category_name: row.categories?.name ?? "—",
          })));
        }

        if (walletRes.data) {
          setWallets(walletRes.data);
        }
      } catch (err) {
        console.error("Failed to refetch transactions data:", err);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("refresh-data", reloadData);
    return () => window.removeEventListener("refresh-data", reloadData);
  }, [reloadData]);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "spend">("all");
  const [filterPeriod, setFilterPeriod] = useState<"month" | "year" | "date">("month");
  const [filterYear, setFilterYear] = useState<number>(2026);
  const [filterMonth, setFilterMonth] = useState<number>(6); // Juni
  const [filterDate, setFilterDate] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const [filterWalletId, setFilterWalletId] = useState<string>("all");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const walletRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletRef.current && !walletRef.current.contains(event.target as Node)) {
        setWalletDropdownOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [addOpen, setAddOpen] = useState(openNew);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TransactionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionRow | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  // ── Filtered list (memoized) ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter((tx) => {
      // 1. Search Query Filter
      const matchSearch = !q ||
        tx.description.toLowerCase().includes(q) ||
        tx.wallet_name.toLowerCase().includes(q) ||
        tx.category_name.toLowerCase().includes(q);

      // 2. Type Filter Mapping
      let matchType = true;
      if (filterType === "income") {
        matchType = tx.type === "INCOME" || tx.type === "INVESTMENT_SELL";
      } else if (filterType === "spend") {
        matchType = tx.type === "EXPENSE" || tx.type === "INVESTMENT_BUY";
      }

      // 3. Date Range Filter
      let matchDate = true;
      const txDate = new Date(tx.created_at);

      if (filterPeriod === "month") {
        matchDate = txDate.getFullYear() === filterYear && (txDate.getMonth() + 1) === filterMonth;
      } else if (filterPeriod === "year") {
        matchDate = txDate.getFullYear() === filterYear;
      } else if (filterPeriod === "date" && filterDate) {
        const targetD = new Date(filterDate);
        matchDate = txDate.getFullYear() === targetD.getFullYear() &&
          txDate.getMonth() === targetD.getMonth() &&
          txDate.getDate() === targetD.getDate();
      }

      // 4. Wallet (Account) Filter
      const matchWallet = filterWalletId === "all" || tx.wallet_id === filterWalletId;

      // 5. Category Filter
      const matchCategory = filterCategoryId === "all" || tx.category_id === filterCategoryId;

      return matchSearch && matchType && matchDate && matchWallet && matchCategory;
    });
  }, [transactions, search, filterType, filterPeriod, filterYear, filterMonth, filterDate, filterWalletId, filterCategoryId]);

  // ── Paginated slice (memoized) ─────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  // Reset to page 1 when filter/search changes
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleFilterControlsChange = (state: { type: "all" | "income" | "spend"; period: "month" | "year" | "date"; year: number; month: number; date?: string }) => {
    setFilterType(state.type);
    setFilterPeriod(state.period);
    setFilterYear(state.year);
    setFilterMonth(state.month);
    setFilterDate(state.date);
    setPage(1);
  };

  const handleWalletFilterChange = (id: string) => {
    setFilterWalletId(id);
    setPage(1);
  };

  const handleCategoryFilterChange = (id: string) => {
    setFilterCategoryId(id);
    setPage(1);
  };

  // ── Summary for current filter (all filtered, not just page) ──────────────
  const totalIncome = useMemo(() => filtered.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0), [filtered]);

  // ── CRUD helpers ────────────────────────────────────────────────────────────
  const getWalletName = (id: string) => wallets.find((w) => w.id === id)?.name ?? "—";
  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  const handleAdd = useCallback(async (data: TxFormData) => {
    if (isConfigured && supabase) {
      const { data: inserted, error } = await supabase
        .from("transactions")
        .insert({ ...data })
        .select("*, wallets(name), categories(name)")
        .single();
      if (error) { setDbError(error.message); return; }
      const row: TransactionRow = {
        ...inserted,
        wallet_name: (inserted as any).wallets?.name ?? getWalletName(data.wallet_id),
        category_name: (inserted as any).categories?.name ?? getCategoryName(data.category_id),
      };
      setTransactions((prev) => [row, ...prev]);
      // Sync wallet balance
      const delta = getTransactionDelta(data.amount, data.type);
      const updatedWallet = await adjustWalletBalance(supabase, data.wallet_id, delta);
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
        created_at: new Date().toISOString(),
        wallet_name: getWalletName(data.wallet_id),
        category_name: getCategoryName(data.category_id),
      }, ...prev]);
      // Update local wallet balance optimistically
      const delta = getTransactionDelta(data.amount, data.type);
      setWallets((prev) => prev.map((w) =>
        w.id === data.wallet_id ? { ...w, balance: w.balance + delta } : w
      ));
    }
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: { message: `Berhasil menambahkan transaksi "${data.description}"`, type: "success" }
    }));
    window.dispatchEvent(new CustomEvent("refresh-data"));
  }, [wallets, categories]);

  const handleAddAccount = useCallback(async (data: AccountFormData) => {
    if (isConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: inserted, error } = await supabase
        .from("wallets")
        .insert({
          name: data.name,
          balance: data.balance,
          account_type: data.account_type,
          credit_limit: data.credit_limit ?? 0,
          billing_date: data.billing_date ?? null,
          billing_month_offset: data.billing_month_offset ?? 0,
          due_date: data.due_date ?? null,
          due_month_offset: data.due_month_offset ?? 0,
          user_id: user.id,
        })
        .select("id, name, balance, account_type, credit_limit, billing_date, billing_month_offset, due_date, due_month_offset")
        .single();
      if (error) {
        setDbError(error.message);
        throw error;
      }
      setWallets((prev) => [...prev, inserted as Wallet]);
    } else {
      const newAcc: Wallet = {
        id: "w_" + Math.random().toString(36).substr(2, 9),
        name: data.name,
        balance: data.balance,
        account_type: data.account_type,
        credit_limit: data.credit_limit ?? 0,
        billing_date: data.billing_date ?? null,
        billing_month_offset: data.billing_month_offset ?? 0,
        due_date: data.due_date ?? null,
        due_month_offset: data.due_month_offset ?? 0,
      };
      setWallets((prev) => [...prev, newAcc]);
    }
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: { message: `Berhasil menambahkan akun "${data.name}"`, type: "success" }
    }));
  }, []);


  const handleAddCategory = useCallback(async (data: { name: string; type: TransactionType }) => {
    if (isConfigured && supabase) {
      const { data: inserted, error } = await supabase
        .from("categories")
        .insert({ name: data.name, type: data.type })
        .select()
        .single();
      if (error) {
        setDbError(error.message);
        throw error;
      }
      setCategories((prev) => [...prev, inserted]);
    } else {
      const newCat: Category = {
        id: "c_" + Math.random().toString(36).substr(2, 9),
        name: data.name,
        type: data.type,
      };
      setCategories((prev) => [...prev, newCat]);
    }
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: { message: `Berhasil menambahkan kategori "${data.name}"`, type: "success" }
    }));
  }, []);

  const handleEdit = useCallback(async (data: TxFormData) => {
    if (!editTarget) return;
    if (isConfigured && supabase) {
      const { error } = await supabase.from("transactions").update(data).eq("id", editTarget.id);
      if (error) { setDbError(error.message); return; }
      // Reverse old delta, apply new delta
      const oldDelta = getTransactionDelta(editTarget.amount, editTarget.type);
      const newDelta = getTransactionDelta(data.amount, data.type);
      if (editTarget.wallet_id === data.wallet_id) {
        // Same wallet: apply net change
        const netDelta = newDelta - oldDelta;
        if (netDelta !== 0) {
          const updatedWallet = await adjustWalletBalance(supabase, data.wallet_id, netDelta);
          if (updatedWallet) {
            setWallets((prev) => prev.map((w) => w.id === updatedWallet.id ? updatedWallet : w));
            window.dispatchEvent(new CustomEvent("wallet-balance-updated", {
              detail: { walletId: updatedWallet.id, newBalance: updatedWallet.balance }
            }));
          }
        }
      } else {
        // Different wallets: reverse from old wallet, apply to new wallet
        const [updatedOld, updatedNew] = await Promise.all([
          adjustWalletBalance(supabase, editTarget.wallet_id, -oldDelta),
          adjustWalletBalance(supabase, data.wallet_id, newDelta),
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
      // Demo mode: update balances locally
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
    setTransactions((prev) => prev.map((tx) =>
      tx.id === editTarget.id
        ? { ...tx, ...data, wallet_name: getWalletName(data.wallet_id), category_name: getCategoryName(data.category_id) }
        : tx
    ));
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: { message: `Berhasil memperbarui transaksi "${data.description}"`, type: "success" }
    }));
    window.dispatchEvent(new CustomEvent("refresh-data"));
    setEditTarget(null);
  }, [editTarget, wallets, categories]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    if (isConfigured && supabase) {
      const { error } = await supabase.from("transactions").delete().eq("id", deleteTarget.id);
      if (error) { setDbError(error.message); return; }
      // Reverse the balance effect of the deleted transaction
      const reverseDelta = -getTransactionDelta(deleteTarget.amount, deleteTarget.type);
      const updatedWallet = await adjustWalletBalance(supabase, deleteTarget.wallet_id, reverseDelta);
      if (updatedWallet) {
        setWallets((prev) => prev.map((w) => w.id === updatedWallet.id ? updatedWallet : w));
        window.dispatchEvent(new CustomEvent("wallet-balance-updated", {
          detail: { walletId: updatedWallet.id, newBalance: updatedWallet.balance }
        }));
      }
    } else {
      // Demo mode: reverse locally
      const reverseDelta = -getTransactionDelta(deleteTarget.amount, deleteTarget.type);
      setWallets((prev) => prev.map((w) =>
        w.id === deleteTarget.wallet_id ? { ...w, balance: w.balance + reverseDelta } : w
      ));
    }
    const targetName = deleteTarget.description;
    setTransactions((prev) => prev.filter((tx) => tx.id !== deleteTarget.id));
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: { message: `Berhasil menghapus transaksi "${targetName}"`, type: "success" }
    }));
    window.dispatchEvent(new CustomEvent("refresh-data"));
    setDeleteTarget(null);
  }, [deleteTarget]);

  return (
    <div className="p-4 md:p-6 space-y-5 w-full max-w-6xl mx-auto">

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Transaction Ledger</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola seluruh transaksi pemasukan, pengeluaran, dan investasi Anda.</p>
        </div>

      </div>

      {/* ── Filter Controls Panel ─────────────────────────────────────── */}
      <FilterControls
        type={filterType}
        period={filterPeriod}
        year={filterYear}
        month={filterMonth}
        date={filterDate}
        onChange={handleFilterControlsChange}
      />

      {dbError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {dbError}
        </div>
      )}

      {/* ── Controls Row ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Left: Search & Custom Dropdown Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full lg:max-w-3xl">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari deskripsi..."
              className="pl-9 rounded-xl border-border/80 bg-card/60 h-10 text-sm w-full"
            />
          </div>

          {/* Account Filter */}
          <div className="relative" ref={walletRef}>
            <button
              onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
              type="button"
              className={`h-10 px-4 w-full sm:w-auto rounded-xl border bg-card/60 hover:bg-muted/40 text-xs font-bold flex items-center justify-between sm:justify-start gap-1.5 transition-all focus:outline-none cursor-pointer ${
                filterWalletId !== "all" ? "border-[#2F7E79] text-[#2F7E79] dark:text-teal-400" : "border-border/80 text-foreground"
              }`}
            >
              <span className="truncate max-w-[120px]">
                {filterWalletId === "all"
                  ? "Semua Akun"
                  : wallets.find((w) => w.id === filterWalletId)?.name || "Semua Akun"}
              </span>
              <svg
                className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${walletDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {walletDropdownOpen && (
              <div className="absolute top-12 left-0 w-48 bg-card border border-border/80 rounded-2xl shadow-xl p-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                <button
                  onClick={() => {
                    handleWalletFilterChange("all");
                    setWalletDropdownOpen(false);
                  }}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#2F7E79]/10 hover:text-[#2F7E79] dark:hover:text-teal-400 transition-colors text-foreground ${
                    filterWalletId === "all" ? "bg-[#2F7E79]/5 text-[#2F7E79] dark:text-teal-400 font-bold" : ""
                  }`}
                >
                  Semua Akun
                </button>
                {wallets.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      handleWalletFilterChange(w.id);
                      setWalletDropdownOpen(false);
                    }}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#2F7E79]/10 hover:text-[#2F7E79] dark:hover:text-teal-400 transition-colors text-foreground ${
                      filterWalletId === w.id ? "bg-[#2F7E79]/5 text-[#2F7E79] dark:text-teal-400 font-bold" : ""
                    }`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative" ref={categoryRef}>
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              type="button"
              className={`h-10 px-4 w-full sm:w-auto rounded-xl border bg-card/60 hover:bg-muted/40 text-xs font-bold flex items-center justify-between sm:justify-start gap-1.5 transition-all focus:outline-none cursor-pointer ${
                filterCategoryId !== "all" ? "border-[#2F7E79] text-[#2F7E79] dark:text-teal-400" : "border-border/80 text-foreground"
              }`}
            >
              <span className="truncate max-w-[120px]">
                {filterCategoryId === "all"
                  ? "Semua Kategori"
                  : categories.find((c) => c.id === filterCategoryId)?.name || "Semua Kategori"}
              </span>
              <svg
                className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${categoryDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {categoryDropdownOpen && (
              <div className="absolute top-12 left-0 w-48 bg-card border border-border/80 rounded-2xl shadow-xl p-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                <button
                  onClick={() => {
                    handleCategoryFilterChange("all");
                    setCategoryDropdownOpen(false);
                  }}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#2F7E79]/10 hover:text-[#2F7E79] dark:hover:text-teal-400 transition-colors text-foreground ${
                    filterCategoryId === "all" ? "bg-[#2F7E79]/5 text-[#2F7E79] dark:text-teal-400 font-bold" : ""
                  }`}
                >
                  Semua Kategori
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      handleCategoryFilterChange(c.id);
                      setCategoryDropdownOpen(false);
                    }}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#2F7E79]/10 hover:text-[#2F7E79] dark:hover:text-teal-400 transition-colors text-foreground ${
                      filterCategoryId === c.id ? "bg-[#2F7E79]/5 text-[#2F7E79] dark:text-teal-400 font-bold" : ""
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Add Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setAccountOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 h-10 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            + Akun
          </button>

          <button
            onClick={() => setCategoryOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 h-10 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            + Kategori
          </button>

          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-xs font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Transaksi
          </button>
        </div>
      </div>

      {/* ── Table Card ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent bg-muted/20">
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-5 pr-3 py-3 w-[150px]">Tanggal</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3">Deskripsi</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 w-[120px] hidden sm:table-cell">Jenis</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 w-[140px] hidden md:table-cell">Kategori</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 w-[110px] hidden lg:table-cell">Akun</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 w-[140px] text-right">Nominal</TableHead>
                <TableHead className="w-[60px] pr-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                        <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Tidak ada transaksi ditemukan</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Coba ubah filter atau tambahkan transaksi baru</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((tx) => (
                  <TableRow key={tx.id} className="border-border/30 hover:bg-muted/25 transition-colors group">
                    <TableCell className="pl-5 pr-3 py-3.5">
                      <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3.5">
                      <p className="text-sm font-semibold text-foreground leading-tight max-w-[200px] truncate">{tx.description}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 sm:hidden">{tx.category_name}</p>
                    </TableCell>
                    <TableCell className="px-3 py-3.5 hidden sm:table-cell">
                      {getTypeBadge(tx.type)}
                    </TableCell>
                    <TableCell className="px-3 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground font-medium">{tx.category_name}</span>
                    </TableCell>
                    <TableCell className="px-3 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground font-medium">{tx.wallet_name}</span>
                    </TableCell>
                    <TableCell className="px-3 py-3.5 text-right">
                      {getAmountDisplay(tx.amount, tx.type)}
                    </TableCell>
                    <TableCell className="pr-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditTarget(tx)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                          title="Edit"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tx)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                          title="Hapus"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary footer — only when data exists */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground bg-muted/10">
            <div className="flex items-center gap-4">
              <span>
                Pemasukan:{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatIDR(totalIncome)}</span>
              </span>
              <span>
                Pengeluaran:{" "}
                <span className="font-bold text-rose-500 dark:text-rose-400">{formatIDR(totalExpense)}</span>
              </span>
            </div>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
        />
      </div>

      {/* ── Dialogs ───────────────────────────────────────────────────── */}
      <TxFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
        wallets={wallets}
        categories={categories}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
      />

      <AddAccountDialog
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        onSave={handleAddAccount}
      />

      <AddCategoryDialog
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        onSave={handleAddCategory}
      />

      <TxFormDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEdit}
        wallets={wallets}
        categories={categories}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
        initial={
          editTarget
            ? {
              description: editTarget.description,
              amount: editTarget.amount,
              type: editTarget.type,
              wallet_id: editTarget.wallet_id,
              category_id: editTarget.category_id,
            }
            : undefined
        }
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border border-border/80 rounded-3xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Transaksi <span className="font-semibold text-foreground">"{deleteTarget?.description}"</span> akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl h-10 text-sm bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 hover:text-foreground">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl h-10 text-sm bg-rose-500 hover:bg-rose-600 text-white font-semibold"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
