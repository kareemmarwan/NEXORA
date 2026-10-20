import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/admin/page-header';
import { BlogPostDeleteButton } from '@/components/admin/blog-post-actions';
import { Plus, Newspaper, Search } from 'lucide-react';
import { getAdminBlogPosts } from '@/lib/data/admin';
import { formatDate } from '@/lib/utils/format';
import { pick } from '@/lib/utils/pick';
import type { SupportedLocale } from '@/lib/utils/format';

export default async function AdminBlogPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { q?: string };
}) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const tb = await getTranslations('admin.blogForm');
  const tc = await getTranslations('common');

  const posts = await getAdminBlogPosts(searchParams.q ?? null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('blogList')}
        description={t('blogListDesc')}
        actions={
          <Button asChild>
            <Link href="/admin/blog/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('newPost')}
            </Link>
          </Button>
        }
      />

      <form action="/admin/blog" method="get" className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder={t('blogSearch')}
            className="h-10 w-full rounded-lg border border-input bg-background px-9 text-sm"
          />
        </div>
        <Button type="submit" variant="outline">
          {tc('search')}
        </Button>
      </form>

      <Card>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <EmptyState icon={Newspaper} title={t('noPosts')} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('postTitle')}</TableHead>
                  <TableHead>{tc('status')}</TableHead>
                  <TableHead>{tc('date')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {pick(post, 'title', locale)}
                      </Link>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        /blog/{post.slug}
                      </p>
                    </TableCell>
                    <TableCell>
                      {post.is_published ? (
                        <Badge variant="success">{tb('published')}</Badge>
                      ) : (
                        <Badge variant="muted">{tb('draft')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(post.created_at, locale)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/admin/blog/${post.id}`}>{tc('edit')}</Link>
                        </Button>
                        <BlogPostDeleteButton
                          postId={post.id}
                          title={pick(post, 'title', locale)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
