import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useUIStore } from '@/store/uiStore';
import { useFinanceStore } from '@/store/financeStore';
import { formatCurrency, formatDate } from '@/utils/format';
import { Receipt } from 'lucide-react';

export function SearchCommand() {
  const { commandOpen, setCommandOpen } = useUIStore();
  const { transactions } = useFinanceStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return transactions
      .filter((t) => t.category.toLowerCase().includes(q) || t.note?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, transactions]);

  return (
    <Modal open={commandOpen} onClose={() => setCommandOpen(false)} title="Search transactions" size="md">
      <Input
        autoFocus
        placeholder="Search by category or note…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="mt-4 flex flex-col gap-1 max-h-80 overflow-y-auto">
        {results.map((t) => (
          <button
            key={t.id}
            onClick={() => { setCommandOpen(false); navigate('/transactions'); }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left"
          >
            <span className="flex items-center gap-2.5 text-sm text-cream-50/85 min-w-0">
              <Receipt size={15} className="text-gold-300 shrink-0" />
              <span className="truncate">{t.category} — {t.note || 'No note'}</span>
            </span>
            <span className="text-xs text-cream-50/45 shrink-0 pl-7 sm:pl-0">{formatCurrency(t.amount)} · {formatDate(t.date)}</span>
          </button>
        ))}
        {query && results.length === 0 && (
          <p className="text-sm text-cream-50/45 text-center py-6">No matching transactions.</p>
        )}
      </div>
    </Modal>
  );
}
