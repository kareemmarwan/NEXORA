'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolved: 'light' | 'dark';
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';
  return isDark ? ('dark' as const) : ('light' as const);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('system');
  const [resolved, setResolved] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const stored = window.localStorage.getItem('theme') as Theme | null;
    const initial: Theme = stored ?? 'system';
    setThemeState(initial);
    setResolved(applyTheme(initial));

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (localStorage.getItem('theme') === 'system' || !localStorage.getItem('theme')) {
        setResolved(applyTheme('system'));
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem('theme', next);
    setResolved(applyTheme(next));
  }, []);

  const value = React.useMemo(() => ({ theme, setTheme, resolved }), [theme, setTheme, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

const themeOrder: Theme[] = ['light', 'system', 'dark'];

export function ThemeToggle({
  className,
  tone = 'default',
}: {
  className?: string;
  tone?: 'default' | 'onDark';
}) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('common');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const current: Theme = mounted ? theme : 'system';
  const idx = themeOrder.indexOf(current);
  const next: Theme = themeOrder[(idx + 1) % themeOrder.length] ?? 'light';

  const icons: Record<Theme, typeof Sun> = {
    light: Sun,
    system: Monitor,
    dark: Moon,
  };
  const labels: Record<Theme, string> = {
    light: t('light'),
    system: t('system'),
    dark: t('dark'),
  };

  const Icon = icons[current];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${labels[current]} → ${labels[next]}`}
      title={labels[current]}
      className={cn(
        'nav-control-btn inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
        tone === 'onDark'
          ? 'text-white/70 hover:text-white hover:bg-white/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        className
      )}
    >
      <Icon className="h-[18px] w-[18px] transition-transform duration-300" aria-hidden="true" />
    </button>
  );
}