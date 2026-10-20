import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/admin/page-header';
import { BlogForm } from '@/components/admin/blog-form';
import { getTranslations } from 'next-intl/server';

export default async function AdminNewBlogPostPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations('admin');

  return (
    <div>
      <PageHeader title={t('newPost')} description={t('newPostDesc')} />
      <BlogForm />
    </div>
  );
}
