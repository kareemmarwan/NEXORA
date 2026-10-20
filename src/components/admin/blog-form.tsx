'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/admin/image-uploader';
import { Markdown } from '@/components/ui/markdown';
import { createAdminSchemas, type BlogPostInput } from '@/lib/validation';
import { slugify } from '@/lib/utils/cn';
import type { BlogPost } from '@/types/database';

type FormValues = BlogPostInput;

export function BlogForm({ post }: { post?: BlogPost | null }) {
  const t = useTranslations('admin.blogForm');
  const te = useTranslations('errors');
  const router = useRouter();

  const schemas = React.useMemo(() => createAdminSchemas((key) => key), []);
  const [cover, setCover] = React.useState<string | null>(post?.cover_image_url ?? null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schemas.blogPostSchema),
    defaultValues: {
      slug: post?.slug ?? '',
      titleAr: post?.title_ar ?? '',
      titleEn: post?.title_en ?? '',
      excerptAr: post?.excerpt_ar ?? '',
      excerptEn: post?.excerpt_en ?? '',
      contentAr: post?.content_ar ?? '',
      contentEn: post?.content_en ?? '',
      coverImageUrl: post?.cover_image_url ?? null,
      tags: (post?.tags as string[] | null) ?? [],
      authorName: post?.author_name ?? '',
      readingMinutes: post?.reading_minutes ?? 5,
      isPublished: post?.is_published ?? false,
      publishedAt: post?.published_at ?? null,
    },
  });
  const { register } = form;
  const [tagsText, setTagsText] = React.useState(((post?.tags as string[] | null) ?? []).join(', '));

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      id: post?.id,
      coverImageUrl: cover,
      tags: tagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const res = await fetch('/api/admin/blog', {
      method: post ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error === 'slug_taken' ? t('slugTaken') : te('generic'));
      return;
    }

    toast.success(t('saved'));
    router.push('/admin/blog');
    router.refresh();
  }

  const watchTitleEn = form.watch('titleEn');

  React.useEffect(() => {
    if (!post && watchTitleEn) {
      const current = form.getValues('slug');
      if (!current) form.setValue('slug', slugify(watchTitleEn));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchTitleEn, post]);

  const watchContentAr = form.watch('contentAr');
  const watchContentEn = form.watch('contentEn');

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="titleAr">{t('titleAr')}</Label>
                  <Input id="titleAr" {...register('titleAr')} />
                </div>
                <div>
                  <Label htmlFor="titleEn">{t('titleEn')}</Label>
                  <Input id="titleEn" {...register('titleEn')} />
                </div>
              </div>
              <div>
                <Label htmlFor="slug">{t('slug')}</Label>
                <Input id="slug" dir="ltr" {...register('slug')} />
                {!post && <p className="mt-1 text-xs text-muted-foreground">{t('slugHint')}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="excerptAr">{t('excerptAr')}</Label>
                  <Textarea id="excerptAr" rows={3} {...register('excerptAr')} />
                </div>
                <div>
                  <Label htmlFor="excerptEn">{t('excerptEn')}</Label>
                  <Textarea id="excerptEn" rows={3} {...register('excerptEn')} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('content')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ar">
                <TabsList>
                  <TabsTrigger value="ar">{t('arabic')}</TabsTrigger>
                  <TabsTrigger value="en">{t('english')}</TabsTrigger>
                </TabsList>
                <TabsContent value="ar" className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="contentAr">{t('contentAr')}</Label>
                    <Textarea id="contentAr" rows={16} dir="rtl" {...register('contentAr')} />
                  </div>
                  <details className="rounded-xl border border-border bg-muted/20 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                      {t('preview')}
                    </summary>
                    <div className="mt-3">
                      <Markdown>{watchContentAr ?? ''}</Markdown>
                    </div>
                  </details>
                </TabsContent>
                <TabsContent value="en" className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="contentEn">{t('contentEn')}</Label>
                    <Textarea id="contentEn" rows={16} dir="ltr" {...register('contentEn')} />
                  </div>
                  <details className="rounded-xl border border-border bg-muted/20 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                      {t('preview')}
                    </summary>
                    <div className="mt-3">
                      <Markdown>{watchContentEn ?? ''}</Markdown>
                    </div>
                  </details>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('publishing')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPublished"
                  checked={form.watch('isPublished')}
                  onChange={(e) => form.setValue('isPublished', e.target.checked)}
                />
                <Label htmlFor="isPublished" className="cursor-pointer">
                  {t('publish')}
                </Label>
              </div>
              <div>
                <Label htmlFor="authorName">{t('author')}</Label>
                <Input id="authorName" {...register('authorName')} />
              </div>
              <div>
                <Label htmlFor="readingMinutes">{t('readingMinutes')}</Label>
                <Input id="readingMinutes" type="number" min={1} max={120} {...register('readingMinutes')} />
              </div>
              <div>
                <Label htmlFor="tags">{t('tags')}</Label>
                <Input
                  id="tags"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="ai, automation, agents"
                  dir="ltr"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('cover')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader value={cover} onChange={setCover} aspect="aspect-[16/9]" />
            </CardContent>
          </Card>

          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
            {form.formState.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {t('save')}
          </Button>
        </div>
      </div>
    </form>
  );
}
