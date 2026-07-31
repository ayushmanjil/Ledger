import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingDown, Calendar, Wallet as WalletIcon } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LeatherCard } from '@/components/ui/LeatherCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ChartTooltip, CHART_COLORS } from '@/components/shared/ChartTooltip';
import { useFinanceStore } from '@/store/financeStore';
import { formatCurrency, currentMonth } from '@/utils/format';

export function BudgetPage() {
  const { wallets, transactions } = useFinanceStore();

  const month = currentMonth();

  // Budget is automatically summed from wallets with includeInBudget = true.
  const budgetWallets = useMemo(() => wallets.filter((w) => w.includeInBudget && w.allocatedAmount > 0), [wallets]);
  const budgetAmount = useMemo(() => budgetWallets.reduce((s, w) => s + w.allocatedAmount, 0), [budgetWallets]);

  const monthTx = useMemo(() => transactions.filter((t) => t.type === 'expense' && t.date.startsWith(month)), [transactions, month]);
  const used = monthTx.reduce((s, t) => s + t.amount, 0);
  const remaining = Math.max(0, budgetAmount - used);
  const pct = budgetAmount > 0 ? Math.round((used / budgetAmount) * 100) : 0;

  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const dayOfMonth = new Date().getDate();
  const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);
  const avgDaily = used / Math.max(1, dayOfMonth);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTx.forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthTx]);

  const health = pct <= 60 ? { label: 'Healthy', tone: 'success' as const } : pct <= 90 ? { label: 'Watch closely', tone: 'warning' as const } : { label: 'At risk', tone: 'danger' as const };

  return (
    <AppShell title="Budget">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <LeatherCard className="lg:col-span-2">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-1">Monthly Budget</p>
              <p className="font-display text-3xl font-semibold text-cream-50">{formatCurrency(budgetAmount)}</p>
            </div>
          </div>
          <p className="text-[11px] text-cream-50/40 mb-4 flex items-center gap-1">
            <WalletIcon size={11} />
            Auto-calculated from your wallet allocations
          </p>
          <ProgressBar value={pct} tone={health.tone === 'danger' ? 'danger' : health.tone === 'warning' ? 'warning' : 'success'} />
          <div className="flex justify-between mt-3 text-sm">
            <span className="text-cream-50/60">Spent: {formatCurrency(used)}</span>
            <span className="text-gold-300 font-medium">Remaining: {formatCurrency(remaining)}</span>
          </div>
        </LeatherCard>

        <LeatherCard variant="olive">
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-2">Budget Health</p>
          <p className="font-display text-2xl font-semibold text-cream-50 mb-1">{health.label}</p>
          <p className="text-xs text-cream-50/50">{pct}% of budget used</p>
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
            <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-4">Wallet Allocations</p>
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
            {budgetWallets.length === 0 && (
              <p className="text-sm text-cream-50/45 py-4 text-center">
                No wallets with budget allocation yet. Create a wallet and enable "Include in Monthly Budget".
              </p>
            )}
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
    </AppShell>
  );
}
