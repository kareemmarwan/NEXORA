'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { Menu, ShoppingCart, X, LogOut, LayoutDashboard, Package, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { ThemeToggle } from '@/components/layout/theme';
import Image from 'next/image';
import logoImg from '@/app/logo.png';
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
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    { href: '/#about', label: t('about') },
    { href: '/#pricing', label: t('pricing') },
    { href: '/blog', label: t('blog') ?? 'Blog' },
    { href: '/cart', label: t('cart'), mobileOnly: true },
    { href: '/orders', label: t('orders'), auth: true },
    { href: '/admin', label: t('admin'), admin: true },
  ];

  const isHome = pathname === '/';
  const transparent = isHome && !scrolled;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        transparent ? 'bg-transparent' : 'glass-header shadow-lg shadow-black/20'
      )}
    >
      {/* Full-width container with max-width — direction follows <html> (rtl for ar, ltr for en) */}
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-6 px-6 sm:px-12">
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <Image
            src={logoImg}
            alt="NEXORA"
            priority
            className="h-6 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span
            dir="ltr"
            className="hidden font-nexora text-[15px] font-extrabold tracking-[1.5px] leading-none text-white sm:inline"
          >
            NEXORA
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label={t('menu')} className="hidden items-center gap-5 sm:flex sm:ms-14">
          {navLinks
            .filter((l) => !l.mobileOnly && (!l.auth || user) && (!l.admin || user?.role === 'admin'))
            .map((l) => {
              const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href as '/'}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative whitespace-nowrap text-xs font-medium transition-all duration-200',
                    active ? 'text-white' : 'text-white/60 hover:text-white'
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:ms-auto">
          {/* Utilities (language, theme, cart, account) */}
          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher tone="onDark" />

            <ThemeToggle tone="onDark" />

            {/* Divider */}
            <div className="mx-1 h-5 w-px bg-white/[0.08]" />

            {/* Cart */}
            <Link
              href="/cart"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
              aria-label={`${t('cart')} (${itemCount})`}
            >
              <ShoppingCart className="h-[18px] w-[18px]" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute -end-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-[#30C0F0] to-[#9048F0] px-1 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User / Auth */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium transition-all duration-200',
                    menuOpen
                      ? 'bg-white/[0.12] text-white'
                      : 'text-white/60 hover:bg-white/[0.08] hover:text-white'
                  )}
                >
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white">
                      {(user.fullName ?? user.email ?? 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute end-0 mt-2 w-52 animate-fade-in-scale overflow-hidden rounded-xl border border-white/[0.08] bg-navy/95 shadow-elevated-lg backdrop-blur-xl"
                  >
                    <div className="px-3.5 py-2.5 border-b border-white/[0.06]">
                      <p className="text-[13px] font-medium text-white truncate">
                        {user.fullName ?? user.email}
                      </p>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        {user.role === 'admin' ? 'Admin' : 'Customer'}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/account"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('account')}
                      </Link>
                      <Link
                        href="/orders"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors"
                      >
                        <Package className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('orders')}
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('admin')}
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-white/[0.06] py-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Get Started CTA */}
          <Link
            href="/register"
            className="hidden h-[26px] shrink-0 items-center rounded-full bg-gradient-to-r from-[#8456FC] to-[#30C0F0] px-4 text-[11px] font-bold text-white shadow-glow-sm transition-all hover:brightness-110 sm:inline-flex"
          >
            {t('getStarted')}
          </Link>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className={cn(
              'tap-target rounded-lg text-white transition-all duration-200 sm:hidden',
              mobileOpen
                ? 'bg-white/[0.12]'
                : 'hover:bg-white/[0.08]'
            )}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
          >
            {mobileOpen ? <X className="icon-solid h-5 w-5" /> : <Menu className="icon-solid h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'sm:hidden overflow-hidden transition-all duration-300 ease-out',
          mobileOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="border-t border-white/[0.06] bg-navy/95 backdrop-blur-xl">
          <nav aria-label={t('menu')} className="mx-auto max-w-[1200px] px-5 flex flex-col gap-0.5 py-3">
            {navLinks
              .filter((l) => (!l.auth || user) && (!l.admin || user?.role === 'admin'))
              .map((l) => {
                const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href as '/'}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}

            {/* Mobile Controls */}
            <div className="mt-3 flex items-center gap-2 pt-3 border-t border-white/[0.06]">
              <LanguageSwitcher tone="onDark" />
              <ThemeToggle tone="onDark" />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}