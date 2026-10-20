/* Temporary visual verification script (not part of the app). */
const path = require('path');
const { chromium } = require('@playwright/test');

const OUT = path.join(__dirname, 'shots');

(async () => {
  let browser;
  const launchArgs = ['--disable-gpu', '--disable-dev-shm-usage', '--force-color-profile=srgb'];
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true, args: launchArgs });
  } catch (e) {
    console.log('msedge failed:', e.message.slice(0, 200));
    browser = await chromium.launch({ headless: true, args: launchArgs });
  }

  const page = await browser.newPage({
    viewport: { width: 720, height: 311 },
    colorScheme: 'dark',
    deviceScaleFactor: 1,
  });

  // AR (default locale) at reference size
  await page.goto('http://localhost:3000/ar', { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, 'ar-720x311.png') });

  // Mobile 375
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'ar-375.png') });
  const hasHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  console.log('mobile horizontal scroll:', hasHScroll);

  // EN
  await page.setViewportSize({ width: 720, height: 311 });
  await page.goto('http://localhost:3000/en', { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, 'en-720x311.png') });

  // Desktop 1440
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'en-1440x900.png') });

  await browser.close();
  console.log('DONE');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
