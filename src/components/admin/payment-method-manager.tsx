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
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PaymentMethod, PaymentMethodType } from '@/types/database';

interface FormState {
  id?: string;
  type: PaymentMethodType;
  labelAr: string;
  labelEn: string;
  detailsAr: string;
  detailsEn: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: FormState = {
  type: 'manual',
  labelAr: '',
  labelEn: '',
  detailsAr: '',
  detailsEn: '',
  sortOrder: 0,
  isActive: true,
};

export function PaymentMethodManager({ methods }: { methods: PaymentMethod[] }) {
  const t = useTranslations('admin.paymentMethodForm');
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

  function openEdit(method: PaymentMethod) {
    setForm({
      id: method.id,
      type: method.type,
      labelAr: method.label_ar,
      labelEn: method.label_en,
      detailsAr: method.details_ar ?? '',
      detailsEn: method.details_en ?? '',
      sortOrder: method.sort_order,
      isActive: method.is_active,
    });
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/payment-methods', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          type: form.type,
          labelAr: form.labelAr,
          labelEn: form.labelEn,
          detailsAr: form.detailsAr || undefined,
          detailsEn: form.detailsEn || undefined,
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
    const res = await fetch('/api/admin/payment-methods', {
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
        <h2 className="text-lg font-semibold">{tc('actions')}</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('addMethod')}
        </Button>
      </div>

      {methods.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('labelAr')}</TableHead>
              <TableHead>{t('labelEn')}</TableHead>
              <TableHead>{t('type')}</TableHead>
              <TableHead>{t('sortOrder')}</TableHead>
              <TableHead>{t('isActive')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods.map((method) => (
              <TableRow key={method.id}>
                <TableCell className="font-medium">{method.label_ar}</TableCell>
                <TableCell>{method.label_en}</TableCell>
                <TableCell>
                  <Badge variant="muted">
                    {method.type === 'manual' ? t('typeManual') : t('typeStripe')}
                  </Badge>
                </TableCell>
                <TableCell>{method.sort_order}</TableCell>
                <TableCell>
                  {method.is_active ? (
                    <Badge variant="success">{tc('yes')}</Badge>
                  ) : (
                    <Badge variant="muted">{tc('no')}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(method)} aria-label={tc('edit')}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(method.id)} aria-label={tc('delete')}>
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
        title={form.id ? t('editMethod') : t('addMethod')}
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
            <Label htmlFor="pm-type">{t('type')}</Label>
            <Select
              id="pm-type"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PaymentMethodType }))}
            >
              <option value="manual">{t('typeManual')}</option>
              <option value="stripe">{t('typeStripe')}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="pm-sort">{t('sortOrder')}</Label>
            <Input
              id="pm-sort"
              type="number"
              min={0}
              dir="ltr"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="pm-label-ar" required>
              {t('labelAr')}
            </Label>
            <Input
              id="pm-label-ar"
              value={form.labelAr}
              onChange={(e) => setForm((f) => ({ ...f, labelAr: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="pm-label-en" required>
              {t('labelEn')}
            </Label>
            <Input
              id="pm-label-en"
              dir="ltr"
              value={form.labelEn}
              onChange={(e) => setForm((f) => ({ ...f, labelEn: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pm-details-ar">{t('detailsAr')}</Label>
            <Textarea
              id="pm-details-ar"
              rows={4}
              placeholder={t('detailsHint')}
              value={form.detailsAr}
              onChange={(e) => setForm((f) => ({ ...f, detailsAr: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pm-details-en">{t('detailsEn')}</Label>
            <Textarea
              id="pm-details-en"
              rows={4}
              dir="ltr"
              placeholder={t('detailsHint')}
              value={form.detailsEn}
              onChange={(e) => setForm((f) => ({ ...f, detailsEn: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
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
