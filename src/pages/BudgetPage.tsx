import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingDown, Calendar, Edit2, AlertTriangle, ShieldCheck, ChevronLeft, ChevronRight, RotateCcw, AlertCircle, Clock } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LeatherCard } from '@/components/ui/LeatherCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { ChartTooltip, CHART_COLORS } from '@/components/shared/ChartTooltip';
import { useFinanceStore } from '@/store/financeStore';
import { formatCurrency, currentMonth, formatMonthLabel, getPrevMonth, getNextMonth, getMonthList } from '@/utils/format';
import { toast } from '@/components/ui/Toast';
import { isWalletIncludedInMonth } from '@/firebase/dashboard';

export function BudgetPage() {
  const { dashboard, wallets, transactions, budget, setBudget, selectedMonth, setSelectedMonth } = useFinanceStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetAmountInput, setTargetAmountInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const month = selectedMonth || currentMonth();
  const isCurrentMonth = month === currentMonth();

  const budgetWallets = useMemo(
    () => wallets.filter((w) => isWalletIncludedInMonth(w, month)),
    [wallets, month]
  );
  const activeAllocatedWallets = useMemo(
    () => budgetWallets.filter((w) => w.allocatedAmount > 0),
    [budgetWallets]
  );
  const totalWalletAllocation = useMemo(
    () => activeAllocatedWallets.reduce((s, w) => s + w.allocatedAmount, 0),
    [activeAllocatedWallets]
  );

  const manualBudget = budget?.amount ?? 0;
  const hasSetBudget = dashboard?.hasSetBudget ?? (manualBudget > 0);

  const monthTx = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.type === 'expense' &&
          t.category !== 'Transfer' &&
          t.date.startsWith(month) &&
          isWalletIncludedInMonth(wallets.find((w) => w.id === t.walletId) || { includeInBudget: true } as any, month)
      ),
    [transactions, wallets, month]
  );

  const allMonthTx = useMemo(
    () => transactions.filter((t) => t.type === 'expense' && t.category !== 'Transfer' && t.date.startsWith(month)),
    [transactions, month]
  );

  const used = monthTx.reduce((s, t) => s + t.amount, 0);
  const totalSpentAllWallets = allMonthTx.reduce((s, t) => s + t.amount, 0);

  const effectiveBudget = dashboard?.monthlyBudget ?? (manualBudget > 0 ? manualBudget : totalWalletAllocation);
  const remaining = Math.max(0, effectiveBudget - used);
  const pct = effectiveBudget > 0 ? Math.min(100, Math.round((used / effectiveBudget) * 100)) : 0;

  const isOverAllocated = manualBudget > 0 && totalWalletAllocation > manualBudget;
  const allocationDiff = totalWalletAllocation - manualBudget;
  const isOverBudget = effectiveBudget > 0 && used > effectiveBudget;

  const [yearStr, monthStrNum] = month.split('-');
  const daysInMonth = new Date(Number(yearStr), Number(monthStrNum), 0).getDate();
  const dayOfMonth = isCurrentMonth ? new Date().getDate() : daysInMonth;
  const daysRemaining = isCurrentMonth ? Math.max(0, daysInMonth - dayOfMonth) : 0;
  const avgDaily = used / Math.max(1, dayOfMonth);

  const monthListOptions = useMemo(() => getMonthList(month, 8, 4), [month]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTx.forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthTx]);

  const health = !hasSetBudget
    ? { label: 'No Budget Set', tone: 'warning' as const, desc: 'Target budget not configured for this month' }
    : isOverBudget
    ? { label: 'Over Budget', tone: 'danger' as const, desc: 'Expenses exceed target budget' }
    : pct <= 60
    ? { label: 'Healthy', tone: 'success' as const, desc: 'Spending within target' }
    : pct <= 90
    ? { label: 'Watch Closely', tone: 'warning' as const, desc: 'Approaching target limit' }
    : { label: 'At Risk', tone: 'danger' as const, desc: 'Near budget limit' };

  const walletSpentInMonth = useMemo(() => {
    const map = new Map<string, number>();
    monthTx.forEach((t) => {
      map.set(t.walletId, (map.get(t.walletId) ?? 0) + t.amount);
    });
    return map;
  }, [monthTx]);

  const handleOpenEdit = () => {
    setTargetAmountInput(manualBudget > 0 ? (manualBudget / 100).toString() : '');
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
      setIsEditModalOpen(false);
      toast(`Monthly budget set for ${formatMonthLabel(month)}.`, 'success');
    } catch {
      toast('Failed to update target budget.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Budget">
      {/* Month Navigation Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 p-4 rounded-2xl bg-cream-50/5 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Calendar className="text-gold-300 w-5 h-5 shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-cream-50 tracking-tight">
              {formatMonthLabel(month)}
            </h2>
            <p className="text-xs text-cream-50/50">
              {isCurrentMonth ? 'Current Month' : 'Historical / Future Budget View'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            size="sm"
            variant="ghost"
            onClick={() => setSelectedMonth(getPrevMonth(month))}
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </GlassButton>

          <Select
            value={month}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="py-1.5 px-3 text-xs w-auto min-w-[165px] font-medium"
          >
            {monthListOptions.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)} {m === currentMonth() ? '(Current)' : ''}
              </option>
            ))}
          </Select>

          <GlassButton
            size="sm"
            variant="ghost"
            onClick={() => setSelectedMonth(getNextMonth(month))}
            title="Next Month"
          >
            <ChevronRight size={16} />
          </GlassButton>

          {!isCurrentMonth && (
            <GlassButton
              size="sm"
              variant="ghost"
              onClick={() => setSelectedMonth(currentMonth())}
              className="gap-1 text-xs ml-1 border border-gold-300/30 text-gold-300"
            >
              <RotateCcw size={13} /> Current Month
            </GlassButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Target Budget Card */}
        <LeatherCard className="lg:col-span-2">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-1">
                {formatMonthLabel(month)} Budget Balance
              </p>
              {hasSetBudget ? (
                <div className="flex items-baseline gap-3">
                  <p className="font-display text-3xl font-semibold text-gold-300">{formatCurrency(remaining)}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1 text-amber-300">
                  <AlertCircle size={20} />
                  <span className="font-medium text-sm">No monthly budget set</span>
                </div>
              )}
            </div>
            <GlassButton size="sm" variant="ghost" onClick={handleOpenEdit} className="gap-1.5 text-xs">
              <Edit2 size={13} /> {hasSetBudget ? 'Edit Budget' : 'Set Budget'}
            </GlassButton>
          </div>

          {!hasSetBudget ? (
            /* Widget Notice when budget wasn't set */
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-amber-200 text-sm">
                  No monthly budget set, total {formatCurrency(totalSpentAllWallets)} spent in this month.
                </p>
                <p className="text-xs text-amber-200/70 mt-1">
                  Click "Set Budget" above or below to define a target budget for {formatMonthLabel(month)}.
                </p>
              </div>
              <GlassButton size="sm" variant="primary" onClick={handleOpenEdit} className="shrink-0 text-xs">
                Set Budget for {formatMonthLabel(month).split(' ')[0]}
              </GlassButton>
            </div>
          ) : (
            <>
              <ProgressBar value={pct} tone={health.tone === 'danger' ? 'danger' : health.tone === 'warning' ? 'warning' : 'success'} />

              <div className="flex items-center justify-between mt-3.5 flex-wrap gap-2 pt-2 border-t border-white/10">
                <span className="text-base sm:text-lg font-semibold text-cream-50 tracking-tight">
                  {formatCurrency(used)} spent of {formatCurrency(effectiveBudget)}
                </span>
                <span className="text-sm font-semibold text-cream-50/70">
                  {pct}% used
                </span>
              </div>
            </>
          )}

          {/* Warning Pills / Notices */}
          {hasSetBudget && isOverBudget && (
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
            <span className="font-semibold text-cream-50">{hasSetBudget ? `${pct}%` : 'N/A'}</span>
          </div>
        </LeatherCard>

        <LeatherCard>
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-2 flex items-center gap-1.5"><TrendingDown size={13} /> Average Daily Spending</p>
          <p className="font-display text-2xl font-semibold text-cream-50">{formatCurrency(avgDaily)}</p>
        </LeatherCard>

        <LeatherCard>
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-2 flex items-center gap-1.5"><Calendar size={13} /> Days {isCurrentMonth ? 'Remaining' : 'in Month'}</p>
          <p className="font-display text-2xl font-semibold text-cream-50">{isCurrentMonth ? daysRemaining : daysInMonth}</p>
        </LeatherCard>

        {/* Today's Date & Day Card */}
        <LeatherCard>
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-2 flex items-center gap-1.5">
            <Clock size={13} className="text-gold-300" /> Today
          </p>
          <p className="font-display text-2xl font-semibold text-cream-50">
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="text-xs text-gold-300/90 mt-1 font-medium">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </LeatherCard>

        {/* Wallet breakdown contributing to budget */}
        {budgetWallets.length > 0 && (
          <LeatherCard className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-cream-50/50">Included Wallets ({budgetWallets.length})</p>
                <p className="text-[11px] text-cream-50/40">Wallets included in {formatMonthLabel(month)} budget</p>
              </div>
              <span className="text-xs text-cream-50/60 font-medium">
                Total Expenses: <strong className="text-gold-300">{formatCurrency(used)}</strong>
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {budgetWallets.map((w) => {
                const spentVal = walletSpentInMonth.get(w.id) ?? 0;
                const spentPct = used > 0 ? Math.min(100, Math.round((spentVal / used) * 100)) : 0;
                return (
                  <div key={w.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cream-50 font-medium">{w.name}</span>
                      <span className="text-gold-300 font-semibold">
                        Spent: {formatCurrency(spentVal)}
                      </span>
                    </div>
                    {spentVal > 0 ? (
                      <div>
                        <ProgressBar value={spentPct} height="sm" />
                        <span className="text-[10px] text-cream-50/40 mt-1 block text-right">
                          {spentPct}% of month's expenses
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-cream-50/35">No expenses from this wallet in {formatMonthLabel(month)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </LeatherCard>
        )}

        <LeatherCard className="lg:col-span-3">
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-4">Spending by Category ({formatMonthLabel(month)})</p>
          {byCategory.length === 0 ? (
            <p className="text-sm text-cream-50/45 py-8 text-center">No expenses recorded in {formatMonthLabel(month)} yet.</p>
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
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Set Target Monthly Budget for ${formatMonthLabel(month)}`}>
        <form onSubmit={handleSaveBudget} className="flex flex-col gap-4 mt-2">
          <p className="text-xs text-cream-50/60 leading-relaxed">
            Set your target monthly spending limit for <strong>{formatMonthLabel(month)}</strong>.
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

