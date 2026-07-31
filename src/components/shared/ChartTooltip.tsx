import { formatCurrency } from '@/utils/format';

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-surface rounded-xl px-3.5 py-2.5 text-sm">
      <p className="text-cream-50/60 text-xs mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-cream-50 font-medium">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export const CHART_COLORS = ['#C87137', '#E0B872', '#8A9463', '#C68958', '#A9793C', '#707B4E'];
