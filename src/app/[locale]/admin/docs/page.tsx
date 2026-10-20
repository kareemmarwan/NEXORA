import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/admin/page-header';
import { DocsManager } from '@/components/admin/docs-manager';
import { DOC_SECTIONS, getManagedDocs, type ManagedDocs } from '@/lib/data/docs';

export const dynamic = 'force-dynamic';

function fallbackToManaged(): ManagedDocs {
  return {
    sections: DOC_SECTIONS.map((s) => ({
      id: s.id,
      titleAr: s.title_ar,
      titleEn: s.title_en,
      icon: s.icon,
    })),
    articles: DOC_SECTIONS.flatMap((s) =>
      s.articles.map((a) => ({
        slug: a.slug,
        sectionId: a.section,
        titleAr: a.title_ar,
        titleEn: a.title_en,
        descAr: a.description_ar,
        descEn: a.description_en,
        readingMinutes: a.reading_minutes,
        contentAr: a.content_ar,
        contentEn: a.content_en,
      }))
    ),
  };
}

export default async function AdminDocsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations('admin');

  const managed = await getManagedDocs();
  const docs = managed ?? fallbackToManaged();

  return (
    <div>
      <PageHeader title={t('docsTitle')} description={t('docsDesc')} />
      <DocsManager initialDocs={docs} />
    </div>
  );
}
