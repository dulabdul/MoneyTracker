import { useState, useCallback, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import CurrencyInput from "@/components/ui/CurrencyInput";
import {
  createBrowserScopedClient,
  isConfigured,
  updateWallet,
  deleteWallet,
  isCreditAccount,
} from "@/lib/supabase";
const supabase = createBrowserScopedClient();
import type { Wallet } from "@/lib/supabase";
import { getAccountLogo } from "@/lib/logoUtils";
import CreditAccountCard from "@/components/CreditAccountCard";

// ─── IDR Formatter ────────────────────────────────────────────────────────────
function formatIDR(n: number) {
  return "Rp " + new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Account Logo renderer ────────────────────────────────────────────────────
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
          parent.innerHTML = `<div class="h-full w-full flex items-center justify-center bg-gradient-to-tr from-teal-600 to-emerald-700 text-white font-bold text-sm">${name.charAt(0).toUpperCase()}</div>`;
        }
      }}
    />
  );
}

// ─── Edit Account Dialog ──────────────────────────────────────────────────────
function EditAccountDialog({
  open,
  account,
  onClose,
  onSave,
}: {
  open: boolean;
  account: Wallet | null;
  onClose: () => void;
  onSave: (
    id: string,
    data: {
      name: string;
      balance: number;
      credit_limit?: number;
      billing_date?: number | null;
      billing_month_offset?: number;
      due_date?: number | null;
      due_month_offset?: number;
    }
  ) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [creditLimit, setCreditLimit] = useState<number | undefined>(undefined);
  const [billingDate, setBillingDate] = useState("");
  const [billingMonthOffset, setBillingMonthOffset] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [dueMonthOffset, setDueMonthOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isCredit = account ? isCreditAccount(account) : false;

  useEffect(() => {
    if (open && account) {
      setName(account.name);
      const isAccCredit = isCreditAccount(account);
      setBalance(isAccCredit ? Math.max(0, -(account.balance ?? 0)) : (account.balance ?? 0));
      setCreditLimit(account.credit_limit ?? 0);
      setBillingDate(account.billing_date ? account.billing_date.toString() : "");
      setBillingMonthOffset(account.billing_month_offset ?? 0);
      setDueDate(account.due_date ? account.due_date.toString() : "");
      setDueMonthOffset(account.due_month_offset ?? 0);
      setError(null);
    }
  }, [open, account]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama akun tidak boleh kosong");
      return;
    }
    if (balance === undefined || balance < 0) {
      setError(isCredit ? "Tagihan berjalan tidak boleh negatif" : "Saldo tidak boleh negatif");
      return;
    }

    let parsedBillingDate: number | null = null;
    let parsedDueDate: number | null = null;

    if (isCredit) {
      if (creditLimit === undefined || creditLimit < 0) {
        setError("Limit kredit tidak boleh negatif");
        return;
      }
      if (billingDate) {
        const d = parseInt(billingDate, 10);
        if (isNaN(d) || d < 1 || d > 31) {
          setError("Tanggal closing harus antara 1 sampai 31");
          return;
        }
        parsedBillingDate = d;
      }
      if (dueDate) {
        const d = parseInt(dueDate, 10);
        if (isNaN(d) || d < 1 || d > 31) {
          setError("Tanggal jatuh tempo harus antara 1 sampai 31");
          return;
        }
        parsedDueDate = d;
      }
    }

    setSaving(true);
    try {
      await onSave(account!.id, {
        name,
        balance: isCredit ? -balance : balance,
        ...(isCredit ? {
          credit_limit: creditLimit ?? 0,
          billing_date: parsedBillingDate,
          billing_month_offset: billingMonthOffset,
          due_date: parsedDueDate,
          due_month_offset: dueMonthOffset,
        } : {}),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-bold text-foreground">
            Edit Akun
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Nama Akun
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: BCA Utama, ShopeePay"
                className="rounded-xl border-border/80 bg-background h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {isCredit ? "Tagihan Berjalan (IDR)" : "Saldo Akun (IDR)"}
              </Label>
              <CurrencyInput
                value={balance}
                onChange={setBalance}
                placeholder="Rp 0"
              />
              <p className="text-[10px] text-muted-foreground">
                {isCredit
                  ? "⚠️ Ubah tagihan langsung jika ingin koreksi manual."
                  : "⚠️ Ubah saldo langsung jika ingin koreksi manual. Saldo otomatis disesuaikan saat transaksi ditambahkan."}
              </p>
            </div>

            {isCredit && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Limit Kredit (IDR)
                  </Label>
                  <CurrencyInput
                    value={creditLimit}
                    onChange={setCreditLimit}
                    placeholder="Rp 0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Tanggal Closing */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tanggal Closing</Label>
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
                          className={`flex-1 h-10 text-[10px] font-bold transition-all ${
                            billingMonthOffset === 0
                              ? "bg-[#2F7E79] text-white"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          Bln Ini
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingMonthOffset(1)}
                          className={`flex-1 h-10 text-[10px] font-bold transition-all border-l border-border/80 ${
                            billingMonthOffset === 1
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
                          className={`flex-1 h-10 text-[10px] font-bold transition-all ${
                            dueMonthOffset === 0
                              ? "bg-rose-500 text-white"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          Bln Ini
                        </button>
                        <button
                          type="button"
                          onClick={() => setDueMonthOffset(1)}
                          className={`flex-1 h-10 text-[10px] font-bold transition-all border-l border-border/80 ${
                            dueMonthOffset === 1
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
              </>
            )}
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
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main AccountManager Component ───────────────────────────────────────────
interface AccountManagerProps {
  initialAccounts: Wallet[];
}

export default function AccountManager({ initialAccounts }: AccountManagerProps) {
  const [accounts, setAccounts] = useState<Wallet[]>(initialAccounts);
  const [editTarget, setEditTarget] = useState<Wallet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Wallet | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Listen for wallet balance updates dispatched by LedgerManager/QuickAddManager
  useEffect(() => {
    function handleWalletUpdate(e: Event) {
      const detail = (e as CustomEvent<{ walletId: string; newBalance: number }>).detail;
      setAccounts((prev) =>
        prev.map((w) =>
          w.id === detail.walletId ? { ...w, balance: detail.newBalance } : w
        )
      );
    }
    window.addEventListener("wallet-balance-updated", handleWalletUpdate);
    return () => window.removeEventListener("wallet-balance-updated", handleWalletUpdate);
  }, []);

  // Listen for refresh-data to reload wallets list
  useEffect(() => {
    async function reloadWallets() {
      if (isConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from("wallets")
            .select("id, name, balance, account_type, credit_limit, billing_date, billing_month_offset, due_date, due_month_offset")
            .order("name", { ascending: true });
          if (!error && data) {
            setAccounts(data as Wallet[]);
          }
        } catch (err) {
          console.error("Failed to refetch wallets in AccountManager:", err);
        }
      }
    }
    window.addEventListener("refresh-data", reloadWallets);
    return () => window.removeEventListener("refresh-data", reloadWallets);
  }, []);

  // Split wallets into liquid and credit
  const liquidAccounts = accounts.filter((w) => !isCreditAccount(w));
  const creditAccounts = accounts.filter((w) => isCreditAccount(w));
  const totalLiquid = liquidAccounts.reduce((s, w) => s + (w.balance ?? 0), 0);

  const handleEdit = useCallback(
    async (
      id: string,
      data: {
        name: string;
        balance: number;
        credit_limit?: number;
        billing_date?: number | null;
        billing_month_offset?: number;
        due_date?: number | null;
        due_month_offset?: number;
      }
    ) => {
      if (isConfigured && supabase) {
        const updated = await updateWallet(supabase, id, data);
        if (!updated) throw new Error("Gagal memperbarui akun di database");
        setAccounts((prev) => prev.map((w) => (w.id === id ? updated : w)));
      } else {
        setAccounts((prev) =>
          prev.map((w) => (w.id === id ? { ...w, ...data } : w))
        );
      }
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: `Akun "${data.name}" berhasil diperbarui`, type: "success" },
        })
      );
    },
    []
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (isConfigured && supabase) {
        const ok = await deleteWallet(supabase, deleteTarget.id);
        if (!ok) throw new Error("Gagal menghapus akun");
      }
      const name = deleteTarget.name;
      setAccounts((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      setDeleteTarget(null);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: `Akun "${name}" berhasil dihapus`, type: "success" },
        })
      );
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: err.message || "Gagal menghapus akun", type: "error" },
        })
      );
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  // Credit account actions → open PayBillDialog
  const handlePayBill = useCallback((wallet: Wallet) => {
    window.dispatchEvent(
      new CustomEvent("open-pay-bill", {
        detail: { wallet },
      })
    );
  }, []);

  const handleAddExpense = useCallback((wallet: Wallet) => {
    window.dispatchEvent(
      new CustomEvent("open-quick-add", {
        detail: {
          type: "EXPENSE",
          wallet_id: wallet.id,
          prefillDescription: "",
        },
      })
    );
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Section A: Liquid Accounts ──────────────────────────────────────── */}
      <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl justify-between shadow-sm hover:shadow-md transition-all">
        {/* Header */}
        <div>
          <h4 className="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">
            Account Balance Summary
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Daftar saldo dan aset yang tersedia di setiap akun keuangan Anda.
          </p>
        </div>

        {/* Account List */}
        <div className="mt-4 flex-1 flex flex-col justify-center gap-3">
          {liquidAccounts.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Tidak ada akun kas ditemukan
            </div>
          ) : (
            liquidAccounts.map((acc) => (
              <div
                key={acc.id}
                className="group flex items-center justify-between p-3 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 border border-border/60 hover:border-border transition-colors"
              >
                {/* Logo + Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-border/80 bg-background/50">
                    <AccountLogo name={acc.name} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">
                      {acc.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">
                      {acc.account_type === "ewallet" ? "E-Wallet" : acc.account_type === "bank" ? "Bank" : "IDR Account"}
                    </span>
                  </div>
                </div>

                {/* Balance + Actions */}
                <div className="flex items-center gap-2 shrink-0 pl-2">
                  <span className="font-extrabold text-xs text-foreground block tabular-nums">
                    {formatIDR(acc.balance)}
                  </span>
                  {/* Action buttons — visible on hover */}
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditTarget(acc);
                        setEditOpen(true);
                      }}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                      title="Edit akun"
                      aria-label={`Edit ${acc.name}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(acc)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      title="Hapus akun"
                      aria-label={`Hapus ${acc.name}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer total */}
        <div className="mt-4 flex items-center justify-between p-3 rounded-2xl border bg-[#2F7E79]/5 dark:bg-teal-500/5 border-[#2F7E79]/10 text-xs">
          <span className="font-bold text-muted-foreground">Total Aset Likuid</span>
          <span className="font-extrabold text-[#2F7E79] dark:text-teal-400 tabular-nums">
            {formatIDR(totalLiquid)}
          </span>
        </div>
      </div>

      {/* ── Section B: Tagihan Berjalan (Credit Accounts) ───────────────────── */}
      {creditAccounts.length > 0 && (
        <div className="flex flex-col p-5 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all">
          {/* Header */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-2">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Tagihan Berjalan
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              PayLater &amp; Kartu Kredit yang sedang berjalan.
            </p>
          </div>

          {/* Credit account cards */}
          <div className="flex flex-col gap-3">
            {creditAccounts.map((acc) => (
              <CreditAccountCard
                key={acc.id}
                wallet={acc}
                onPayBill={handlePayBill}
                onAddExpense={handleAddExpense}
                onEdit={(w) => {
                  setEditTarget(w);
                  setEditOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <EditAccountDialog
        open={editOpen}
        account={editTarget}
        onClose={() => {
          setEditOpen(false);
          setEditTarget(null);
        }}
        onSave={handleEdit}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border border-border/80 rounded-3xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Hapus Akun?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Akun <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span> akan dihapus secara permanen. Seluruh transaksi yang terhubung ke akun ini juga akan ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl h-10 text-sm bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 hover:text-foreground">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl h-10 text-sm bg-rose-500 hover:bg-rose-600 text-white font-semibold disabled:opacity-60"
            >
              {deleting ? "Menghapus..." : "Ya, Hapus Akun"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
