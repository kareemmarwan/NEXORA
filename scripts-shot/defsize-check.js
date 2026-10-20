const { chromium } = require('@playwright/test');

(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu'] });
  const p = await b.newPage({ viewport: { width: 375, height: 812 }, colorScheme: 'dark' });
  await p.goto('http://localhost:3000/ar', { waitUntil: 'networkidle', timeout: 120000 });
  await p.waitForTimeout(1500);
  // Enlarge the gradient-def svg from 0x0 to 1x1 (visual no-op) to test the headless paint quirk
  await p.evaluate(() => {
    const defSvg = document.querySelector('#nexora-icon-gradient')?.closest('svg');
    if (defSvg) {
      defSvg.style.width = '1px';
      defSvg.style.height = '1px';
      defSvg.style.overflow = 'visible';
    }
  });
  await p.waitForTimeout(400);
  await p.screenshot({
    path: 'scripts-shot/shots/hamburger-deffix.png',
    clip: { x: 280, y: 0, width: 95, height: 64 },
  });
  await b.close();
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});
