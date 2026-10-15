import { test, expect } from '@playwright/test';

test('home page loads with hero CTA', async ({ page }) => {
  await page.goto('/ar');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('text=تصفح الخدمات')).toBeVisible();
});

test('services catalog loads and shows service cards', async ({ page }) => {
  await page.goto('/ar/services');
  await expect(page.locator('h1')).toContainText('خدمات');
  // Wait for service cards to appear (data fetched from DB).
  const cards = page.locator('article');
  await expect(cards.first()).toBeVisible({ timeout: 10_000 });
});

test('service detail page has Add to cart button', async ({ page }) => {
  await page.goto('/ar/services');
  // Click the first "عرض التفاصيل" link.
  const detailLink = page.locator('a:has-text("عرض التفاصيل")').first();
  await detailLink.click();
  await expect(page.locator('button:has-text("أضف إلى السلة")')).toBeVisible();
});

test('login page renders form fields', async ({ page }) => {
  await page.goto('/ar/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('button:has-text("تسجيل الدخول")')).toBeVisible();
});

test('language switcher changes locale', async ({ page }) => {
  await page.goto('/ar');
  const enButton = page.locator('button', { hasText: 'EN' }).first();
  await enButton.click();
  await expect(page).toHaveURL(/\/en/);
  await expect(page.locator('h1')).toContainText('AI agents');
});