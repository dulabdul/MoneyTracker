import { useState, useEffect } from "react";
import { TxFormDialog } from "./LedgerManager";
import { supabase, isConfigured, adjustWalletBalance, getTransactionDelta } from "../lib/supabase";
import type { Wallet, Category } from "../lib/supabase";
import type { TxFormData } from "./LedgerManager";

export default function QuickAddManager({
  wallets,
  categories,
}: {
  wallets: Wallet[];
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener("open-quick-add", handleOpen);
    return () => window.removeEventListener("open-quick-add", handleOpen);
  }, []);

  async function handleSave(data: TxFormData) {
    if (isConfigured && supabase) {
      const { error: err } = await supabase
        .from("transactions")
        .insert({
          description: data.description,
          amount: data.amount,
          type: data.type,
          wallet_id: data.wallet_id,
          category_id: data.category_id,
        });
      if (err) {
        setError(err.message);
        throw err;
      }
      // Sync wallet balance immediately
      const delta = getTransactionDelta(data.amount, data.type);
      const updatedWallet = await adjustWalletBalance(data.wallet_id, delta);
      if (updatedWallet) {
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
    // Refresh page after short delay to sync dashboard charts
    setTimeout(() => window.location.reload(), 1200);
  }

  return (
    <>
      <TxFormDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        wallets={wallets}
        categories={categories}
      />
      {error && (
        <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in slide-in-from-bottom-2">
          {error}
        </div>
      )}
    </>
  );
}
