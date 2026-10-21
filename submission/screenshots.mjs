// Takes README screenshots from the real production build. Run `npm run build` first.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { startPreview } from './serve.mjs';

const out = new URL('../docs/screenshots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(out, { recursive: true });
const { url, stop } = await startPreview();
const errors = [];
const browser = await chromium.launch();
try {
  // Desktop
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const d = await desktop.newPage();
  d.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  d.on('pageerror', (e) => errors.push(String(e)));
  await d.goto(url);
  await d.waitForSelector('.start');
  await d.screenshot({ path: out + '01-start-desktop.png' });

  await d.click('[data-sample="maple-court"]');
  await d.waitForSelector('.result');
  await d.waitForTimeout(400);
  await d.screenshot({ path: out + '02-result-desktop.png' });

  await d.click('.card-high .btn-quiet');
  await d.waitForTimeout(900);
  await d.screenshot({ path: out + '03-linked-desktop.png' });

  await d.click('text=Checklist');
  await d.waitForSelector('#checklist-dialog[open]');
  await d.screenshot({ path: out + '04-checklist-desktop.png' });
  await d.keyboard.press('Escape');

  await d.click('text=Deeper read');
  await d.waitForSelector('dialog[open]');
  await d.screenshot({ path: out + '05-deeper-read-desktop.png' });
  await d.keyboard.press('Escape');

  // Mobile
  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const m = await mobile.newPage();
  m.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  m.on('pageerror', (e) => errors.push(String(e)));
  await m.goto(url);
  await m.waitForSelector('.start');
  await m.screenshot({ path: out + '06-start-mobile.png' });
  await m.click('[data-sample="maple-court"]');
  await m.waitForSelector('.result');
  await m.screenshot({ path: out + '07-findings-mobile.png' });
  await m.click('.card-high .btn-quiet');
  await m.waitForTimeout(900);
  await m.screenshot({ path: out + '08-lease-mobile.png' });
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log('mobile horizontal overflow px:', overflow);
} finally {
  await browser.close();
  stop();
}
console.log('console errors:', errors.length ? errors : 'none');
