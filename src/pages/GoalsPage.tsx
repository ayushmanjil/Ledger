import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { GlassButton } from '@/components/ui/GlassButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GoalCard } from '@/components/goals/GoalCard';
import { CreateGoalModal } from '@/components/goals/CreateGoalModal';
import { useFinanceStore } from '@/store/financeStore';
import { toast } from '@/components/ui/Toast';
import type { SavingsGoal } from '@/types';

export function GoalsPage() {
  const { goals, deleteGoal } = useFinanceStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<SavingsGoal | null>(null);

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteGoal(toDelete.id);
    toast(`"${toDelete.title}" removed`, 'info');
    setToDelete(null);
  };

  return (
    <AppShell title="Savings Goals" actions={
      <GlassButton variant="primary" onClick={() => setCreateOpen(true)}>
        <Plus size={16} /> New Goal
      </GlassButton>
    }>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target size={22} />}
          title="No savings goals yet"
          description="Set a target — a laptop, a trip, an emergency fund — and start contributing toward it."
          actionLabel="Create Goal"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => <GoalCard key={g.id} goal={g} onDelete={setToDelete} />)}
        </div>
      )}

      <CreateGoalModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete goal"
        message={`Delete "${toDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </AppShell>
  );
}
