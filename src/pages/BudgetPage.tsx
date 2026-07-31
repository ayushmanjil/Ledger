import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingDown, Calendar, Wallet as WalletIcon, Edit2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LeatherCard } from '@/components/ui/LeatherCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { Field, Input } from '@/components/ui/Input';
import { ChartTooltip, CHART_COLORS } from '@/components/shared/ChartTooltip';
import { useFinanceStore } from '@/store/financeStore';
import { formatCurrency, currentMonth } from '@/utils/format';
import { toast } from '@/components/ui/Toast';

export function BudgetPage() {
  const { dashboard, wallets, transactions, budget, setBudget } = useFinanceStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetAmountInput, setTargetAmountInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const month = currentMonth();

  const budgetWallets = useMemo(() => wallets.filter((w) => w.includeInBudget && w.allocatedAmount > 0), [wallets]);
  const totalWalletAllocation = useMemo(() => budgetWallets.reduce((s, w) => s + w.allocatedAmount, 0), [budgetWallets]);

  const manualBudget = budget?.amount ?? 0;
  const effectiveBudget = manualBudget > 0 ? manualBudget : totalWalletAllocation;

  const monthTx = useMemo(() => transactions.filter((t) => t.type === 'expense' && t.date.startsWith(month)), [transactions, month]);
  const used = monthTx.reduce((s, t) => s + t.amount, 0);
  const remaining = Math.max(0, effectiveBudget - used);
  const pct = effectiveBudget > 0 ? Math.round((used / effectiveBudget) * 100) : 0;

  const isOverAllocated = manualBudget > 0 && totalWalletAllocation > manualBudget;
  const allocationDiff = totalWalletAllocation - manualBudget;
  const isOverBudget = effectiveBudget > 0 && used > effectiveBudget;

  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const dayOfMonth = new Date().getDate();
  const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);
  const avgDaily = used / Math.max(1, dayOfMonth);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTx.forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthTx]);

  const health = isOverBudget
    ? { label: 'Over Budget', tone: 'danger' as const, desc: 'Expenses exceed target budget' }
    : isOverAllocated
    ? { label: 'Over-Allocated', tone: 'warning' as const, desc: 'Wallets exceed target budget' }
    : pct <= 60
    ? { label: 'Healthy', tone: 'success' as const, desc: 'Spending within target' }
    : pct <= 90
    ? { label: 'Watch Closely', tone: 'warning' as const, desc: 'Approaching target limit' }
    : { label: 'At Risk', tone: 'danger' as const, desc: 'Near budget limit' };

  const handleOpenEdit = () => {
    setTargetAmountInput(manualBudget > 0 ? (manualBudget / 100).toString() : (totalWalletAllocation / 100).toString());
    setIsEditModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRupees = parseFloat(targetAmountInput);
    if (isNaN(parsedRupees) || parsedRupees < 0) {
      toast('Please enter a valid budget amount.', 'error');
      return;
    }
    const paise = Math.round(parsedRupees * 100);
    setIsSaving(true);
    try {
      await setBudget(month, paise);
      toast('Target monthly budget updated.', 'success');
      setIsEditModalOpen(false);
    } catch {
      toast('Failed to update target budget.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Budget">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Target Budget Card */}
        <LeatherCard className="lg:col-span-2">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-1">Target Monthly Budget</p>
              <div className="flex items-baseline gap-3">
                <p className="font-display text-3xl font-semibold text-cream-50">{formatCurrency(effectiveBudget)}</p>
                {manualBudget > 0 ? (
                  <span className="text-xs text-gold-300/80 bg-gold-300/10 px-2 py-0.5 rounded-full border border-gold-300/20">
                    Custom Target
                  </span>
                ) : (
                  <span className="text-xs text-cream-50/45">
                    Auto-summed from wallets
                  </span>
                )}
              </div>
            </div>
            <GlassButton size="sm" variant="ghost" onClick={handleOpenEdit} className="gap-1.5 text-xs">
              <Edit2 size={13} /> Edit Target
            </GlassButton>
          </div>

          <ProgressBar value={pct} tone={health.tone === 'danger' ? 'danger' : health.tone === 'warning' ? 'warning' : 'success'} />

          <div className="flex justify-between mt-3 text-sm flex-wrap gap-2">
            <span className="text-cream-50/60">Spent: {formatCurrency(used)}</span>
            <span className="text-gold-300 font-medium">Remaining: {formatCurrency(remaining)}</span>
          </div>

          {/* Dual Warning Pills / Notices */}
          {isOverAllocated && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Wallet Allocation Mismatch (+{formatCurrency(allocationDiff)})</p>
                <p className="text-amber-200/70 mt-0.5">
                  Your active wallet allocations ({formatCurrency(totalWalletAllocation)}) exceed your target monthly budget ({formatCurrency(manualBudget)}).
                </p>
              </div>
            </div>
          )}

          {isOverBudget && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-200">
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Monthly Budget Exceeded</p>
                <p className="text-red-200/70 mt-0.5">
                  You have spent {formatCurrency(used)}, which is {formatCurrency(used - effectiveBudget)} over your target limit.
                </p>
              </div>
            </div>
          )}
        </LeatherCard>

        {/* Budget Health Card */}
        <LeatherCard variant={health.tone === 'success' ? 'olive' : 'brown'}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide text-cream-50/50">Budget Health</p>
            {health.tone === 'success' ? (
              <ShieldCheck size={18} className="text-olive-300" />
            ) : (
              <AlertTriangle size={18} className={health.tone === 'danger' ? 'text-red-400' : 'text-amber-400'} />
            )}
          </div>
          <p className="font-display text-2xl font-semibold text-cream-50 mb-1">{health.label}</p>
          <p className="text-xs text-cream-50/60">{health.desc}</p>
          <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs text-cream-50/60">
            <span>Budget used:</span>
            <span className="font-semibold text-cream-50">{pct}%</span>
          </div>
        </LeatherCard>

        <LeatherCard>
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-2 flex items-center gap-1.5"><TrendingDown size={13} /> Average Daily Spending</p>
          <p className="font-display text-2xl font-semibold text-cream-50">{formatCurrency(avgDaily)}</p>
        </LeatherCard>

        <LeatherCard>
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-2 flex items-center gap-1.5"><Calendar size={13} /> Days Remaining</p>
          <p className="font-display text-2xl font-semibold text-cream-50">{daysRemaining}</p>
        </LeatherCard>

        {/* Wallet breakdown contributing to budget */}
        {budgetWallets.length > 0 && (
          <LeatherCard className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-wide text-cream-50/50">Active Wallet Allocations</p>
              <span className="text-xs text-cream-50/60 font-medium">
                Total: <strong className="text-gold-300">{formatCurrency(totalWalletAllocation)}</strong>
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {budgetWallets.map((w) => {
                const wPct = Math.min(100, ((Math.max(0, w.allocatedAmount - w.balance)) / w.allocatedAmount) * 100);
                return (
                  <div key={w.id}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-cream-50/80">{w.name}</span>
                      <span className="text-cream-50 font-medium">
                        {formatCurrency(w.balance)} <span className="text-cream-50/40">of {formatCurrency(w.allocatedAmount)}</span>
                      </span>
                    </div>
                    <ProgressBar value={wPct} height="sm" />
                  </div>
                );
              })}
            </div>
          </LeatherCard>
        )}

        <LeatherCard className="lg:col-span-3">
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-4">Spending by Category</p>
          {byCategory.length === 0 ? (
            <p className="text-sm text-cream-50/45 py-8 text-center">No expenses recorded this month yet.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3">
                {byCategory.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-cream-50/80">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {c.name}
                    </span>
                    <span className="text-cream-50 font-medium">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </LeatherCard>
      </div>

      {/* Target Monthly Budget Edit Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Set Target Monthly Budget">
        <form onSubmit={handleSaveBudget} className="flex flex-col gap-4 mt-2">
          <p className="text-xs text-cream-50/60 leading-relaxed">
            Set your target monthly spending limit. If wallet allocations exceed this target, an Amber Over-Allocation warning will notify you.
          </p>

          <Field label="Target Budget Amount (₹)">
            <Input
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 10000"
              value={targetAmountInput}
              onChange={(e) => setTargetAmountInput(e.target.value)}
              required
            />
          </Field>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-cream-50/65 flex justify-between items-center">
            <span>Included Wallets Sum:</span>
            <strong className="text-gold-300 font-semibold">{formatCurrency(totalWalletAllocation)}</strong>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <GlassButton type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Target Budget'}
            </GlassButton>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
