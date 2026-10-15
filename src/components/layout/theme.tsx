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

  const options = [
    { value: 'light' as const, icon: Sun, label: t('light') },
    { value: 'system' as const, icon: Monitor, label: t('system') },
    { value: 'dark' as const, icon: Moon, label: t('dark') },
  ];

  return (
    <div
      role="group"
      aria-label={t('theme')}
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border p-1',
        tone === 'onDark' ? 'border-white/20' : 'border-border',
        className
      )}
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-label={label}
          aria-pressed={mounted && theme === value}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            tone === 'onDark' ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-muted-foreground',
            mounted &&
              theme === value &&
              (tone === 'onDark' ? 'bg-white/15 text-white' : 'bg-muted text-foreground')
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
