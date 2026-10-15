import { setRequestLocale } from 'next-intl/server';
import { CategoryManager } from '@/components/admin/category-manager';
import { getAdminCategories } from '@/lib/data/admin';

export default async function AdminCategoriesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const categories = await getAdminCategories();

  return (
    <div className="flex flex-col gap-6">
      <CategoryManager categories={categories} />
    </div>
  );
}
