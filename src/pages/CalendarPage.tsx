import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LeatherCard } from '@/components/ui/LeatherCard';
import { Modal } from '@/components/ui/Modal';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFinanceStore } from '@/store/financeStore';
import { formatCurrency, todayISO } from '@/utils/format';
import { cn } from '@/utils/cn';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarPage() {
  const { transactions } = useFinanceStore();
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayStr = todayISO();

  const spendingByDay = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
      map.set(t.date, (map.get(t.date) ?? 0) + t.amount);
    });
    return map;
  }, [transactions]);

  const maxSpend = Math.max(1, ...Array.from(spendingByDay.values()));

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (string | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return arr;
  }, [year, month]);

  const dayTransactions = selectedDate ? transactions.filter((t) => t.date === selectedDate) : [];

  return (
    <AppShell title="Calendar">
      <LeatherCard hoverLift={false} className="flex-1 flex flex-col h-full min-h-[75vh]" contentClassName="flex flex-col h-full flex-1">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 shrink-0">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="glass-surface rounded-full p-2.5 text-cream-50 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-cream-50 tracking-wide">
            {cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="glass-surface rounded-full p-2.5 text-cream-50 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 mb-2 sm:mb-3 shrink-0">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] sm:text-xs font-bold text-cream-50/70 py-2 uppercase tracking-wider glass-surface rounded-xl"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid — Expanded to fill all remaining height */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 flex-1 auto-rows-fr h-full">
          {cells.map((date, i) => {
            if (!date) return <div key={i} className="w-full h-full" />;
            const spend = spendingByDay.get(date) ?? 0;
            const intensity = spend / maxSpend;
            const dayNum = Number(date.slice(-2));
            const isToday = date === todayStr;

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'w-full h-full rounded-2xl flex flex-col items-center justify-between p-1.5 sm:p-3 transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden group min-h-[64px] sm:min-h-[90px]',
                  isToday && 'ring-2 ring-gold-300/90 ring-offset-2 ring-offset-leather-950 shadow-lg',
                  spend > 0
                    ? 'text-cream-50 border border-gold-300/30 shadow-md'
                    : 'glass-surface text-cream-50 hover:bg-white/15'
                )}
                style={
                  spend > 0
                    ? {
                        background: `radial-gradient(circle at 30% 20%, rgba(224,184,114,${0.28 + intensity * 0.45}), rgba(58,35,22,${0.75 + intensity * 0.25}))`,
                        boxShadow: `inset 0 1px 2px rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.35)`,
                      }
                    : undefined
                }
              >
                <div className="w-full flex items-center justify-between">
                  <span className={cn('text-sm sm:text-lg font-semibold tracking-tight', isToday ? 'text-gold-300 font-extrabold' : 'text-cream-50')}>
                    {dayNum}
                  </span>
                  {isToday && (
                    <span className="text-[10px] uppercase font-bold text-gold-300 bg-gold-400/20 px-1.5 py-0.5 rounded-full hidden sm:inline-block">
                      Today
                    </span>
                  )}
                </div>

                {spend > 0 ? (
                  <div className="w-full text-right mt-auto">
                    <span className="hidden sm:block text-xs sm:text-sm font-bold text-gold-300 drop-shadow-sm">
                      {formatCurrency(spend)}
                    </span>
                    <span className="sm:hidden text-[10px] font-bold text-gold-300 leading-tight block">
                      {formatCurrency(spend)}
                    </span>
                  </div>
                ) : (
                  <div className="h-3" />
                )}
              </button>
            );
          })}
        </div>
      </LeatherCard>

      <Modal open={!!selectedDate} onClose={() => setSelectedDate(null)} title={selectedDate ?? ''} size="md">
        {dayTransactions.length === 0 ? (
          <EmptyState icon={<CalendarDays size={22} />} title="No transactions" description="Nothing recorded on this day." />
        ) : (
          dayTransactions.map((tx) => <TransactionRow key={tx.id} tx={tx} compact />)
        )}
      </Modal>
    </AppShell>
  );
}
