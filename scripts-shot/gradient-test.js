const { chromium } = require('@playwright/test');

(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu'] });
  const p = await b.newPage({ viewport: { width: 375, height: 812 }, colorScheme: 'dark' });
  await p.goto('http://localhost:3000/ar', { waitUntil: 'networkidle', timeout: 120000 });
  await p.waitForTimeout(1500);
  const d = await p.evaluate(() => {
    const def = document.querySelector('#nexora-icon-gradient');
    const info = { defFound: !!def, stops: [] };
    if (def) {
      info.gradientUnits = def.getAttribute('gradientUnits');
      def.querySelectorAll('stop').forEach((s) => info.stops.push(s.getAttribute('stop-color')));
    }
    // Inject a test rect referencing the same gradient, next to the def
    const defSvg = def ? def.closest('svg') : null;
    if (defSvg) {
      const ns = 'http://www.w3.org/2000/svg';
      const test = document.createElementNS(ns, 'svg');
      test.setAttribute('style', 'position:fixed;top:0;left:200px;width:40px;height:40px;z-index:9999');
      const r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', '5');
      r.setAttribute('y', '5');
      r.setAttribute('width', '30');
      r.setAttribute('height', '30');
      r.setAttribute('fill', 'none');
      r.setAttribute('stroke', 'url(#nexora-icon-gradient)');
      r.setAttribute('stroke-width', '3');
      test.appendChild(r);
      document.body.appendChild(test);
    }
    // Also read the hamburger icon's matched stroke from CSSOM
    const icon = document.querySelector('header button[aria-label="فتح القائمة"] svg');
    if (icon) {
      info.iconStrokeInline = icon.getAttribute('stroke');
      info.iconClass = icon.getAttribute('class');
    }
    return info;
  });
  console.log(JSON.stringify(d, null, 1));
  await p.waitForTimeout(400);
  await p.screenshot({
    path: 'scripts-shot/shots/gradient-rect-test.png',
    clip: { x: 180, y: 0, width: 120, height: 60 },
  });
  await b.close();
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});
