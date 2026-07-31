import { useForm, useFieldArray } from 'react-hook-form';
import { useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { GlassButton } from '@/components/ui/GlassButton';
import { useFinanceStore } from '@/store/financeStore';
import { EXPENSE_CATEGORIES } from '@/types';
import { toPaise, todayISO } from '@/utils/format';
import { toast } from '@/components/ui/Toast';

interface RowValue { name: string; category: string; amount: number | ''; walletId: string; }
interface FormValues { date: string; rows: RowValue[]; }

const emptyRow = (walletId?: string): RowValue => ({ name: '', category: EXPENSE_CATEGORIES[0], amount: '', walletId: walletId ?? '' });

export function AddFullDayModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { wallets, addFullDayTransactions } = useFinanceStore();
  const { register, control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { date: todayISO(), rows: Array.from({ length: 5 }, () => emptyRow()) },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'rows' });

  useEffect(() => {
    if (open) reset({ date: todayISO(), rows: Array.from({ length: 5 }, () => emptyRow(wallets[0]?.id)) });
  }, [open]);

  const onSubmit = async (values: FormValues) => {
    const rows = values.rows
      .filter((r) => r.name.trim() && Number(r.amount) > 0 && r.walletId)
      .map((r) => ({
        note: r.name,
        category: r.category,
        amount: toPaise(Number(r.amount)),
        walletId: r.walletId,
        type: 'expense' as const,
      }));
    if (rows.length === 0) {
      toast('Add at least one valid expense row', 'error');
      return;
    }
    onClose();
    toast(`${rows.length} expenses added for the day`, 'success');
    addFullDayTransactions(values.date, rows).catch((err) => toast(`Failed to save expenses: ${err.message}`, 'error'));
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Full Day Expenses" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-wide text-cream-50/60 font-medium">Date</label>
          <Input type="date" className="w-48" value={watch('date')} {...register('date', { required: true })} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-cream-50/50 bg-white/5">
                <th className="px-3 py-2.5 font-medium">Expense Name</th>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 font-medium">Amount (₹)</th>
                <th className="px-3 py-2.5 font-medium">Wallet</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, idx) => (
                <tr key={field.id} className="border-t border-white/5">
                  <td className="px-3 py-2">
                    <Input placeholder="e.g. Lunch" {...register(`rows.${idx}.name` as const)} />
                  </td>
                  <td className="px-3 py-2 min-w-[140px]">
                    <Select {...register(`rows.${idx}.category` as const)}>
                      {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </td>
                  <td className="px-3 py-2 w-32">
                    <Input type="number" step="0.01" placeholder="0.00" {...register(`rows.${idx}.amount` as const)} />
                  </td>
                  <td className="px-3 py-2 min-w-[140px]">
                    <Select {...register(`rows.${idx}.walletId` as const)}>
                      {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => remove(idx)} className="text-cream-50/40 hover:text-red-300">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() => append(emptyRow(wallets[0]?.id))}
          className="self-start flex items-center gap-1.5 text-sm text-gold-300 hover:text-gold-200 font-medium"
        >
          <Plus size={15} /> Add Row
        </button>

        <GlassButton type="submit" variant="primary" full disabled={isSubmitting}>
          Submit all expenses
        </GlassButton>
      </form>
    </Modal>
  );
}
