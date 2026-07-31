import { useMemo, useEffect, useRef, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { LeatherCard } from '@/components/ui/LeatherCard';
import { ChartTooltip, CHART_COLORS } from '@/components/shared/ChartTooltip';
import { useFinanceStore } from '@/store/financeStore';
import { formatAxisCurrency } from '@/utils/format';

const AXIS_STYLE = { fill: 'rgba(245,235,221,0.5)', fontSize: 11 };

const Y_AXIS_COMMON = {
  tick: AXIS_STYLE,
  axisLine: false,
  tickLine: false,
  width: 55,
  tickFormatter: (v: number) => formatAxisCurrency(v),
  domain: [0, 'auto'] as [number, 'auto'],
  allowDecimals: false,
};

/** Only renders chart SVG when the card enters the viewport.
 *  Once visible it stays rendered (disconnect after first intersect). */
function useInView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export function AnalyticsPage() {
  const { transactions, wallets, goals } = useFinanceStore();

  const monthlySpending = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
      const m = t.date.slice(0, 7);
      map.set(m, (map.get(m) ?? 0) + t.amount);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([month, amount]) => ({ month, amount }));
  }, [transactions]);

  const weeklySpending = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map = new Map<string, number>();
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    transactions.filter((t) => t.type === 'expense' && new Date(t.date) >= weekAgo).forEach((t) => {
      const d = days[new Date(t.date).getDay()];
      map.set(d, (map.get(d) ?? 0) + t.amount);
    });
    return days.map((d) => ({ day: d, amount: map.get(d) ?? 0 }));
  }, [transactions]);

  const incomeVsExpense = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    transactions.forEach((t) => {
      const m = t.date.slice(0, 7);
      const entry = map.get(m) ?? { income: 0, expense: 0 };
      entry[t.type] += t.amount;
      map.set(m, entry);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6)
      .map(([month, v]) => ({ month, ...v }));
  }, [transactions]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter((t) => t.type === 'expense').forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const walletDistribution = useMemo(
    () => wallets.map((w) => ({ name: w.name, value: w.balance })),
    [wallets]
  );

  const savingsGrowth = useMemo(() => {
    let running = 0;
    return [...goals]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((g) => { running += g.savedAmount; return { name: g.title, total: running }; });
  }, [goals]);

  const avgDailySpending = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
      const m = t.date.slice(0, 7);
      const e = map.get(m) ?? { sum: 0, count: 0 };
      e.sum += t.amount; e.count += 1;
      map.set(m, e);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6)
      .map(([month, v]) => ({ month, avg: Math.round(v.sum / new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate()) }));
  }, [transactions]);

  const yearlyComparison = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
      const y = t.date.slice(0, 4);
      map.set(y, (map.get(y) ?? 0) + t.amount);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([year, amount]) => ({ year, amount }));
  }, [transactions]);

  return (
    <AppShell title="Analytics">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Monthly Spending">
          <AreaChart data={monthlySpending}>
            <defs><linearGradient id="ms" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C87137" stopOpacity={0.5} /><stop offset="100%" stopColor="#C87137" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis {...Y_AXIS_COMMON} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area type="monotone" dataKey="amount" name="Spent" stroke="#C87137" strokeWidth={2.5} fill="url(#ms)" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Weekly Spending">
          <BarChart data={weeklySpending}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="day" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis {...Y_AXIS_COMMON} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
            <Bar dataKey="amount" name="Spent" fill="#E0B872" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Income vs Expense">
          <BarChart data={incomeVsExpense}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis {...Y_AXIS_COMMON} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(245,235,221,0.6)' }} />
            <Bar dataKey="income" name="Income" fill="#8A9463" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="#C68958" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Spending by Category">
          <PieChart>
            <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(245,235,221,0.6)' }} />
          </PieChart>
        </ChartCard>

        <ChartCard title="Wallet Distribution">
          <PieChart>
            <Pie data={walletDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {walletDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(245,235,221,0.6)' }} />
          </PieChart>
        </ChartCard>

        <ChartCard title="Savings Growth">
          <LineChart data={savingsGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis {...Y_AXIS_COMMON} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Line type="monotone" dataKey="total" name="Total Saved" stroke="#E0B872" strokeWidth={2.5} dot={{ fill: '#E0B872', r: 4 }} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Average Daily Spending">
          <LineChart data={avgDailySpending}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis {...Y_AXIS_COMMON} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Line type="monotone" dataKey="avg" name="Avg / day" stroke="#C87137" strokeWidth={2.5} dot={{ fill: '#C87137', r: 4 }} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Yearly Comparison">
          <BarChart data={yearlyComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="year" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis {...Y_AXIS_COMMON} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
            <Bar dataKey="amount" name="Spent" fill="#8A9463" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>
    </AppShell>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  const { ref, inView } = useInView();
  return (
    <LeatherCard>
      <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-4">{title}</p>
      <div className="h-48 sm:h-64" ref={ref}>
        {inView && (
          <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        )}
      </div>
    </LeatherCard>
  );
}


