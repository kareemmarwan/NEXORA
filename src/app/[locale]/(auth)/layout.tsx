import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/brand/logo';

export default function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="Home">
            <Logo tone="onLight" size="lg" />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
