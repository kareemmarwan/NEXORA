'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Save, Loader2, UserRound, ShoppingCart, Package } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ManagedDocs, ManagedDocArticle, ManagedDocSection } from '@/lib/data/docs';

const ICONS = { user: UserRound, cart: ShoppingCart, package: Package } as const;

interface ArticleFormState {
  index: number | null; // null = new
  data: ManagedDocArticle;
}

export function DocsManager({ initialDocs }: { initialDocs: ManagedDocs }) {
  const t = useTranslations('admin.docsEditor');
  const router = useRouter();
  const [docs, setDocs] = React.useState<ManagedDocs>(initialDocs);
  const [articleForm, setArticleForm] = React.useState<ArticleFormState | null>(null);
  const [saving, setSaving] = React.useState(false);

  function updateSection(index: number, patch: Partial<ManagedDocSection>) {
    setDocs((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  function addSection() {
    setDocs((prev) => ({
      ...prev,
      sections: [...prev.sections, { id: '', titleAr: '', titleEn: '', icon: 'user' }],
    }));
  }

  function removeSection(index: number) {
    const section = docs.sections[index];
    if (!section) return;
    if (docs.articles.some((a) => a.sectionId === section.id)) {
      toast.error(t('sectionHasArticles'));
      return;
    }
    setDocs((prev) => ({ ...prev, sections: prev.sections.filter((_, i) => i !== index) }));
  }

  function saveArticle(data: ManagedDocArticle, index: number | null) {
    setDocs((prev) => {
      const articles =
        index === null
          ? [...prev.articles, data]
          : prev.articles.map((a, i) => (i === index ? data : a));
      return { ...prev, articles };
    });
    setArticleForm(null);
  }

  function removeArticle(index: number) {
    setDocs((prev) => ({ ...prev, articles: prev.articles.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docs),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error === 'invalid_input' ? t('validationError') : t('saveFailed'));
        return;
      }
      toast.success(t('saved'));
      router.refresh();
    } catch {
      toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  const sectionTitles = new Map(docs.sections.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      {/* Sections */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {docs.sections.map((section, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[auto_1fr_1fr_auto]">
              <Select
                value={section.icon}
                onChange={(e) => updateSection(index, { icon: e.target.value as ManagedDocSection['icon'] })}
                className="h-10 w-24"
                aria-label={t('icon')}
              >
                <option value="user">{t('iconUser')}</option>
                <option value="cart">{t('iconCart')}</option>
                <option value="package">{t('iconPackage')}</option>
              </Select>
              <div>
                <Label>{t('titleAr')}</Label>
                <Input value={section.titleAr} onChange={(e) => updateSection(index, { titleAr: e.target.value })} />
              </div>
              <div>
                <Label>{t('titleEn')}</Label>
                <Input value={section.titleEn} onChange={(e) => updateSection(index, { titleEn: e.target.value })} dir="ltr" />
              </div>
              <div className="flex items-end">
                <Button size="sm" variant="ghost" onClick={() => removeSection(index)} aria-label={t('deleteSection')}>
                  <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
          <div>
            <Button type="button" variant="outline" onClick={addSection}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('addSection')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Articles */}
      <Card>
        <CardHeader>
          <CardTitle>{t('articles')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {docs.articles.map((article, index) => {
            const Icon = ICONS[sectionTitles.get(article.sectionId)?.icon ?? 'user'];
            return (
              <div key={index} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{article.titleAr || 'â€”'}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      {article.sectionId} / {article.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setArticleForm({ index, data: article })}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    {t('edit')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeArticle(index)} aria-label={t('deleteArticle')}>
                    <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            );
          })}
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setArticleForm({
                  index: null,
                  data: {
                    slug: '',
                    sectionId: docs.sections[0]?.id ?? '',
                    titleAr: '',
                    titleEn: '',
                    descAr: '',
                    descEn: '',
                    readingMinutes: 5,
                    contentAr: '',
                    contentEn: '',
                  },
                })
              }
              disabled={docs.sections.length === 0}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('addArticle')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="self-start">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
        {t('saveAll')}
      </Button>

      {/* Article editor modal */}
      {articleForm && (
        <ArticleEditorModal
          state={articleForm}
          sections={docs.sections}
          onClose={() => setArticleForm(null)}
          onSave={saveArticle}
        />
      )}
    </div>
  );
}

function ArticleEditorModal({
  state,
  sections,
  onClose,
  onSave,
}: {
  state: ArticleFormState;
  sections: ManagedDocSection[];
  onClose: () => void;
  onSave: (data: ManagedDocArticle, index: number | null) => void;
}) {
  const t = useTranslations('admin.docsEditor');
  const [data, setData] = React.useState<ManagedDocArticle>(state.data);
  const [error, setError] = React.useState<string | null>(null);

  function set(patch: Partial<ManagedDocArticle>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
      setError(t('slugError'));
      return;
    }
    if (!data.titleAr.trim() || !data.titleEn.trim() || !data.sectionId) {
      setError(t('requiredFields'));
      return;
    }
    onSave(data, state.index);
  }

  return (
    <Modal open onClose={onClose} title={state.index === null ? t('addArticle') : t('edit')} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="doc-section">{t('section')}</Label>
            <Select id="doc-section" value={data.sectionId} onChange={(e) => set({ sectionId: e.target.value })}>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titleAr || s.titleEn || s.id}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="doc-slug">{t('slug')}</Label>
            <Input id="doc-slug" dir="ltr" value={data.slug} onChange={(e) => set({ slug: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="doc-titleAr">{t('titleAr')}</Label>
            <Input id="doc-titleAr" value={data.titleAr} onChange={(e) => set({ titleAr: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="doc-titleEn">{t('titleEn')}</Label>
            <Input id="doc-titleEn" dir="ltr" value={data.titleEn} onChange={(e) => set({ titleEn: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="doc-descAr">{t('descAr')}</Label>
            <Input id="doc-descAr" value={data.descAr} onChange={(e) => set({ descAr: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="doc-descEn">{t('descEn')}</Label>
            <Input id="doc-descEn" dir="ltr" value={data.descEn} onChange={(e) => set({ descEn: e.target.value })} />
          </div>
        </div>
        <div>
          <Label htmlFor="doc-contentAr">{t('contentAr')}</Label>
          <Textarea id="doc-contentAr" rows={10} dir="rtl" value={data.contentAr} onChange={(e) => set({ contentAr: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="doc-contentEn">{t('contentEn')}</Label>
          <Textarea id="doc-contentEn" rows={10} dir="ltr" value={data.contentEn} onChange={(e) => set({ contentEn: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4" aria-hidden="true" />
            {t('saveArticle')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
