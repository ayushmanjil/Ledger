import { useMemo, useState } from 'react';
import { Search, Receipt, Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LeatherCard } from '@/components/ui/LeatherCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { useFinanceStore } from '@/store/financeStore';
import { useUIStore } from '@/store/uiStore';
import { toast } from '@/components/ui/Toast';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type Transaction } from '@/types';
import { todayISO, sortTransactionsLatestFirst } from '@/utils/format';

const QUICK_FILTERS = ['All', 'Today', 'Yesterday', 'Last Week', 'This Month', 'Last Month'] as const;

function isInQuickFilter(date: string, filter: string): boolean {
  const d = new Date(date);
  const today = new Date();
  const y = new Date(today); y.setDate(today.getDate() - 1);
  switch (filter) {
    case 'Today': return date === todayISO();
    case 'Yesterday': return date === y.toISOString().slice(0, 10);
    case 'Last Week': { const w = new Date(today); w.setDate(today.getDate() - 7); return d >= w && d <= today; }
    case 'This Month': return date.slice(0, 7) === today.toISOString().slice(0, 7);
    case 'Last Month': { const m = new Date(today.getFullYear(), today.getMonth() - 1, 1); return date.slice(0, 7) === m.toISOString().slice(0, 7); }
    default: return true;
  }
}

export function TransactionsPage() {
  const { transactions, wallets, deleteTransaction } = useFinanceStore();
  const { openModal } = useUIStore();
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<typeof QUICK_FILTERS[number]>('All');
  const [walletFilter, setWalletFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);

  const allCategories = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

  const filtered = useMemo(() => {
    const list = transactions
      .filter((t) => quickFilter === 'All' || isInQuickFilter(t.date, quickFilter))
      .filter((t) => walletFilter === 'all' || String(t.walletId) === walletFilter)
      .filter((t) => categoryFilter === 'all' || t.category === categoryFilter)
      .filter((t) => typeFilter === 'all' || t.type === typeFilter)
      .filter((t) => !dateFrom || t.date >= dateFrom)
      .filter((t) => !dateTo || t.date <= dateTo)
      .filter((t) => !search.trim() || t.category.toLowerCase().includes(search.toLowerCase()) || t.note?.toLowerCase().includes(search.toLowerCase()));
    return sortTransactionsLatestFirst(list);
  }, [transactions, quickFilter, walletFilter, categoryFilter, typeFilter, dateFrom, dateTo, search]);

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteTransaction(toDelete.id);
    toast('Transaction deleted', 'info');
    setToDelete(null);
  };

  return (
    <AppShell title="Transactions">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-50/40" />
          <Input placeholder="Search transactions…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-3 shrink-0">
          <GlassButton onClick={() => openModal('add-income')}><ArrowDownCircle size={15} /> Income</GlassButton>
          <GlassButton onClick={() => openModal('add-expense')}><ArrowUpCircle size={15} /> Expense</GlassButton>
        </div>
      </div>

      <LeatherCard hoverLift={false} className="mb-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setQuickFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${quickFilter === f ? 'bg-black/40 border-black/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] text-cream-50' : 'border-white/10 text-cream-50/50 hover:text-cream-50/80'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </Select>
          <Select value={walletFilter} onChange={(e) => setWalletFilter(e.target.value)}>
            <option value="all">All wallets</option>
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From date" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To date" />
        </div>
      </LeatherCard>

      <LeatherCard hoverLift={false}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Receipt size={22} />}
            title="No transactions found"
            description="Try adjusting your filters, or add a new transaction."
            actionLabel="Add Expense"
            onAction={() => openModal('add-expense')}
          />
        ) : (
          filtered.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} onEdit={setEditing} onDelete={setToDelete} />
          ))
        )}
      </LeatherCard>

      {editing && (
        <TransactionModal open={!!editing} onClose={() => setEditing(null)} type={editing.type} editing={editing} />
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete transaction"
        message="This transaction will be permanently removed."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </AppShell>
  );
}
