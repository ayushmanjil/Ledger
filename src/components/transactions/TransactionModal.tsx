import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { GlassButton } from '@/components/ui/GlassButton';
import { useFinanceStore } from '@/store/financeStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type Transaction, type TransactionType } from '@/types';
import { toPaise, toRupees, todayISO } from '@/utils/format';
import { toast } from '@/components/ui/Toast';

interface FormValues {
  category: string;
  customCategory?: string;
  amount: number;
  walletId: string;
  date: string;
  note: string;
}

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  type: TransactionType;
  editing?: Transaction | null;
}

export function TransactionModal({ open, onClose, type, editing }: TransactionModalProps) {
  const { wallets, addTransaction, updateTransaction } = useFinanceStore();
  const baseCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { date: todayISO() },
  });

  const selectedCategory = watch('category');

  useEffect(() => {
    if (selectedCategory === '__custom__') {
      setIsCustomCategory(true);
    } else {
      setIsCustomCategory(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (editing) {
      const isKnownCategory = baseCategories.includes(editing.category);
      if (isKnownCategory) {
        setIsCustomCategory(false);
        setCustomCategoryInput('');
        reset({
          category: editing.category,
          amount: toRupees(editing.amount),
          walletId: editing.walletId,
          date: editing.date,
          note: editing.note,
        });
      } else {
        setIsCustomCategory(true);
        setCustomCategoryInput(editing.category);
        reset({
          category: '__custom__',
          customCategory: editing.category,
          amount: toRupees(editing.amount),
          walletId: editing.walletId,
          date: editing.date,
          note: editing.note,
        });
      }
    } else {
      setIsCustomCategory(false);
      setCustomCategoryInput('');
      reset({ category: baseCategories[0], amount: undefined, walletId: wallets[0]?.id, date: todayISO(), note: '' });
    }
  }, [editing, open, type]);

  const onSubmit = async (values: FormValues) => {
    let finalCategory = values.category;
    if (values.category === '__custom__') {
      const trimmed = (values.customCategory || customCategoryInput).trim();
      if (!trimmed) {
        toast('Please enter a custom category name', 'error');
        return;
      }
      finalCategory = trimmed;
    }

    const payload = {
      type,
      category: finalCategory,
      amount: toPaise(Number(values.amount)),
      walletId: values.walletId,
      date: values.date,
      note: values.note,
    };

    onClose();

    if (editing) {
      toast('Transaction updated', 'success');
      addTransaction(payload).catch((err) => toast(`Failed to update: ${err.message}`, 'error'));
    } else {
      toast(`${type === 'income' ? 'Income' : 'Expense'} added`, 'success');
      addTransaction(payload).catch((err) => toast(`Failed to add: ${err.message}`, 'error'));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit transaction' : type === 'income' ? 'Add Income' : 'Add Expense'} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Category">
          <Select
            {...register('category', { required: true })}
            onChange={(e) => {
              setValue('category', e.target.value);
              if (e.target.value === '__custom__') {
                setIsCustomCategory(true);
              } else {
                setIsCustomCategory(false);
              }
            }}
          >
            {baseCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__custom__">+ Custom Category</option>
          </Select>
        </Field>

        {isCustomCategory && (
          <Field label="Custom Category Name">
            <Input
              placeholder="e.g. Consulting, Stipend, Crypto..."
              value={customCategoryInput}
              {...register('customCategory')}
              onChange={(e) => {
                setCustomCategoryInput(e.target.value);
                setValue('customCategory', e.target.value);
              }}
              autoFocus
            />
          </Field>
        )}

        <Field label="Amount (₹)" error={errors.amount?.message}>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 0.01, message: 'Enter a valid amount' },
            })}
          />
        </Field>

        <Field label="Wallet">
          <Select {...register('walletId', { required: true })}>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Date">
          <Input type="date" value={watch('date')} {...register('date', { required: true })} />
        </Field>

        <Field label="Expense Name (optional)">
          <Input placeholder="e.g. Coffee, Lunch... (optional)" {...register('note')} />
        </Field>

        <GlassButton type="submit" variant="primary" full disabled={isSubmitting}>
          {editing ? 'Save changes' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
        </GlassButton>
      </form>
    </Modal>
  );
}
