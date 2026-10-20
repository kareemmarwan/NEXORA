import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { BlogForm } from '@/components/admin/blog-form';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { getAdminBlogPost } from '@/lib/data/admin';

export default async function AdminEditBlogPostPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(params.locale);
  const t = await getTranslations('admin');
  const tc = await getTranslations('common');
  const post = await getAdminBlogPost(params.id);
  if (!post) notFound();

  const Back = params.locale === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div>
      <PageHeader
        title={t('editPost')}
        description={post.title_en}
        actions={
          <Button variant="ghost" asChild>
            <Link href={`/blog/${post.slug}`} target="_blank">
              <Back className="h-4 w-4" aria-hidden="true" />
              {tc('viewSite')}
            </Link>
          </Button>
        }
      />
      <BlogForm post={post} />
    </div>
  );
}
