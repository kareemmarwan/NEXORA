import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/admin/page-header';
import { MediaManager } from '@/components/admin/media-manager';
import { getAdminMediaFiles } from '@/lib/data/admin';

export const dynamic = 'force-dynamic';

export default async function AdminMediaPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations('admin');

  const files = await getAdminMediaFiles().catch(() => []);

  return (
    <div>
      <PageHeader title={t('mediaTitle')} description={t('mediaDesc')} />
      <MediaManager initialFiles={files} />
    </div>
  );
}
