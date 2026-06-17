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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CurrencyInput from "@/components/ui/CurrencyInput";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase, isConfigured } from "@/lib/supabase";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface Wallet {
  id: string;
  name: string;
  balance: number;
}

export interface TransferRow {
  id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  from_wallet_name: string;
  to_wallet_name: string;
  amount: number;
  admin_fee: number;
  notes: string;
  transaction_date: string;
  created_at: string;
}

interface TransferManagerProps {
  initialTransfers: TransferRow[];
  wallets: Wallet[];
}

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const newTransferSchema = z.object({
  from_wallet_id: z.string().min(1, "Dompet pengirim harus dipilih"),
  to_wallet_id: z.string().min(1, "Dompet penerima harus dipilih"),
  amount: z.number().positive("Nominal transfer harus lebih besar dari 0"),
  admin_fee: z.number().min(0, "Biaya admin tidak boleh negatif").default(0),
  notes: z.string().optional(),
});

// ─── Formatters ────────────────────────────────────────────────────────────────
function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Dialog Component at Module Level ──────────────────────────────────────────
interface NewTransferDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    from_wallet_id: string;
    to_wallet_id: string;
    amount: number;
    admin_fee: number;
    notes?: string;
  }) => Promise<void>;
  wallets: Wallet[];
}

function NewTransferDialog({
  open,
  onClose,
  onSave,
  wallets,
}: NewTransferDialogProps) {
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [adminFee, setAdminFee] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFromWalletId("");
      setToWalletId("");
      setAmount(undefined);
      setAdminFee(undefined);
      setNotes("");
      setError(null);
    }
  }, [open]);

  // Swap handler
  function handleSwap() {
    const temp = fromWalletId;
    setFromWalletId(toWalletId);
    setToWalletId(temp);
  }

  // Selected wallet balances for client side validation
  const sourceWallet = useMemo(
    () => wallets.find((w) => w.id === fromWalletId),
    [wallets, fromWalletId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parseResult = newTransferSchema.safeParse({
      from_wallet_id: fromWalletId,
      to_wallet_id: toWalletId,
      amount: amount ?? 0,
      admin_fee: adminFee ?? 0,
      notes,
    });

    if (!parseResult.success) {
      setError(parseResult.error.issues[0].message);
      return;
    }

    const { amount: rawAmt, admin_fee: rawFee } = parseResult.data;

    // Self-transfer validation
    if (fromWalletId === toWalletId) {
      setError("Akun asal dan akun tujuan tidak boleh sama");
      return;
    }

    // Balance validation
    if (sourceWallet && rawAmt + rawFee > sourceWallet.balance) {
      setError(
        `Saldo ${sourceWallet.name} tidak mencukupi. Saldo saat ini: ${formatIDR(
          sourceWallet.balance
        )}. Total dibutuhkan: ${formatIDR(rawAmt + rawFee)}`
      );
      return;
    }

    setSaving(true);
    try {
      await onSave({
        from_wallet_id: fromWalletId,
        to_wallet_id: toWalletId,
        amount: rawAmt,
        admin_fee: rawFee,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal melakukan transfer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-card border border-border/80 rounded-3xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-bold text-foreground">
            Kirim Uang / Transfer Saldo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-4">
            {/* Wallet selection row with a Swap button */}
            <div className="flex items-end gap-2 relative">
              <div className="flex-1 space-y-1.5 min-w-0">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Akun Asal (Dari)
                </Label>
                <Select value={fromWalletId} onValueChange={setFromWalletId}>
                  <SelectTrigger className="rounded-xl border-border/80 bg-background h-10 text-sm truncate">
                    <SelectValue placeholder="Pilih Akun" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border/80 rounded-xl">
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id} className="text-sm rounded-lg">
                        {w.name} ({formatIDR(w.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Swap Button */}
              <button
                type="button"
                onClick={handleSwap}
                disabled={!fromWalletId && !toWalletId}
                className="h-10 w-10 shrink-0 rounded-xl border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
                title="Swap Akun"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>

              <div className="flex-1 space-y-1.5 min-w-0">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Akun Tujuan (Ke)
                </Label>
                <Select value={toWalletId} onValueChange={setToWalletId}>
                  <SelectTrigger className="rounded-xl border-border/80 bg-background h-10 text-sm truncate">
                    <SelectValue placeholder="Pilih Akun" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border/80 rounded-xl">
                    {wallets.map((w) => (
                      <SelectItem
                        key={w.id}
                        value={w.id}
                        disabled={w.id === fromWalletId}
                        className="text-sm rounded-lg"
                      >
                        {w.name} ({formatIDR(w.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Jumlah Transfer (Nominal)
              </Label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                placeholder="Rp 0"
              />
            </div>

            {/* Admin Fee Input */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Biaya Admin (Opsional)
              </Label>
              <CurrencyInput
                value={adminFee}
                onChange={setAdminFee}
                placeholder="Rp 0 (Tanpa biaya)"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Catatan / Keterangan
              </Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Bayar hutang, top up e-wallet"
                className="rounded-xl border-border/80 bg-background h-10 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-500 font-medium leading-tight">{error}</p>}

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
              disabled={saving}
              className="px-6 h-10 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-sm font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Memproses..." : "Kirim Saldo"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main TransferManager Component ────────────────────────────────────────────
export default function TransferManager({
  initialTransfers,
  wallets,
}: TransferManagerProps) {
  const [transfers, setTransfers] = useState<TransferRow[]>(initialTransfers);
  const [activeWallets, setActiveWallets] = useState<Wallet[]>(wallets);
  const [open, setOpen] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Trigger custom toast notification
  const triggerToast = useCallback((message: string, type: "success" | "error" = "success") => {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message, type },
      })
    );
  }, []);

  const handleSaveTransfer = useCallback(
    async (formData: {
      from_wallet_id: string;
      to_wallet_id: string;
      amount: number;
      admin_fee: number;
      notes?: string;
    }) => {
      setDbError(null);

      const senderName = activeWallets.find((w) => w.id === formData.from_wallet_id)?.name ?? "Wallet A";
      const receiverName = activeWallets.find((w) => w.id === formData.to_wallet_id)?.name ?? "Wallet B";

      if (isConfigured && supabase) {
        // Run database RPC function for transaction atomicity
        const { data, error } = await supabase.rpc("create_transfer_v1", {
          p_from_wallet_id: formData.from_wallet_id,
          p_to_wallet_id: formData.to_wallet_id,
          p_amount: formData.amount,
          p_admin_fee: formData.admin_fee,
          p_notes: formData.notes || null,
          p_transaction_date: new Date().toISOString(),
        });

        if (error) {
          triggerToast(`Gagal memproses transfer: ${error.message}`, "error");
          setDbError(error.message);
          throw error;
        }

        if (data && data.success) {
          triggerToast(`Berhasil mentransfer ${formatIDR(formData.amount)} dari ${senderName} ke ${receiverName}`);
          // Wait 1200ms and reload to synchronize state (like Quick Add)
          setTimeout(() => window.location.reload(), 1200);
        }
      } else {
        // Demo Mode - Mock updates in state
        const localId = "t_" + Math.random().toString(36).substring(2, 9);
        const newTransfer: TransferRow = {
          id: localId,
          from_wallet_id: formData.from_wallet_id,
          to_wallet_id: formData.to_wallet_id,
          from_wallet_name: senderName,
          to_wallet_name: receiverName,
          amount: formData.amount,
          admin_fee: formData.admin_fee,
          notes: formData.notes || "",
          transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        // Adjust local active balances
        setActiveWallets((prev) =>
          prev.map((w) => {
            if (w.id === formData.from_wallet_id) {
              return { ...w, balance: w.balance - (formData.amount + formData.admin_fee) };
            }
            if (w.id === formData.to_wallet_id) {
              return { ...w, balance: w.balance + formData.amount };
            }
            return w;
          })
        );

        setTransfers((prev) => [newTransfer, ...prev]);
        triggerToast(`[Demo] Berhasil mentransfer ${formatIDR(formData.amount)} dari ${senderName} ke ${receiverName}`);
      }
    },
    [activeWallets, triggerToast]
  );

  return (
    <div className="p-4 md:p-6 space-y-5 w-full max-w-6xl mx-auto">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Account Transfers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pindahkan saldo antar rekening dan dompet digital Anda secara instan dan rapi.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-xs font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Transfer Baru
        </button>
      </div>

      {dbError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {dbError}
        </div>
      )}

      {/* ── Table Card ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent bg-muted/20">
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-5 pr-3 py-3 w-[160px]">Tanggal</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3">Akun Asal</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 w-[40px] text-center"></TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3">Akun Tujuan</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 hidden md:table-cell">Catatan</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 text-right w-[110px] hidden sm:table-cell">Biaya Admin</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pr-5 pl-3 py-3 text-right w-[140px]">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                        <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Belum ada riwayat transfer</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Gunakan tombol "Transfer Baru" di kanan atas untuk mulai memindahkan saldo
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((tf) => (
                  <TableRow key={tf.id} className="border-border/30 hover:bg-muted/25 transition-colors group">
                    <TableCell className="pl-5 pr-3 py-3.5">
                      <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                        {formatDate(tf.transaction_date)}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500/70" />
                        <span className="text-sm font-bold text-foreground leading-none">{tf.from_wallet_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3.5 text-center">
                      <span className="text-xs text-muted-foreground">➔</span>
                    </TableCell>
                    <TableCell className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                        <span className="text-sm font-bold text-foreground leading-none">{tf.to_wallet_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={tf.notes}>
                        {tf.notes || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="px-3 py-3.5 text-right font-medium text-xs text-muted-foreground tabular-nums hidden sm:table-cell">
                      {tf.admin_fee > 0 ? formatIDR(tf.admin_fee) : "Free"}
                    </TableCell>
                    <TableCell className="pr-5 pl-3 py-3.5 text-right font-black text-sm text-foreground tabular-nums">
                      {formatIDR(tf.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── New Transfer Dialog ────────────────────────────────────────── */}
      <NewTransferDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSaveTransfer}
        wallets={activeWallets}
      />
    </div>
  );
}
