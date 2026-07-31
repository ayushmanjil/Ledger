import { Menu, Search, Sun, LogOut } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { GlassButton } from '@/components/ui/GlassButton';

export function Topbar({ title }: { title: string }) {
  const { theme, setTheme, setSidebarOpen, setCommandOpen } = useUIStore();
  const { user, logout } = useAuthStore();

  return (
    <div className="flex items-center justify-between mb-6 gap-3">
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden glass-surface rounded-full p-2.5 text-cream-50"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={18} />
        </button>
        <h1 className="font-display text-2xl font-semibold text-cream-50">{title}</h1>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setCommandOpen(true)}
          className="glass-surface hidden sm:flex items-center gap-2 rounded-full px-4 py-2 text-sm text-cream-50/60"
        >
          <Search size={15} />
          <span>Search</span>
          <kbd className="text-[10px] border border-white/15 rounded px-1">Ctrl K</kbd>
        </button>
        <button onClick={() => setCommandOpen(true)} className="sm:hidden glass-surface rounded-full p-2.5 text-cream-50">
          <Search size={16} />
        </button>
        <button
          onClick={() => {
            const themes = ['brown', 'maroon', 'olive', 'charcoal', 'navy', 'tan', 'espresso'] as const;
            const next = themes[(themes.indexOf(theme) + 1) % themes.length];
            setTheme(next);
          }}
          className="glass-surface rounded-full p-2.5 text-cream-50"
          title={`Theme: ${theme}`}
        >
          <Sun size={16} />
        </button>
        <div className="hidden md:flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full leather-emboss-icon flex items-center justify-center text-xs font-semibold text-gold-300">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="text-sm text-cream-50/80">{user?.name}</span>
        </div>
        <GlassButton size="sm" variant="ghost" onClick={logout} aria-label="Logout">
          <LogOut size={15} />
        </GlassButton>
      </div>
    </div>
  );
}
