import { create } from 'zustand';

export type Theme = 'brown' | 'maroon' | 'olive' | 'charcoal' | 'navy' | 'tan' | 'espresso';
export type CardStyle = 'leather' | 'glass';

const ALL_THEMES = ['theme-brown', 'theme-maroon', 'theme-olive', 'theme-charcoal', 'theme-navy', 'theme-tan', 'theme-espresso'] as const;

interface UIState {
  theme: Theme;
  cardStyle: CardStyle;
  sidebarOpen: boolean;
  commandOpen: boolean;
  activeModal: string | null;
  setTheme: (theme: Theme) => void;
  setCardStyle: (style: CardStyle) => void;
  toggleCardStyle: () => void;
  setSidebarOpen: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  openModal: (name: string) => void;
  closeModal: () => void;
}

const storedTheme = (localStorage.getItem('ledger_theme') as Theme) || 'brown';
const storedCardStyle = (localStorage.getItem('ledger_card_style') as CardStyle) || 'leather';

document.documentElement.classList.remove(...ALL_THEMES, 'dark', 'light');
document.documentElement.classList.add(`theme-${storedTheme}`);

if (storedCardStyle === 'glass') {
  document.documentElement.classList.add('mode-glass');
} else {
  document.documentElement.classList.remove('mode-glass');
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: storedTheme,
  cardStyle: storedCardStyle,
  sidebarOpen: false,
  commandOpen: false,
  activeModal: null,
  setTheme: (theme: Theme) => {
    localStorage.setItem('ledger_theme', theme);
    document.documentElement.classList.remove(...ALL_THEMES);
    document.documentElement.classList.add(`theme-${theme}`);
    set({ theme });
  },
  setCardStyle: (style: CardStyle) => {
    localStorage.setItem('ledger_card_style', style);
    if (style === 'glass') {
      document.documentElement.classList.add('mode-glass');
    } else {
      document.documentElement.classList.remove('mode-glass');
    }
    set({ cardStyle: style });
  },
  toggleCardStyle: () => {
    const nextStyle = get().cardStyle === 'leather' ? 'glass' : 'leather';
    get().setCardStyle(nextStyle);
  },
  setSidebarOpen: (v) => {
    if (v && !get().sidebarOpen) {
      window.history.pushState({ isOverlay: true, type: 'sidebar' }, '');
    }
    set({ sidebarOpen: v });
  },
  setCommandOpen: (v) => {
    if (v && !get().commandOpen) {
      window.history.pushState({ isOverlay: true, type: 'command' }, '');
    }
    set({ commandOpen: v });
  },
  openModal: (name) => {
    if (get().activeModal !== name) {
      window.history.pushState({ isOverlay: true, type: 'modal', name }, '');
    }
    set({ activeModal: name });
  },
  closeModal: () => {
    if (get().activeModal !== null) {
      set({ activeModal: null });
    }
  },
}));

// Listen to popstate event for mobile & desktop browser history navigation (Back / Forward buttons)
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const { activeModal, sidebarOpen, commandOpen } = useUIStore.getState();

    // If an overlay/modal/sidebar is open, close it first on Back button press instead of navigating away
    if (activeModal !== null) {
      useUIStore.setState({ activeModal: null });
      return;
    }
    if (sidebarOpen) {
      useUIStore.setState({ sidebarOpen: false });
      return;
    }
    if (commandOpen) {
      useUIStore.setState({ commandOpen: false });
      return;
    }
  });
}
