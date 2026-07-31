import { useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ArrowDownCircle, ArrowUpCircle, CalendarPlus, TrendingUp, Sparkles, Wallet, PiggyBank, Search } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LeatherCard } from '@/components/ui/LeatherCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { ChartTooltip } from '@/components/shared/ChartTooltip';
import { useFinanceStore } from '@/store/financeStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency } from '@/utils/format';

export function DashboardPage() {
  const { dashboard, fetchDashboard } = useFinanceStore();
  const { openModal, setCommandOpen } = useUIStore();

  useEffect(() => { fetchDashboard(); }, []);

  const usedPct = dashboard && dashboard.monthlyBudget > 0
    ? Math.round((dashboard.usedBudget / dashboard.monthlyBudget) * 100)
    : 0;

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Budget */}
        <LeatherCard className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-1">Monthly Budget</p>
              <p className="font-display text-3xl font-semibold text-cream-50">
                {formatCurrency(dashboard?.monthlyBudget ?? 0)}
              </p>
            </div>
            <div className="leather-emboss-icon w-11 h-11 rounded-xl flex items-center justify-center text-gold-300">
              <PiggyBank size={20} />
            </div>
          </div>
          <ProgressBar value={usedPct} tone={usedPct > 90 ? 'danger' : usedPct > 70 ? 'warning' : 'default'} />
          <div className="flex justify-between mt-3 text-sm">
            <span className="text-cream-50/60">Used: {formatCurrency(dashboard?.usedBudget ?? 0)}</span>
            <span className="text-gold-300 font-medium">Remaining: {formatCurrency(dashboard?.remainingBudget ?? 0)}</span>
          </div>
        </LeatherCard>

        {/* Savings */}
        <LeatherCard variant="olive">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs uppercase tracking-wide text-cream-50/50">Total Savings</p>
            <div className="leather-emboss-icon w-9 h-9 rounded-xl flex items-center justify-center text-gold-300">
              <Wallet size={16} />
            </div>
          </div>
          <p className="font-display text-2xl font-semibold text-cream-50">{formatCurrency(dashboard?.totalSavings ?? 0)}</p>
          <p className="text-xs text-cream-50/50 mt-2">Across all savings goals</p>
        </LeatherCard>

        {/* Monthly Expenses */}
        <LeatherCard>
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-2">Monthly Expenses</p>
          <p className="font-display text-2xl font-semibold text-cream-50">{formatCurrency(dashboard?.monthlyExpenses ?? 0)}</p>
        </LeatherCard>

        {/* Quick Actions */}
        <LeatherCard className="lg:col-span-2" hoverLift={false}>
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
            <GlassButton variant="primary" size="lg" onClick={() => openModal('add-income')} className="w-full sm:w-auto">
              <ArrowDownCircle size={18} /> Add Income
            </GlassButton>
            <GlassButton variant="primary" size="lg" onClick={() => openModal('add-expense')} className="w-full sm:w-auto">
              <ArrowUpCircle size={18} /> Add Expense
            </GlassButton>
            <GlassButton variant="ghost" size="lg" onClick={() => openModal('add-full-day')} className="col-span-2 sm:col-span-1 w-full sm:w-auto">
              <CalendarPlus size={18} /> Add Full Day Expenses
            </GlassButton>
            <GlassButton variant="ghost" size="lg" onClick={() => setCommandOpen(true)} className="w-full sm:w-auto">
              <Search size={18} /> Search
            </GlassButton>
          </div>
        </LeatherCard>

        {/* Weekly Spending */}
        <LeatherCard className="lg:col-span-2">
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-4">Weekly Spending</p>
          <div className="h-40 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard?.weeklySpending ?? []}>
                <defs>
                  <linearGradient id="weeklyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E0B872" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#E0B872" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'rgba(245,235,221,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(245,235,221,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="amount" name="Spent" stroke="#E0B872" strokeWidth={2.5} fill="url(#weeklyFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </LeatherCard>

        {/* Smart Insights */}
        <LeatherCard variant="olive">
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-3 flex items-center gap-1.5">
            <Sparkles size={13} className="text-gold-300" /> Smart Insights
          </p>
          <div className="flex flex-col gap-3">
            {(dashboard?.insights ?? []).length === 0 && (
              <p className="text-sm text-cream-50/45">Add a few transactions to unlock insights.</p>
            )}
            {(dashboard?.insights ?? []).map((insight, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-cream-50/85">
                <TrendingUp size={15} className="text-gold-300 shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </LeatherCard>

        {/* Recent Transactions */}
        <LeatherCard className="lg:col-span-3">
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-2">Recent Transactions</p>
          {(dashboard?.recentTransactions ?? []).length === 0 ? (
            <EmptyState
              icon={<Wallet size={22} />}
              title="No transactions yet"
              description="Add your first income or expense to see it here."
              actionLabel="Add Expense"
              onAction={() => openModal('add-expense')}
            />
          ) : (
            <div>
              {dashboard!.recentTransactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </LeatherCard>
      </div>
    </AppShell>
  );
}
