import { NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, PiggyBank, Target, Receipt, Handshake,
  CalendarDays, BarChart3, Settings, X, LogOut,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, key: 'D' },
  { to: '/wallets', label: 'Wallets', icon: Wallet, key: 'W' },
  { to: '/budget', label: 'Budget', icon: PiggyBank, key: 'B' },
  { to: '/goals', label: 'Savings Goals', icon: Target, key: 'G' },
  { to: '/debts', label: 'Debts & Loans', icon: Handshake, key: 'L' },
  { to: '/transactions', label: 'Transactions', icon: Receipt, key: 'T' },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, key: 'C' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, key: 'A' },
  { to: '/settings', label: 'Settings', icon: Settings, key: 'S' },
];

function SidebarNavContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore();

  return (
    <div className="relative z-10 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1 shrink-0">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10 shrink-0" />
          <div>
            <h1 className="font-display text-lg font-semibold leading-tight text-cream-50">Ledger</h1>
            <p className="text-[11px] text-cream-50/45 leading-tight">expense tracking, refined</p>
          </div>
        </div>
        {onClose && (
          <button
            className="text-cream-50/60 hover:text-cream-50 transition-colors p-2 rounded-xl hover:bg-white/10"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto no-scrollbar pr-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => onClose && onClose()}
            className={({ isActive }) =>
              cn(
                'group flex items-center justify-between gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all',
                'border border-transparent',
                isActive
                  ? 'glass-surface text-cream-50'
                  : 'text-cream-50/60 hover:text-cream-50 hover:bg-white/5'
              )
            }
          >
            <span className="flex items-center gap-3">
              <Icon size={18} />
              {label}
            </span>
            <span className="hidden group-hover:inline text-[10px] text-cream-50/35 border border-white/10 rounded px-1.5 py-0.5">
              {key}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5 px-2 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 shrink-0 rounded-full leather-emboss-icon flex items-center justify-center text-xs font-semibold text-gold-300">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="truncate">
            <p className="text-sm font-medium text-cream-50/90 truncate">{user?.name}</p>
            <p className="text-[11px] text-cream-50/45 truncate">@{user?.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={logout} className="p-2 text-cream-50/60 hover:text-cream-50 transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Desktop Persistent Left Sidebar */
export function DesktopSidebar() {
  return (
    <aside className="leather-surface sticky top-4 left-4 z-20 h-[calc(100vh-2rem)] w-72 flex flex-col p-5 overflow-hidden">
      <div className="leather-stitch" />
      <SidebarNavContent />
    </aside>
  );
}

/** Mobile Overlay Drawer */
export function MobileSidebarDrawer() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return createPortal(
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Scrim — inline position so nothing can override it */}
          <motion.div
            key="mobile-scrim"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0, 0, 0, 0.68)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar panel — inline position bypasses leather-surface override */}
          <motion.aside
            key="mobile-drawer"
            className="leather-surface flex flex-col p-5 overflow-hidden shadow-2xl"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 'min(300px, 82vw)',
              zIndex: 9999,
              willChange: 'transform',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="leather-stitch" />
            <SidebarNavContent onClose={() => setSidebarOpen(false)} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
