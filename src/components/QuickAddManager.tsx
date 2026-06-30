import { useState, useEffect, useMemo } from "react";
import { TxFormDialog } from "./LedgerManager";
import { createBrowserScopedClient, isConfigured, adjustWalletBalance, getTransactionDelta } from "../lib/supabase";
const supabase = createBrowserScopedClient();
import type { Wallet, Category, TransactionType } from "../lib/supabase";
import type { TxFormData } from "./LedgerManager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import CurrencyInput from "@/components/ui/CurrencyInput";

function formatIDR(n: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Pre-fill payload from open-quick-add event ───────────────────────────────
interface QuickAddPayload {
  type?: TransactionType;
  wallet_id?: string;
  prefillDescription?: string;
}

export default function QuickAddManager({
  wallets: initialPropWallets,
  categories: initialPropCategories,
}: {
  wallets?: Wallet[];
  categories?: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [payBillOpen, setPayBillOpen] = useState(false);
  const [payBillTargetWallet, setPayBillTargetWallet] = useState<Wallet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<Partial<TxFormData> | undefined>(undefined);

  const [wallets, setWallets] = useState<Wallet[]>(initialPropWallets || []);
  const [categories, setCategories] = useState<Category[]>(initialPropCategories || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleOpen(e: Event) {
      const payload = (e as CustomEvent<QuickAddPayload>).detail;

      // Build prefill from payload if provided
      if (payload && (payload.type || payload.wallet_id || payload.prefillDescription !== undefined)) {
        setPrefill({
          type: payload.type ?? "EXPENSE",
          wallet_id: payload.wallet_id ?? "",
          description: payload.prefillDescription ?? "",
          amount: undefined,
          category_id: "",
        });
      } else {
        setPrefill(undefined);
      }
      setOpen(true);
    }
    window.addEventListener("open-quick-add", handleOpen);
    return () => window.removeEventListener("open-quick-add", handleOpen);
  }, []);

  useEffect(() => {
    function handlePayBillOpen(e: Event) {
      const payload = (e as CustomEvent<{ wallet: Wallet }>).detail;
      if (payload && payload.wallet) {
        setPayBillTargetWallet(payload.wallet);
        setPayBillOpen(true);
      }
    }
    window.addEventListener("open-pay-bill", handlePayBillOpen);
    return () => window.removeEventListener("open-pay-bill", handlePayBillOpen);
  }, []);

  useEffect(() => {
    if ((open || payBillOpen) && isConfigured && supabase) {
      // If we already received data from Layout SSR, skip fetching to make it instant!
      if (wallets.length > 0 && categories.length > 0) return;

      async function loadOptions() {
        setLoading(true);
        try {
          const { data: { session } } = await supabase!.auth.getSession();
          if (!session?.user) return;
          const user = session.user;
          const [wRes, cRes] = await Promise.all([
            supabase!
              .from("wallets")
              .select("id, name, balance, account_type, credit_limit, billing_date, billing_month_offset, due_date, due_month_offset")
              .eq("user_id", user.id)
              .order("name", { ascending: true }),
            supabase!.from("categories").select("id, name, type").or(`user_id.eq.${user.id},user_id.is.null`).order("name", { ascending: true }),
          ]);
          if (wRes.data) setWallets(wRes.data as Wallet[]);
          if (cRes.data) setCategories(cRes.data);
        } catch (e) {
          console.error("Failed to load options:", e);
        } finally {
          setLoading(false);
        }
      }
      loadOptions();
    }
  }, [open, payBillOpen]);

  async function handleSave(data: TxFormData) {
    if (isConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        return;
      }
      const { error: err } = await supabase
        .from("transactions")
        .insert({
          description: data.description,
          amount: data.amount,
          type: data.type,
          wallet_id: data.wallet_id,
          category_id: data.category_id,
          created_at: data.created_at || new Date().toISOString(),
          user_id: user.id,
        });
      if (err) {
        setError(err.message);
        throw err;
      }
      // Sync wallet balance immediately
      const delta = getTransactionDelta(data.amount, data.type);
      const updatedWallet = await adjustWalletBalance(supabase, data.wallet_id, delta);
      if (updatedWallet) {
        // Update local wallets state to reflect balance change
        setWallets((prev) =>
          prev.map((w) => (w.id === updatedWallet.id ? updatedWallet : w))
        );
        window.dispatchEvent(new CustomEvent("wallet-balance-updated", {
          detail: { walletId: updatedWallet.id, newBalance: updatedWallet.balance }
        }));
      }
    } else {
      console.log("Quick Add saved (Demo Mode):", data);
    }
    // Show toast via global event bus
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: { message: `Berhasil menambahkan transaksi "${data.description}"`, type: "success" }
    }));
    setOpen(false);
    setPrefill(undefined);

    // Notify other components on the page that data has changed
    window.dispatchEvent(new CustomEvent("refresh-data"));
  }

  async function handlePayBillSave(fromWalletId: string, toWalletId: string, amount: number) {
    const destWallet = wallets.find(w => w.id === toWalletId);
    const sourceWallet = wallets.find(w => w.id === fromWalletId);
    if (!destWallet || !sourceWallet) return;

    if (isConfigured && supabase) {
      const { error: err } = await supabase.rpc("create_transfer_v3", {
        p_from_wallet_id: fromWalletId,
        p_from_goal_id: null,
        p_to_wallet_id: toWalletId,
        p_to_goal_id: null,
        p_amount: amount,
        p_admin_fee: 0,
        p_notes: `Bayar Tagihan ${destWallet.name}`,
        p_transaction_date: new Date().toISOString(),
      });
      if (err) {
        throw err;
      }
      
      // Update local state by refetching wallets
      const { data: updatedWallets, error: fetchErr } = await supabase
        .from("wallets")
        .select("id, name, balance, account_type, credit_limit, billing_date, billing_month_offset, due_date, due_month_offset")
        .order("name", { ascending: true });
      if (!fetchErr && updatedWallets) {
        setWallets(updatedWallets as Wallet[]);
        // Dispatch wallet-balance-updated events for both wallets
        const updatedSource = updatedWallets.find((w: any) => w.id === fromWalletId);
        const updatedDest = updatedWallets.find((w: any) => w.id === toWalletId);
        if (updatedSource) {
          window.dispatchEvent(new CustomEvent("wallet-balance-updated", {
            detail: { walletId: fromWalletId, newBalance: updatedSource.balance }
          }));
        }
        if (updatedDest) {
          window.dispatchEvent(new CustomEvent("wallet-balance-updated", {
            detail: { walletId: toWalletId, newBalance: updatedDest.balance }
          }));
        }
      }
    } else {
      // Demo Mode
      const updatedSourceWallet = { ...sourceWallet, balance: sourceWallet.balance - amount };
      const updatedDestWallet = { ...destWallet, balance: destWallet.balance + amount };
      setWallets((prev) =>
        prev.map((w) => {
          if (w.id === fromWalletId) return updatedSourceWallet;
          if (w.id === toWalletId) return updatedDestWallet;
          return w;
        })
      );
      window.dispatchEvent(new CustomEvent("wallet-balance-updated", {
        detail: { walletId: fromWalletId, newBalance: updatedSourceWallet.balance }
      }));
      window.dispatchEvent(new CustomEvent("wallet-balance-updated", {
        detail: { walletId: toWalletId, newBalance: updatedDestWallet.balance }
      }));
    }

    // Show toast via global event bus
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: {
        message: `Berhasil membayar tagihan ${destWallet.name} sebesar ${formatIDR(amount)} menggunakan ${sourceWallet.name}`,
        type: "success"
      }
    }));

    // Notify other components on the page that data has changed
    window.dispatchEvent(new CustomEvent("refresh-data"));
  }

  return (
    <>
      <TxFormDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setPrefill(undefined);
        }}
        onSave={handleSave}
        wallets={wallets}
        categories={categories}
        initial={prefill}
      />
      <PayBillDialog
        open={payBillOpen}
        onClose={() => {
          setPayBillOpen(false);
          setPayBillTargetWallet(null);
        }}
        wallet={payBillTargetWallet}
        wallets={wallets}
        onSave={handlePayBillSave}
      />
      {error && (
        <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in slide-in-from-bottom-2">
          {error}
        </div>
      )}
    </>
  );
}

function PayBillDialog({
  open,
  onClose,
  wallet,
  wallets,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  wallet: Wallet | null;
  wallets: Wallet[];
  onSave: (fromWalletId: string, toWalletId: string, amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [fromWalletId, setFromWalletId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const liquidWallets = useMemo(() => {
    return wallets.filter(w => w.account_type !== 'paylater' && w.account_type !== 'credit_card');
  }, [wallets]);

  useEffect(() => {
    if (open && wallet) {
      setAmount(Math.max(0, -(wallet.balance ?? 0)));
      setFromWalletId("");
      setError(null);
    }
  }, [open, wallet]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) return;
    if (!fromWalletId) {
      setError("Pilih rekening asal pembayaran.");
      return;
    }
    if (amount === undefined || amount <= 0) {
      setError("Jumlah pembayaran harus lebih besar dari Rp 0.");
      return;
    }

    const sourceWallet = wallets.find(w => w.id === fromWalletId);
    if (sourceWallet && sourceWallet.balance < amount) {
      setError(`Saldo ${sourceWallet.name} tidak mencukupi (Saldo: ${formatIDR(sourceWallet.balance)}).`);
      return;
    }

    setSaving(true);
    try {
      await onSave(fromWalletId, wallet.id, amount);
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal memproses pembayaran tagihan.");
    } finally {
      setSaving(false);
    }
  }

  if (!wallet) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-bold text-foreground">
            Bayar Tagihan
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Membayar tagihan berjalan untuk akun:
              </p>
              <h4 className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
                <span className="text-primary">
                  {wallet.account_type === "paylater" ? "⚡" : "💳"}
                </span>
                {wallet.name}
              </h4>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Rekening Asal Pembayaran
              </Label>
              <Select value={fromWalletId} onValueChange={setFromWalletId}>
                <SelectTrigger className="rounded-xl border-border/80 bg-background h-10 text-sm w-full">
                  <SelectValue placeholder="Pilih rekening bank/kas/e-wallet" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border/80 rounded-2xl shadow-xl">
                  {liquidWallets.map((w) => (
                    <SelectItem key={w.id} value={w.id} className="text-xs font-semibold py-2">
                      {w.name} (Saldo: {formatIDR(w.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Jumlah Pembayaran (IDR)
              </Label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                placeholder="Rp 0"
              />
              <p className="text-[10px] text-muted-foreground">
                Tagihan berjalan saat ini: <span className="font-bold text-rose-500">{formatIDR(Math.max(0, -wallet.balance))}</span>
              </p>
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
              {saving ? "Memproses..." : "Konfirmasi Pembayaran"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
