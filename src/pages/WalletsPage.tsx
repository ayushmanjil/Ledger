import { useState, useMemo } from 'react';
import { Plus, ArrowLeftRight, Wallet as WalletIcon } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { GlassButton } from '@/components/ui/GlassButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { WalletCard } from '@/components/wallets/WalletCard';
import { CreateWalletModal } from '@/components/wallets/CreateWalletModal';
import { TransferModal } from '@/components/wallets/TransferModal';
import { useFinanceStore } from '@/store/financeStore';
import { toast } from '@/components/ui/Toast';
import type { Wallet } from '@/types';

export function WalletsPage() {
  const { wallets, transactions, deleteWallet } = useFinanceStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Wallet | null>(null);

  // Sum of expenses per wallet, derived from real transaction data.
  // This is the source of truth for "spent" — avoids any drift from
  // balance arithmetic on wallets created before the current schema.
  const walletSpent = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => map.set(t.walletId, (map.get(t.walletId) ?? 0) + t.amount));
    return map;
  }, [transactions]);

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteWallet(toDelete.id);
    toast(`"${toDelete.name}" deleted`, 'info');
    setToDelete(null);
  };

  return (
    <AppShell title="Wallets" actions={<>
      <GlassButton variant="ghost" onClick={() => setTransferOpen(true)}>
        <ArrowLeftRight size={16} /> Transfer
      </GlassButton>
      <GlassButton variant="primary" onClick={() => setCreateOpen(true)}>
        <Plus size={16} /> New Wallet
      </GlassButton>
    </>}>

      {wallets.length === 0 ? (
        <EmptyState
          icon={<WalletIcon size={22} />}
          title="No wallets yet"
          description="Create a wallet — cash, bank, UPI, or anything else — to start tracking balances."
          actionLabel="Create Wallet"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {wallets.map((w) => (
            <WalletCard
              key={w.id}
              wallet={w}
              spent={walletSpent.get(w.id) ?? 0}
              onDelete={setToDelete}
            />
          ))}
        </div>
      )}

      <CreateWalletModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete wallet"
        message={`Delete "${toDelete?.name}"? Its transactions will remain in history but the wallet will no longer be selectable.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </AppShell>
  );
}
