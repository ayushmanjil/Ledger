import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, Undo2 } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  onUndo?: () => void;
}

interface ToastState {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(message: string, type: ToastItem['type'] = 'info', onUndo?: () => void) {
  useToastStore.getState().push({ message, type, onUndo });
}

const icon = { success: CheckCircle2, error: XCircle, info: Info };

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-80">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icon[t.type];
          return (
            <motion.div
              key={t.id}
              className="glass-surface rounded-2xl px-4 py-3 flex items-center gap-3 text-sm text-cream-50"
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
            >
              <Icon size={18} className="shrink-0 text-gold-300" />
              <span className="flex-1">{t.message}</span>
              {t.onUndo && (
                <button
                  onClick={() => { t.onUndo?.(); dismiss(t.id); }}
                  className="flex items-center gap-1 text-gold-300 hover:text-gold-200 font-medium"
                >
                  <Undo2 size={14} /> Undo
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
