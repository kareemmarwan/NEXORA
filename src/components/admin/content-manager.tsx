'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Save, Loader2, Settings, FileText, Globe, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ImageUploader } from '@/components/admin/image-uploader';
import type { SiteSetting, SiteContent } from '@/types/database';

// ─── Path helpers (dot notation, e.g. 'items.0.title') ───

function getIn(obj: unknown, path: string): unknown {
  let value: unknown = obj;
  for (const part of path.split('.')) {
    if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return value;
}

function setIn<T>(obj: T, path: string, value: unknown): T {
  const parts = path.split('.');
  if (obj === null || typeof obj !== 'object') obj = {} as T;
  const clone = Array.isArray(obj) ? [...(obj as unknown[])] : { ...(obj as Record<string, unknown>) };
  let current = clone as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    const next = current[key];
    if (Array.isArray(next)) current[key] = [...next];
    else if (next && typeof next === 'object') current[key] = { ...next };
    else {
      // Create missing container: numeric next part → array, else object.
      current[key] = /^\d+$/.test(parts[i + 1] ?? '') ? [] : {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]!] = value;
  return clone as T;
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const clone = [...arr];
  const [item] = clone.splice(from, 1);
  if (item !== undefined) clone.splice(to, 0, item);
  return clone;
}

// ─── Field specs ───

type FieldKind = 'text' | 'textarea' | 'commaList' | 'image';
interface FieldSpec {
  path: string;
  kind: FieldKind;
  labelAr: string;
  labelEn: string;
}
interface GroupSpec {
  path: string;
  itemFields: FieldSpec[];
  itemLabelAr: string;
  itemLabelEn: string;
  addLabelAr: string;
  addLabelEn: string;
  stringList?: boolean; // array of plain strings instead of objects
}
interface SectionSpec {
  labelAr: string;
  labelEn: string;
  fields: FieldSpec[];
  groups: GroupSpec[];
}

const CONTENT_SECTIONS: Record<string, SectionSpec> = {
  hero: {
    labelAr: 'القسم الرئيسي (Hero)',
    labelEn: 'Hero Section',
    fields: [
      { path: 'brandLabel', kind: 'text', labelAr: 'شارة العلامة', labelEn: 'Brand Label' },
      { path: 'title', kind: 'text', labelAr: 'العنوان الرئيسي', labelEn: 'Title' },
      { path: 'subtitle', kind: 'textarea', labelAr: 'العنوان الفرعي', labelEn: 'Subtitle' },
      { path: 'cta', kind: 'text', labelAr: 'زر الإجراء الأول', labelEn: 'Primary CTA' },
      { path: 'secondaryCta', kind: 'text', labelAr: 'زر الإجراء الثاني', labelEn: 'Secondary CTA' },
      { path: 'imageUrl', kind: 'image', labelAr: 'صورة الخلفية', labelEn: 'Background Image' },
    ],
    groups: [],
  },
  services: {
    labelAr: 'الخدمات',
    labelEn: 'Services',
    fields: [
      { path: 'title', kind: 'text', labelAr: 'عنوان القسم', labelEn: 'Section Title' },
      { path: 'subtitle', kind: 'textarea', labelAr: 'وصف القسم', labelEn: 'Section Subtitle' },
    ],
    groups: [
      {
        path: 'items',
        itemFields: [
          { path: 'title', kind: 'text', labelAr: 'عنوان الخدمة', labelEn: 'Service Title' },
          { path: 'desc', kind: 'textarea', labelAr: 'وصف الخدمة', labelEn: 'Service Description' },
        ],
        itemLabelAr: 'خدمة',
        itemLabelEn: 'Service',
        addLabelAr: 'إضافة خدمة',
        addLabelEn: 'Add service',
      },
    ],
  },
  howItWorks: {
    labelAr: 'كيف نعمل',
    labelEn: 'How It Works',
    fields: [
      { path: 'title', kind: 'text', labelAr: 'عنوان القسم', labelEn: 'Section Title' },
      { path: 'subtitle', kind: 'textarea', labelAr: 'وصف القسم', labelEn: 'Section Subtitle' },
    ],
    groups: [
      {
        path: 'steps',
        itemFields: [
          { path: 'title', kind: 'text', labelAr: 'عنوان الخطوة', labelEn: 'Step Title' },
          { path: 'desc', kind: 'textarea', labelAr: 'وصف الخطوة', labelEn: 'Step Description' },
        ],
        itemLabelAr: 'خطوة',
        itemLabelEn: 'Step',
        addLabelAr: 'إضافة خطوة',
        addLabelEn: 'Add step',
      },
    ],
  },
  whyUs: {
    labelAr: 'لماذا نحن',
    labelEn: 'Why Us',
    fields: [
      { path: 'title', kind: 'text', labelAr: 'عنوان القسم', labelEn: 'Section Title' },
      { path: 'subtitle', kind: 'textarea', labelAr: 'وصف القسم', labelEn: 'Section Subtitle' },
    ],
    groups: [
      {
        path: 'items',
        itemFields: [
          { path: 'title', kind: 'text', labelAr: 'عنوان الميزة', labelEn: 'Feature Title' },
          { path: 'desc', kind: 'textarea', labelAr: 'وصف الميزة', labelEn: 'Feature Description' },
        ],
        itemLabelAr: 'ميزة',
        itemLabelEn: 'Feature',
        addLabelAr: 'إضافة ميزة',
        addLabelEn: 'Add feature',
      },
    ],
  },
  audience: {
    labelAr: 'الجمهور المستهدف',
    labelEn: 'Target Audience',
    fields: [
      { path: 'title', kind: 'text', labelAr: 'عنوان القسم', labelEn: 'Section Title' },
      { path: 'subtitle', kind: 'textarea', labelAr: 'وصف القسم', labelEn: 'Section Subtitle' },
    ],
    groups: [
      {
        path: 'items',
        itemFields: [],
        itemLabelAr: 'عنصر',
        itemLabelEn: 'Item',
        addLabelAr: 'إضافة عنصر',
        addLabelEn: 'Add item',
        stringList: true,
      },
    ],
  },
  faq: {
    labelAr: 'الأسئلة الشائعة',
    labelEn: 'FAQ',
    fields: [
      { path: 'title', kind: 'text', labelAr: 'عنوان القسم', labelEn: 'Section Title' },
      { path: 'subtitle', kind: 'textarea', labelAr: 'وصف القسم', labelEn: 'Section Subtitle' },
    ],
    groups: [
      {
        path: 'items',
        itemFields: [
          { path: 'q', kind: 'text', labelAr: 'السؤال', labelEn: 'Question' },
          { path: 'a', kind: 'textarea', labelAr: 'الجواب', labelEn: 'Answer' },
        ],
        itemLabelAr: 'سؤال',
        itemLabelEn: 'Question',
        addLabelAr: 'إضافة سؤال',
        addLabelEn: 'Add question',
      },
    ],
  },
  pricing: {
    labelAr: 'الأسعار',
    labelEn: 'Pricing',
    fields: [
      { path: 'title', kind: 'text', labelAr: 'عنوان القسم', labelEn: 'Section Title' },
      { path: 'subtitle', kind: 'textarea', labelAr: 'وصف القسم', labelEn: 'Section Subtitle' },
    ],
    groups: [
      {
        path: 'plans',
        itemFields: [
          { path: 'name', kind: 'text', labelAr: 'اسم الباقة', labelEn: 'Plan Name' },
          { path: 'desc', kind: 'text', labelAr: 'وصف الباقة', labelEn: 'Plan Description' },
          { path: 'price', kind: 'text', labelAr: 'السعر (مثال: $49)', labelEn: 'Price (e.g. $49)' },
          { path: 'cta', kind: 'text', labelAr: 'نص الزر', labelEn: 'Button Text' },
          { path: 'features', kind: 'commaList', labelAr: 'الميزات (مفصولة بفاصلة)', labelEn: 'Features (comma separated)' },
        ],
        itemLabelAr: 'باقة',
        itemLabelEn: 'Plan',
        addLabelAr: 'إضافة باقة',
        addLabelEn: 'Add plan',
      },
    ],
  },
  cta: {
    labelAr: 'دعوة لاتخاذ إجراء',
    labelEn: 'Call to Action',
    fields: [
      { path: 'brandLabel', kind: 'text', labelAr: 'شارة العلامة', labelEn: 'Brand Label' },
      { path: 'title', kind: 'text', labelAr: 'العنوان الرئيسي', labelEn: 'Title' },
      { path: 'subtitle', kind: 'textarea', labelAr: 'العنوان الفرعي', labelEn: 'Subtitle' },
      { path: 'button', kind: 'text', labelAr: 'نص الزر', labelEn: 'Button Text' },
    ],
    groups: [],
  },
};

const SETTINGS_META: { key: string; labelAr: string; labelEn: string; kind: FieldKind }[] = [
  { key: 'site_name', labelAr: 'اسم الموقع', labelEn: 'Site Name', kind: 'text' },
  { key: 'site_tagline', labelAr: 'الشعار', labelEn: 'Tagline', kind: 'text' },
  { key: 'contact_email', labelAr: 'البريد الإلكتروني', labelEn: 'Contact Email', kind: 'text' },
  { key: 'contact_phone', labelAr: 'رقم الهاتف', labelEn: 'Contact Phone', kind: 'text' },
  { key: 'footer_description', labelAr: 'وصف الفوتر', labelEn: 'Footer Description', kind: 'textarea' },
  { key: 'social_x', labelAr: 'منصة X (تويتر)', labelEn: 'X (Twitter) URL', kind: 'text' },
  { key: 'social_instagram', labelAr: 'إنستغرام', labelEn: 'Instagram URL', kind: 'text' },
  { key: 'social_linkedin', labelAr: 'لينكد إن', labelEn: 'LinkedIn URL', kind: 'text' },
  { key: 'social_github', labelAr: 'GitHub', labelEn: 'GitHub URL', kind: 'text' },
  { key: 'social_facebook', labelAr: 'فيسبوك', labelEn: 'Facebook URL', kind: 'text' },
];

// ─── Component ───

interface ContentManagerProps {
  settings: SiteSetting[];
  contents: SiteContent[];
}

export function ContentManager({ settings: initialSettings, contents: initialContents }: ContentManagerProps) {
  const t = useTranslations('admin.contentForm');
  const te = useTranslations('errors');
  const router = useRouter();

  const [settings, setSettings] = React.useState<Record<string, { ar: string; en: string }>>(() => {
    const map: Record<string, { ar: string; en: string }> = {};
    for (const s of initialSettings) {
      map[s.key] = { ar: s.value_ar, en: s.value_en };
    }
    return map;
  });

  const [contents, setContents] = React.useState<Record<string, { ar: unknown; en: unknown }>>(() => {
    const map: Record<string, { ar: unknown; en: unknown }> = {};
    for (const c of initialContents) {
      map[c.key] = { ar: c.content_ar, en: c.content_en };
    }
    return map;
  });

  const [busy, setBusy] = React.useState(false);

  function updateSetting(key: string, lang: 'ar' | 'en', value: string) {
    setSettings((prev) => ({ ...prev, [key]: { ...prev[key]!, [lang]: value } }));
  }

  function updateContent(key: string, lang: 'ar' | 'en', value: unknown) {
    setContents((prev) => ({ ...prev, [key]: { ...prev[key]!, [lang]: value } }));
  }

  async function saveAll() {
    setBusy(true);
    try {
      const settingsPayload = Object.entries(settings)
        .filter(([, v]) => v)
        .map(([key, v]) => ({ type: 'setting' as const, key, valueAr: v.ar, valueEn: v.en }));

      const contentsPayload = Object.entries(contents)
        .filter(([, v]) => v && (v.ar || v.en))
        .map(([key, v]) => ({
          type: 'content' as const,
          key,
          contentAr: (v.ar ?? {}) as Record<string, unknown>,
          contentEn: (v.en ?? {}) as Record<string, unknown>,
        }));

      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsPayload, contents: contentsPayload }),
      });

      if (!res.ok) {
        toast.error(te('generic'));
        return;
      }

      toast.success(t('saved'));
      router.refresh();
    } catch {
      toast.error(te('generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={saveAll} loading={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {t('saveAll')}
        </Button>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 me-2" />
            {t('settingsTab')}
          </TabsTrigger>
          <TabsTrigger value="content">
            <FileText className="h-4 w-4 me-2" />
            {t('contentTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>{t('generalSettings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {SETTINGS_META.map(({ key, labelAr, labelEn, kind }) => (
                  <div key={key} className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
                    {(['ar', 'en'] as const).map((lang) => (
                      <div key={lang}>
                        <Label htmlFor={`setting-${key}-${lang}`}>
                          {lang === 'ar' ? `${labelAr} (${t('arabic')})` : `${labelEn} (${t('english')})`}
                        </Label>
                        {kind === 'textarea' ? (
                          <Textarea
                            id={`setting-${key}-${lang}`}
                            rows={3}
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                            value={settings[key]?.[lang] ?? ''}
                            onChange={(e) => updateSetting(key, lang, e.target.value)}
                          />
                        ) : (
                          <Input
                            id={`setting-${key}-${lang}`}
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                            value={settings[key]?.[lang] ?? ''}
                            onChange={(e) => updateSetting(key, lang, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <div className="flex flex-col gap-4">
            {Object.entries(CONTENT_SECTIONS).map(([key, spec]) => (
              <SectionEditorCard
                key={key}
                spec={spec}
                content={contents[key] ?? { ar: {}, en: {} }}
                onUpdate={(lang, value) => updateContent(key, lang, value)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionEditorCard({
  spec,
  content,
  onUpdate,
}: {
  spec: SectionSpec;
  content: { ar: unknown; en: unknown };
  onUpdate: (lang: 'ar' | 'en', value: unknown) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card>
      <CardHeader className="cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span>{spec.labelAr}</span>
            <span className="text-sm text-muted-foreground">({spec.labelEn})</span>
          </div>
          <span className="text-sm text-muted-foreground">{expanded ? '▲' : '▼'}</span>
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="flex flex-col gap-5">
          {(['ar', 'en'] as const).map((lang) => (
            <FieldGroup key={lang} lang={lang} title={lang === 'ar' ? 'العربية' : 'English'}>
              {spec.fields.map((field) => (
                <PathField
                  key={field.path}
                  spec={field}
                  lang={lang}
                  obj={content[lang]}
                  onChange={(path, value) =>
                    onUpdate(lang, setIn((content[lang] ?? {}) as Record<string, unknown>, path, value))
                  }
                />
              ))}
              {spec.groups.map((group) => (
                <GroupEditor
                  key={group.path}
                  group={group}
                  lang={lang}
                  obj={content[lang]}
                  onChange={(path, value) =>
                    onUpdate(lang, setIn((content[lang] ?? {}) as Record<string, unknown>, path, value))
                  }
                />
              ))}
            </FieldGroup>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function FieldGroup({ lang, title, children }: { lang: 'ar' | 'en'; title: string; children: React.ReactNode }) {
  return (
    <div className={lang === 'en' ? 'rounded-xl border border-dashed border-border p-4' : ''}>
      {lang === 'en' && (
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      )}
      {children}
    </div>
  );
}

function PathField({
  spec,
  lang,
  obj,
  onChange,
}: {
  spec: FieldSpec;
  lang: 'ar' | 'en';
  obj: unknown;
  onChange: (path: string, value: unknown) => void;
}) {
  const value = (getIn(obj, spec.path) as string | undefined) ?? '';
  const label = lang === 'ar' ? spec.labelAr : spec.labelEn;

  if (spec.kind === 'image') {
    return (
      <div className={lang === 'en' ? 'mt-3' : ''}>
        <ImageUploader
          value={value || null}
          onChange={(url) => onChange(spec.path, url)}
          label={label}
          aspect="aspect-[16/6]"
        />
      </div>
    );
  }

  if (spec.kind === 'textarea') {
    return (
      <div>
        <Label>{label}</Label>
        <Textarea
          rows={3}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          value={value}
          onChange={(e) => onChange(spec.path, e.target.value)}
        />
      </div>
    );
  }

  if (spec.kind === 'commaList') {
    const listValue = Array.isArray(getIn(obj, spec.path))
      ? (getIn(obj, spec.path) as string[]).join(', ')
      : value;
    return (
      <div>
        <Label>{label}</Label>
        <Input
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          value={listValue}
          onChange={(e) =>
            onChange(
              spec.path,
              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
            )
          }
        />
      </div>
    );
  }

  return (
    <div>
      <Label>{label}</Label>
      <Input
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        value={value}
        onChange={(e) => onChange(spec.path, e.target.value)}
      />
    </div>
  );
}

function GroupEditor({
  group,
  lang,
  obj,
  onChange,
}: {
  group: GroupSpec;
  lang: 'ar' | 'en';
  obj: unknown;
  onChange: (path: string, value: unknown) => void;
}) {
  const items = (getIn(obj, group.path) as unknown[] | undefined) ?? [];
  const itemLabel = lang === 'ar' ? group.itemLabelAr : group.itemLabelEn;
  const addLabel = lang === 'ar' ? group.addLabelAr : group.addLabelEn;

  function setItems(next: unknown[]) {
    onChange(group.path, next);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function moveItem(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= items.length) return;
    setItems(arrayMove(items, index, to));
  }

  function addStringItem() {
    setItems([...items, '']);
  }

  function addObjectItem() {
    setItems([...items, {}]);
  }

  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">
        {itemLabel} ({items.length})
      </p>
      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {itemLabel} #{index + 1}
              </span>
              <div className="flex items-center gap-0.5">
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label="move up">
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} aria-label="move down">
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(index)} aria-label="remove">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
            {group.stringList ? (
              <Input
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                value={typeof item === 'string' ? item : ''}
                onChange={(e) => setItems(items.map((v, i) => (i === index ? e.target.value : v)))}
              />
            ) : (
              <div className="grid gap-3">
                {group.itemFields.map((field) => (
                  <PathField
                    key={field.path}
                    spec={{ ...field, path: `${group.path}.${index}.${field.path}` }}
                    lang={lang}
                    obj={obj}
                    onChange={onChange}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={group.stringList ? addStringItem : addObjectItem}>
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  );
}
