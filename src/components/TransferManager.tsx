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

export interface TransferRow {
  id: string;
  from_wallet_id?: string;
  from_goal_id?: string;
  to_wallet_id?: string;
  to_goal_id?: string;
  from_wallet_name: string;
  to_wallet_name: string; // Used to display both wallets or goals target name formatted
  amount: number;
  admin_fee: number;
  notes: string;
  transaction_date: string;
  created_at: string;
}

interface TransferManagerProps {
  initialTransfers: TransferRow[];
  wallets: Wallet[];
  goals: FinancialGoal[];
}

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const newTransferSchema = z.object({
  from_wallet_id: z.string().optional(),
  from_goal_id: z.string().optional(),
  to_wallet_id: z.string().optional(),
  to_goal_id: z.string().optional(),
  amount: z.number().positive("Nominal transfer harus lebih besar dari 0"),
  admin_fee: z.number().min(0, "Biaya admin tidak boleh negatif").default(0),
  notes: z.string().optional(),
}).refine((data) => data.from_wallet_id || data.from_goal_id, {
  message: "Pilih rekening asal atau kantong tabungan asal",
  path: ["from_wallet_id"],
}).refine((data) => data.to_wallet_id || data.to_goal_id, {
  message: "Pilih rekening tujuan atau kantong tabungan tujuan",
  path: ["to_wallet_id"],
});

// ─── Formatters ────────────────────────────────────────────────────────────────
function formatIDR(n: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Format Date ───────────────────────────────────────────────────────────────
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

// ─── Dialog Component ──────────────────────────────────────────────────────────
interface NewTransferDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    from_wallet_id?: string;
    from_goal_id?: string;
    to_wallet_id?: string;
    to_goal_id?: string;
    amount: number;
    admin_fee: number;
    notes?: string;
  }) => Promise<void>;
  wallets: Wallet[];
  goals: FinancialGoal[];
  preSelectedGoalId?: string;
}

function NewTransferDialog({
  open,
  onClose,
  onSave,
  wallets,
  goals,
  preSelectedGoalId,
}: NewTransferDialogProps) {
  const [transferMode, setTransferMode] = useState<"wallet_to_wallet" | "wallet_to_goal" | "goal_to_wallet">("wallet_to_wallet");
  const [fromWalletId, setFromWalletId] = useState("");
  const [fromGoalId, setFromGoalId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [toGoalId, setToGoalId] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [adminFee, setAdminFee] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFromWalletId("");
      setFromGoalId("");
      setToWalletId("");
      setAmount(undefined);
      setAdminFee(undefined);
      setNotes("");
      setError(null);
      if (preSelectedGoalId) {
        setTransferMode("wallet_to_goal");
        setToGoalId(preSelectedGoalId);
      } else {
        setTransferMode("wallet_to_wallet");
        setToGoalId("");
      }
    }
  }, [open, preSelectedGoalId]);

  // Swap handler (only applicable for wallet-to-wallet)
  function handleSwap() {
    if (transferMode === "wallet_to_wallet") {
      const temp = fromWalletId;
      setFromWalletId(toWalletId);
      setToWalletId(temp);
    }
  }

  // Selected source wallet for validation
  const sourceWallet = useMemo(
    () => wallets.find((w) => w.id === fromWalletId),
    [wallets, fromWalletId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      from_wallet_id: transferMode !== "goal_to_wallet" ? fromWalletId || undefined : undefined,
      from_goal_id: transferMode === "goal_to_wallet" ? fromGoalId || undefined : undefined,
      to_wallet_id: transferMode !== "wallet_to_goal" ? toWalletId || undefined : undefined,
      to_goal_id: transferMode === "wallet_to_goal" ? toGoalId || undefined : undefined,
      amount: amount ?? 0,
      admin_fee: transferMode !== "goal_to_wallet" ? adminFee ?? 0 : 0,
      notes,
    };

    const parseResult = newTransferSchema.safeParse(payload);

    if (!parseResult.success) {
      setError(parseResult.error.issues[0].message);
      return;
    }

    const { amount: rawAmt, admin_fee: rawFee } = parseResult.data;

    // Self-transfer validation
    if (transferMode === "wallet_to_wallet" && fromWalletId === toWalletId) {
      setError("Akun asal dan akun tujuan tidak boleh sama");
      return;
    }

    // Balance validation
    if (transferMode !== "goal_to_wallet" && sourceWallet && rawAmt + rawFee > sourceWallet.balance) {
      setError(
        `Saldo ${sourceWallet.name} tidak mencukupi. Saldo saat ini: ${formatIDR(
          sourceWallet.balance
        )}. Total dibutuhkan: ${formatIDR(rawAmt + rawFee)}`
      );
      return;
    }

    if (transferMode === "goal_to_wallet") {
      const sourceGoal = goals.find((g) => g.id === fromGoalId);
      if (sourceGoal && rawAmt > sourceGoal.current_amount) {
        setError(
          `Saldo kantong ${sourceGoal.name} tidak mencukupi. Saldo saat ini: ${formatIDR(
            sourceGoal.current_amount
          )}. Total ditarik: ${formatIDR(rawAmt)}`
        );
        return;
      }
    }

    setSaving(true);
    try {
      await onSave({
        from_wallet_id: payload.from_wallet_id,
        from_goal_id: payload.from_goal_id,
        to_wallet_id: payload.to_wallet_id,
        to_goal_id: payload.to_goal_id,
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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 w-full min-w-0 overflow-hidden">
          <div className="space-y-4">
            {/* Destination Type Toggle (Only show if not locked by preSelectedGoalId) */}
            {!preSelectedGoalId && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Jenis Transfer
                </Label>
                <div className="flex bg-muted/65 p-0.5 rounded-xl border border-border/40 w-full select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setTransferMode("wallet_to_wallet");
                      setFromWalletId("");
                      setFromGoalId("");
                      setToWalletId("");
                      setToGoalId("");
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      transferMode === "wallet_to_wallet"
                        ? "text-primary-foreground bg-[#2F7E79] dark:bg-teal-600 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Rekening
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferMode("wallet_to_goal");
                      setFromWalletId("");
                      setFromGoalId("");
                      setToWalletId("");
                      setToGoalId("");
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      transferMode === "wallet_to_goal"
                        ? "text-primary-foreground bg-[#2F7E79] dark:bg-teal-600 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Isi Kantong
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferMode("goal_to_wallet");
                      setFromWalletId("");
                      setFromGoalId("");
                      setToWalletId("");
                      setToGoalId("");
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      transferMode === "goal_to_wallet"
                        ? "text-primary-foreground bg-[#2F7E79] dark:bg-teal-600 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Tarik Kantong
                  </button>
                </div>
              </div>
            )}

            {/* Wallet selection stacked vertically with overlapping Swap button */}
            <div className="space-y-3 relative flex flex-col w-full min-w-0">
              {/* Source (From) */}
              {transferMode === "goal_to_wallet" ? (
                <div className="space-y-1.5 w-full">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Kantong Tabungan Asal (Dari)
                  </Label>
                  <Select value={fromGoalId} onValueChange={setFromGoalId}>
                    <SelectTrigger className="rounded-xl border-border/80 bg-background h-10 text-sm w-full min-w-0">
                      <span className="block truncate text-left w-full min-w-0 flex-1">
                        <SelectValue placeholder="Pilih Kantong Tabungan" />
                      </span>
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border/80 rounded-xl">
                      {goals.map((g) => (
                        <SelectItem key={g.id} value={g.id} className="text-sm rounded-lg">
                          {g.name} ({formatIDR(g.current_amount)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5 w-full">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Akun Asal (Dari)
                  </Label>
                  <Select value={fromWalletId} onValueChange={setFromWalletId}>
                    <SelectTrigger className="rounded-xl border-border/80 bg-background h-10 text-sm w-full min-w-0">
                      <span className="block truncate text-left w-full min-w-0 flex-1">
                        <SelectValue placeholder="Pilih Akun" />
                      </span>
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
              )}

              {/* Swap Button (Vertical floating pill - Only for wallet targets) */}
              {transferMode === "wallet_to_wallet" && (
                <div className="flex justify-center -my-2.5 relative z-10">
                  <button
                    type="button"
                    onClick={handleSwap}
                    disabled={!fromWalletId && !toWalletId}
                    className="h-8 px-3 rounded-full border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 cursor-pointer text-[10px] font-bold shadow-md"
                    title="Tukar Rekening"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Tukar Posisi
                  </button>
                </div>
              )}

              {/* Destination (To) */}
              {transferMode === "wallet_to_goal" ? (
                <div className="space-y-1.5 w-full mt-4">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Kantong Tabungan Tujuan (Ke)
                  </Label>
                  <Select value={toGoalId} onValueChange={setToGoalId} disabled={!!preSelectedGoalId}>
                    <SelectTrigger className="rounded-xl border-border/80 bg-background h-10 text-sm w-full min-w-0">
                      <span className="block truncate text-left w-full min-w-0 flex-1">
                        <SelectValue placeholder="Pilih Kantong Tabungan" />
                      </span>
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border/80 rounded-xl">
                      {goals.map((g) => (
                        <SelectItem key={g.id} value={g.id} className="text-sm rounded-lg">
                          {g.name} (Terkumpul: {formatIDR(g.current_amount)} / Target: {formatIDR(g.target_amount)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5 w-full mt-4">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Akun Tujuan (Ke)
                  </Label>
                  <Select value={toWalletId} onValueChange={setToWalletId}>
                    <SelectTrigger className="rounded-xl border-border/80 bg-background h-10 text-sm w-full min-w-0">
                      <span className="block truncate text-left w-full min-w-0 flex-1">
                        <SelectValue placeholder="Pilih Akun" />
                      </span>
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border/80 rounded-xl">
                      {wallets.map((w) => (
                        <SelectItem
                          key={w.id}
                          value={w.id}
                          disabled={transferMode === "wallet_to_wallet" ? w.id === fromWalletId : false}
                          className="text-sm rounded-lg"
                        >
                          {w.name} ({formatIDR(w.balance)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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

            {/* Admin Fee Input (Only for wallet sources) */}
            {transferMode !== "goal_to_wallet" && (
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
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Catatan / Keterangan
              </Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pindahan tabungan, ditarik karena butuh"
                className="rounded-xl border-border/80 bg-background h-10 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-500 font-medium leading-tight">{error}</p>}

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
  goals = [],
}: TransferManagerProps) {
  const [transfers, setTransfers] = useState<TransferRow[]>(initialTransfers);
  const [activeWallets, setActiveWallets] = useState<Wallet[]>(wallets);
  const [activeGoals, setActiveGoals] = useState<FinancialGoal[]>(goals);
  const [open, setOpen] = useState(false);
  const [preSelectedGoalId, setPreSelectedGoalId] = useState<string | undefined>(undefined);
  const [dbError, setDbError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransferRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Parse target pocket goal from URL on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      const goalId = params.get("goal_id");
      if (action === "new" && goalId) {
        setPreSelectedGoalId(goalId);
        setOpen(true);
        // Clear query params without reloading
        const url = new URL(window.location.href);
        url.searchParams.delete("action");
        url.searchParams.delete("goal_id");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, []);

  const reloadData = useCallback(async () => {
    if (isConfigured && supabase) {
      try {
        const [transferRes, walletRes, goalRes] = await Promise.all([
          supabase
            .from("transfers")
            .select(`
              id,
              from_wallet_id,
              from_goal_id,
              to_wallet_id,
              to_goal_id,
              amount,
              admin_fee,
              notes,
              transaction_date,
              created_at,
              from_wallet:wallets!from_wallet_id(name),
              from_goal:financial_goals!from_goal_id(name),
              to_wallet:wallets!to_wallet_id(name),
              to_goal:financial_goals!to_goal_id(name)
            `)
            .order("transaction_date", { ascending: false }),
          supabase
            .from("wallets")
            .select("id, name, balance")
            .order("name", { ascending: true }),
          supabase
            .from("financial_goals")
            .select("*")
            .eq("status", "active")
            .order("name", { ascending: true })
        ]);

        if (walletRes.data) {
          setActiveWallets(walletRes.data as Wallet[]);
        }
        if (goalRes.data) {
          setActiveGoals(goalRes.data as FinancialGoal[]);
        }
        if (transferRes.data) {
          setTransfers((transferRes.data as any[]).map((tf) => ({
            id: tf.id,
            from_wallet_id: tf.from_wallet_id,
            from_goal_id: tf.from_goal_id,
            to_wallet_id: tf.to_wallet_id,
            to_goal_id: tf.to_goal_id,
            from_wallet_name: tf.from_wallet?.name ?? (tf.from_goal?.name ? "🎯 " + tf.from_goal.name : "—"),
            to_wallet_name: tf.to_wallet?.name ?? (tf.to_goal?.name ? "🎯 " + tf.to_goal.name : "—"),
            amount: Number(tf.amount),
            admin_fee: Number(tf.admin_fee || 0),
            notes: tf.notes || "",
            transaction_date: tf.transaction_date,
            created_at: tf.created_at,
          })));
        }
      } catch (err) {
        console.error("Failed to refetch transfers data:", err);
      }
    }
  }, []);

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

  const handleSaveTransfer = useCallback(
    async (formData: {
      from_wallet_id?: string;
      from_goal_id?: string;
      to_wallet_id?: string;
      to_goal_id?: string;
      amount: number;
      admin_fee: number;
      notes?: string;
    }) => {
      setDbError(null);

      const senderName = formData.from_goal_id
        ? "🎯 " + (activeGoals.find((g) => g.id === formData.from_goal_id)?.name ?? "Pocket")
        : (activeWallets.find((w) => w.id === formData.from_wallet_id)?.name ?? "Wallet A");
      const receiverName = formData.to_goal_id
        ? "🎯 " + (activeGoals.find((g) => g.id === formData.to_goal_id)?.name ?? "Pocket")
        : (activeWallets.find((w) => w.id === formData.to_wallet_id)?.name ?? "Wallet B");

      if (isConfigured && supabase) {
        // Run database RPC function for transaction atomicity (using create_transfer_v3)
        const { data, error } = await supabase.rpc("create_transfer_v3", {
          p_from_wallet_id: formData.from_wallet_id || null,
          p_from_goal_id: formData.from_goal_id || null,
          p_to_wallet_id: formData.to_wallet_id || null,
          p_to_goal_id: formData.to_goal_id || null,
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
          window.dispatchEvent(new CustomEvent("refresh-data"));
        }
      } else {
        // Demo Mode - Mock updates in state
        const localId = "t_" + Math.random().toString(36).substring(2, 9);
        const newTransfer: TransferRow = {
          id: localId,
          from_wallet_id: formData.from_wallet_id,
          from_goal_id: formData.from_goal_id,
          to_wallet_id: formData.to_wallet_id,
          to_goal_id: formData.to_goal_id,
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
            let bal = w.balance;
            if (formData.from_wallet_id && w.id === formData.from_wallet_id) {
              bal -= (formData.amount + formData.admin_fee);
            }
            if (formData.to_wallet_id && w.id === formData.to_wallet_id) {
              bal += formData.amount;
            }
            return { ...w, balance: bal };
          })
        );

        if (formData.from_goal_id) {
          setActiveGoals((prev) =>
            prev.map((g) => {
              if (g.id === formData.from_goal_id) {
                return { ...g, current_amount: g.current_amount - formData.amount };
              }
              return g;
            })
          );
        }

        if (formData.to_goal_id) {
          setActiveGoals((prev) =>
            prev.map((g) => {
              if (g.id === formData.to_goal_id) {
                return { ...g, current_amount: g.current_amount + formData.amount };
              }
              return g;
            })
          );
        }

        setTransfers((prev) => [newTransfer, ...prev]);
        triggerToast(`[Demo] Berhasil mentransfer ${formatIDR(formData.amount)} dari ${senderName} ke ${receiverName}`);
      }
    },
    [activeWallets, activeGoals, triggerToast]
  );

  const handleDeleteTransfer = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (isConfigured && supabase) {
        const { error } = await supabase
          .from("transfers")
          .delete()
          .eq("id", deleteTarget.id);

        if (error) throw error;

        triggerToast("Transfer berhasil dibatalkan dan saldo dikembalikan.");
        window.dispatchEvent(new CustomEvent("refresh-data"));
      } else {
        // Demo Mode - mock rollback in state
        const tf = deleteTarget;
        setTransfers((prev) => prev.filter((t) => t.id !== tf.id));

        // Refund wallets
        setActiveWallets((prev) =>
          prev.map((w) => {
            let bal = w.balance;
            if (tf.from_wallet_id && w.id === tf.from_wallet_id) {
              bal += (tf.amount + tf.admin_fee);
            }
            if (tf.to_wallet_id && w.id === tf.to_wallet_id) {
              bal -= tf.amount;
            }
            return { ...w, balance: bal };
          })
        );

        // Refund goals
        if (tf.from_goal_id) {
          setActiveGoals((prev) =>
            prev.map((g) => {
              if (g.id === tf.from_goal_id) {
                return { ...g, current_amount: g.current_amount + tf.amount };
              }
              return g;
            })
          );
        }
        if (tf.to_goal_id) {
          setActiveGoals((prev) =>
            prev.map((g) => {
              if (g.id === tf.to_goal_id) {
                return { ...g, current_amount: g.current_amount - tf.amount };
              }
              return g;
            })
          );
        }

        setDeleteTarget(null);
        triggerToast("[Demo] Transfer berhasil dibatalkan.");
      }
    } catch (err: any) {
      triggerToast(`Gagal membatalkan transfer: ${err.message}`, "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, triggerToast]);

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
          onClick={() => {
            setPreSelectedGoalId(undefined);
            setOpen(true);
          }}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-xs font-bold shadow-md shadow-teal-800/20 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Transfer Baru
        </button>
      </div>

      {dbError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3">Tujuan (Rekening/Goal)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 hidden md:table-cell">Catatan</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3 text-right w-[110px] hidden sm:table-cell">Biaya Admin</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pr-5 pl-3 py-3 text-right w-[140px]">Nominal</TableHead>
                <TableHead className="w-[50px] py-3 pr-5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                        <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
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
                        <span className={`h-2 w-2 rounded-full ${tf.from_goal_id ? "bg-amber-500/70" : "bg-rose-500/70"}`} />
                        <span className="text-sm font-bold text-foreground leading-none">{tf.from_wallet_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3.5 text-center">
                      <span className="text-xs text-muted-foreground">➔</span>
                    </TableCell>
                    <TableCell className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${tf.to_goal_id ? "bg-amber-500/70" : "bg-emerald-500/70"}`} />
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
                    <TableCell className="py-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setDeleteTarget(tf)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Batalkan transfer"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width={2}>
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
      </div>

      {/* ── New Transfer Dialog ────────────────────────────────────────── */}
      <NewTransferDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSaveTransfer}
        wallets={activeWallets}
        goals={activeGoals}
        preSelectedGoalId={preSelectedGoalId}
      />

      {/* ── Delete Confirmation Dialog ─────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border border-border/80 rounded-3xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">Batalkan & Hapus Transfer?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Transaksi transfer sebesar <span className="font-extrabold text-foreground">{deleteTarget ? formatIDR(deleteTarget.amount) : ""}</span> dari <span className="font-semibold text-foreground">"{deleteTarget?.from_wallet_name}"</span> ke <span className="font-semibold text-foreground">"{deleteTarget?.to_wallet_name}"</span> akan dihapus permanen. Saldo pada rekening asal dan tujuan akan otomatis dikembalikan (refunded).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2.5">
            <AlertDialogCancel className="rounded-xl h-10 text-sm bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 hover:text-foreground">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransfer}
              disabled={deleting}
              className="rounded-xl h-10 text-sm bg-rose-500 hover:bg-rose-600 text-white font-semibold disabled:opacity-60"
            >
              {deleting ? "Membatalkan..." : "Ya, Batalkan Transfer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
