import { setRequestLocale } from 'next-intl/server';

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
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
