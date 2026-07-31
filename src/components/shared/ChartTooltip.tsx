import { formatCurrency } from '@/utils/format';

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-surface rounded-xl px-3.5 py-2.5 text-sm shadow-xl border border-white/10">
      <p className="text-cream-50/60 text-xs mb-1 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-cream-50 font-medium flex items-center gap-2 text-xs sm:text-sm">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || p.fill || '#E0B872' }} />
          <span>{p.name}:</span>
          <span className="text-gold-300 font-semibold">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export const CHART_COLORS = ['#C87137', '#E0B872', '#8A9463', '#C68958', '#A9793C', '#707B4E'];
