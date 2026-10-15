'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/types/database';

interface FormState {
  id?: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: FormState = {
  slug: '',
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
  icon: '',
  sortOrder: 0,
  isActive: true,
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const t = useTranslations('admin.categoryForm');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [busy, setBusy] = React.useState(false);

  function openCreate() {
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(category: Category) {
    setForm({
      id: category.id,
      slug: category.slug,
      nameAr: category.name_ar,
      nameEn: category.name_en,
      descriptionAr: category.description_ar ?? '',
      descriptionEn: category.description_en ?? '',
      icon: category.icon ?? '',
      sortOrder: category.sort_order,
      isActive: category.is_active,
    });
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          slug: form.slug,
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          descriptionAr: form.descriptionAr || undefined,
          descriptionEn: form.descriptionEn || undefined,
          icon: form.icon || undefined,
          sortOrder: form.sortOrder,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) {
        toast.error(te('generic'));
        return;
      }
      toast.success(form.id ? t('updated') : t('created'));
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(te('generic'));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t('deleteConfirm'))) return;
    const res = await fetch('/api/admin/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      toast.error(te('generic'));
      return;
    }
    toast.success(t('deleted'));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{tc('categories')}</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('addCategory')}
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('nameAr')}</TableHead>
              <TableHead>{t('nameEn')}</TableHead>
              <TableHead>{t('sortOrder')}</TableHead>
              <TableHead>{t('isActive')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name_ar}</TableCell>
                <TableCell>{category.name_en}</TableCell>
                <TableCell>{category.sort_order}</TableCell>
                <TableCell>
                  {category.is_active ? (
                    <Badge variant="success">{tc('yes')}</Badge>
                  ) : (
                    <Badge variant="muted">{tc('no')}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(category)} aria-label={tc('edit')}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(category.id)} aria-label={tc('delete')}>
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? t('editCategory') : t('addCategory')}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button onClick={submit} loading={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {tc('save')}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cat-name-ar" required>
              {t('nameAr')}
            </Label>
            <Input
              id="cat-name-ar"
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cat-name-en" required>
              {t('nameEn')}
            </Label>
            <Input
              id="cat-name-en"
              dir="ltr"
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cat-slug" required>
              Slug
            </Label>
            <Input
              id="cat-slug"
              dir="ltr"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cat-icon">{t('icon')}</Label>
            <Input
              id="cat-icon"
              dir="ltr"
              placeholder={t('iconHint')}
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cat-desc-ar">{t('descriptionAr')}</Label>
            <Textarea
              id="cat-desc-ar"
              rows={2}
              value={form.descriptionAr}
              onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cat-desc-en">{t('descriptionEn')}</Label>
            <Textarea
              id="cat-desc-en"
              rows={2}
              dir="ltr"
              value={form.descriptionEn}
              onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cat-sort">{t('sortOrder')}</Label>
            <Input
              id="cat-sort"
              type="number"
              min={0}
              dir="ltr"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            />
          </div>
          <div className="flex items-end">
            <Checkbox
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              label={t('isActive')}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
