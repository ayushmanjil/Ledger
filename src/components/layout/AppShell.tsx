import { type ReactNode, useEffect } from 'react';
import { DesktopSidebar, MobileSidebarDrawer } from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ArrowDownCircle, ArrowUpCircle, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { useFinanceStore } from '@/store/financeStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SearchCommand } from '@/components/shared/SearchCommand';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { AddFullDayModal } from '@/components/transactions/AddFullDayModal';
import { cn } from '@/utils/cn';

export function AppShell({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  const location = useLocation();
  const { activeModal, openModal, closeModal, setSidebarOpen, cardStyle, toggleCardStyle } = useUIStore();
  const { fetchAll } = useFinanceStore();

  useEffect(() => { fetchAll(); }, []);

  useKeyboardShortcuts({
    onAddIncome: () => openModal('add-income'),
    onAddExpense: () => openModal('add-expense'),
    onAddFullDay: () => openModal('add-full-day'),
  });

  return (
    <div className="relative h-screen h-[100dvh] overflow-hidden bg-brown-950">
      <div className="flex h-full w-full overflow-hidden">

        {/* Desktop Sidebar: only visible on lg+ */}
        <div className="hidden lg:block w-72 shrink-0">
          <DesktopSidebar />
        </div>

        {/* Right column: sticky topbar (mobile) + scrollable content below */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">

          {/* ── Mobile Sticky Glass-Pill Top Bar ────────────────────────────
              shrink-0 sibling → never scrolls. Content scrolls beneath it. */}
          <div className="lg:hidden shrink-0 px-3 pt-3 pb-2">
            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl glass-surface">

              {/* Left: hamburger + page title */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  className="text-cream-50/80 hover:text-cream-50 transition-colors p-2 rounded-xl hover:bg-white/10 shrink-0 active:scale-95"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>
                <h1 className="font-display text-base sm:text-lg font-semibold text-cream-50 truncate">{title}</h1>
              </div>

              {/* Right: Leather/Glass style toggle + income/expense quick buttons OR per-page actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* UI Style Toggle button (Leather ⇄ Glass) */}
                <button
                  onClick={toggleCardStyle}
                  aria-label="Toggle Leather/Glass UI"
                  title={`Switch to ${cardStyle === 'leather' ? 'Glass UI' : 'Leather UI'}`}
                  className={cn(
                    "p-1.5 rounded-xl transition-all active:scale-95 text-xs font-semibold flex items-center justify-center border",
                    cardStyle === 'glass'
                      ? "text-gold-300 bg-gold-300/15 border-gold-300/30"
                      : "text-cream-50/70 hover:text-cream-50 hover:bg-white/10 border-transparent"
                  )}
                >
                  <Sparkles size={16} />
                </button>

                {actions ? (
                  /* Per-page contextual actions (e.g. "New Wallet", "Add Goal") */
                  actions
                ) : (
                  <>
                    {/* + Income */}
                    <button
                      onClick={() => openModal('add-income')}
                      aria-label="Add income"
                      title="Add Income"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 text-olive-400 border border-olive-400/30 bg-olive-400/10 hover:bg-olive-400/20"
                    >
                      <ArrowDownCircle size={14} />
                      <span className="hidden sm:inline">Income</span>
                    </button>
                    {/* − Expense */}
                    <button
                      onClick={() => openModal('add-expense')}
                      aria-label="Add expense"
                      title="Add Expense"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 text-tan-300 border border-tan-300/30 bg-tan-300/10 hover:bg-tan-300/20"
                    >
                      <ArrowUpCircle size={14} />
                      <span className="hidden sm:inline">Expense</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Scrollable Content Area ──────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto min-w-0 no-scrollbar flex flex-col">
            <main className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 pb-10 max-w-[1400px] mx-auto w-full relative flex-1 flex flex-col">

              {/* Desktop-only page-level actions float at top-right */}
              {actions && (
                <div className="hidden lg:flex absolute top-4 right-8 z-10 items-center gap-3">
                  {actions}
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex-1 flex flex-col min-h-0 w-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Drawer — portal-rendered to document.body */}
      <MobileSidebarDrawer />

      <SearchCommand />
      <TransactionModal open={activeModal === 'add-income'} onClose={closeModal} type="income" />
      <TransactionModal open={activeModal === 'add-expense'} onClose={closeModal} type="expense" />
      <AddFullDayModal open={activeModal === 'add-full-day'} onClose={closeModal} />
    </div>
  );
}
