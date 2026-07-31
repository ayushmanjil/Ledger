import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';

const ROUTE_KEYS: Record<string, string> = {
  t: '/transactions',
  w: '/wallets',
  b: '/budget',
  g: '/goals',
  c: '/calendar',
  a: '/analytics',
  s: '/settings',
};

interface ShortcutHandlers {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddFullDay: () => void;
}

/** Global shortcuts per spec: I/E/D open quick-add modals, letters navigate,
 * Ctrl+K opens search, Esc closes whatever's open. Disabled while typing
 * in an input/textarea so users can type "e" in a note field freely. */
export function useKeyboardShortcuts({ onAddIncome, onAddExpense, onAddFullDay }: ShortcutHandlers) {
  const navigate = useNavigate();
  const { setCommandOpen, closeModal, commandOpen, activeModal } = useUIStore();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

      if (e.key === 'Escape') {
        if (commandOpen) setCommandOpen(false);
        if (activeModal) closeModal();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }

      if (isTyping) return;

      const key = e.key.toLowerCase();
      if (key === 'i') return onAddIncome();
      if (key === 'e') return onAddExpense();
      if (key === 'd') return onAddFullDay();
      if (key in ROUTE_KEYS) return navigate(ROUTE_KEYS[key]);
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, commandOpen, activeModal]);
}
