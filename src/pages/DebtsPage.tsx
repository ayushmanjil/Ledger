import { useState } from 'react';
import { Plus, Handshake, TrendingDown, TrendingUp } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { GlassButton } from '@/components/ui/GlassButton';
import { LeatherCard } from '@/components/ui/LeatherCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DebtCard } from '@/components/debts/DebtCard';
import { CreateDebtModal } from '@/components/debts/CreateDebtModal';
import { PayDebtModal } from '@/components/debts/PayDebtModal';
import { useFinanceStore } from '@/store/financeStore';
import { toast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/format';
import type { Debt } from '@/types';

export function DebtsPage() {
  const { debts, deleteDebt } = useFinanceStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [payDebt, setPayDebt] = useState<Debt | null>(null);
  const [toDelete, setToDelete] = useState<Debt | null>(null);

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteDebt(toDelete.id);
    toast(`Debt record for "${toDelete.person_name}" removed`, 'info');
    setToDelete(null);
  };

  const borrowed = debts.filter(d => d.type === 'borrowed');
  const lent = debts.filter(d => d.type === 'lent');

  const totalOwed = borrowed.filter(d => d.status === 'active').reduce((s, d) => s + (d.amount - d.paid_amount), 0);
  const totalLent = lent.filter(d => d.status === 'active').reduce((s, d) => s + (d.amount - d.paid_amount), 0);

  return (
    <AppShell title="Debts & Loans" actions={
      <GlassButton variant="primary" onClick={() => setCreateOpen(true)}>
        <Plus size={16} /> Add New
      </GlassButton>
    }>

      {/* Stats Card — sits in the same grid as the debt columns below so edges align */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
        <LeatherCard>
          <div className="flex flex-wrap gap-6 sm:gap-10">
            <div>
              <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-1">Total I Owe</p>
              <p className="font-display text-2xl font-semibold text-red-400">{formatCurrency(totalOwed)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-1">Total Owed To Me</p>
              <p className="font-display text-2xl font-semibold text-gold-400">{formatCurrency(totalLent)}</p>
            </div>
          </div>
        </LeatherCard>
      </div>

      {debts.length === 0 ? (
        <EmptyState
          icon={<Handshake size={22} />}
          title="No debts or loans"
          description="Track money you've borrowed from friends or lent to others."
          actionLabel="Add Record"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="glass-surface inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-cream-50 bg-gradient-to-b from-copper-400/40 to-caramel-500/30 border border-white/10 mb-4">
              <TrendingDown size={16} className="text-red-400" />
              <span>Payables (Borrowed)</span>
            </div>
            <div className="flex flex-col gap-4">
              {borrowed.length === 0 && <p className="text-sm text-cream-50/40 italic">No active payables.</p>}
              {borrowed.map(d => <DebtCard key={d.id} debt={d} onPay={setPayDebt} onDelete={setToDelete} />)}
            </div>
          </div>
          <div>
            <div className="glass-surface inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-cream-50 bg-gradient-to-b from-copper-400/40 to-caramel-500/30 border border-white/10 mb-4">
              <TrendingUp size={16} className="text-gold-300" />
              <span>Receivables (Lent)</span>
            </div>
            <div className="flex flex-col gap-4">
              {lent.length === 0 && <p className="text-sm text-cream-50/40 italic">No active receivables.</p>}
              {lent.map(d => <DebtCard key={d.id} debt={d} onPay={setPayDebt} onDelete={setToDelete} />)}
            </div>
          </div>
        </div>
      )}

      <CreateDebtModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <PayDebtModal debt={payDebt} onClose={() => setPayDebt(null)} />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete record"
        message={`Delete record with "${toDelete?.person_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </AppShell>
  );
}
