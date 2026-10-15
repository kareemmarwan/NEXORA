'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Menu, ShoppingCart, X, UserRound, LogOut, LayoutDashboard, Package, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { ThemeToggle } from '@/components/layout/theme';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

export interface HeaderUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: 'customer' | 'admin';
}

export function Header({ user }: { user: HeaderUser | null }) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const router = useRouter();
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success(t('logout'));
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  const navLinks = [
    { href: '/', label: tc('home') },
    { href: '/services', label: tc('services') },
    { href: '/orders', label: t('orders'), auth: true },
    { href: '/admin', label: t('admin'), admin: true },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
            AI
          </span>
          <span className="hidden sm:inline">{tc('shortName')}</span>
        </Link>

        <nav aria-label={t('menu')} className="hidden items-center gap-1 lg:flex">
          {navLinks
            .filter((l) => (!l.auth || user) && (!l.admin || user?.role === 'admin'))
            .map((l) => (
              <Link
                key={l.href}
                href={l.href as '/'}
                className="rounded-xl px-3 py-2 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher tone="onDark" />
          </div>
          <div className="hidden sm:block">
            <ThemeToggle tone="onDark" />
          </div>

          <Link
            href="/cart"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-white hover:bg-white/10"
            aria-label={`${t('cart')} (${itemCount})`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-navy">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 px-3 text-sm font-medium text-white hover:bg-white/10"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                <span className="hidden max-w-[100px] truncate md:inline">
                  {user.fullName ?? user.email ?? t('account')}
                </span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute end-0 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
                >
                  <Link
                    href="/account"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-muted"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    {t('account')}
                  </Link>
                  <Link
                    href="/orders"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-muted"
                  >
                    <Package className="h-4 w-4" aria-hidden="true" />
                    {t('orders')}
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-muted"
                    >
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      {t('admin')}
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-sm text-destructive hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button size="sm" asChild className="bg-white text-navy hover:bg-white/90 hover:text-navy">
                <Link href="/register">{t('register')}</Link>
              </Button>
            </div>
          )}

          <button
            type="button"
            className="tap-target rounded-xl border border-white/20 text-white hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-navy lg:hidden">
          <nav aria-label={t('menu')} className="container flex flex-col gap-1 py-4">
            {navLinks
              .filter((l) => (!l.auth || user) && (!l.admin || user?.role === 'admin'))
              .map((l) => (
                <Link
                  key={l.href}
                  href={l.href as '/'}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            {!user && (
              <div className="mt-2 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-white/20 px-3 py-3 text-center text-sm font-medium text-white hover:bg-white/10"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-white px-3 py-3 text-center text-sm font-medium text-navy hover:bg-white/90"
                >
                  {t('register')}
                </Link>
              </div>
            )}
            <div className={cn('mt-3 flex flex-wrap items-center gap-2 sm:hidden')}>
              <LanguageSwitcher tone="onDark" />
              <ThemeToggle tone="onDark" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
