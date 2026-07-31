import { cn } from '@/utils/cn';

const toneMap: Record<string, string> = {
  income: 'bg-olive-600/40 text-olive-400 border-olive-400/30',
  expense: 'bg-caramel-500/25 text-tan-300 border-caramel-500/30',
  neutral: 'bg-white/10 text-cream-50/70 border-white/15',
};

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'income' | 'expense' | 'neutral' }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', toneMap[tone])}>
      {children}
    </span>
  );
}
