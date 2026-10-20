import { setRequestLocale } from 'next-intl/server';
import { getAdminSiteSettings, getAdminSiteContent } from '@/lib/data/content';
import { ContentManager } from '@/components/admin/content-manager';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);

  const [settings, contents] = await Promise.all([
    getAdminSiteSettings(),
    getAdminSiteContent(),
  ]);

  return <ContentManager settings={settings} contents={contents} />;
}