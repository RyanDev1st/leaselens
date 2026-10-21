// End-to-end checks against the production build (`npm run build` first).
// Run with: npm run e2e
import { chromium } from 'playwright';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startPreview } from './serve.mjs';

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
}

const { url, stop } = await startPreview(4175);
const browser = await chromium.launch();
const tmp = mkdtempSync(join(tmpdir(), 'leaselens-e2e-'));
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('request', (r) => requests.push({ method: r.method(), url: r.url() }));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && errors.push(m.text()));

  // 1. Sample flow
  await page.goto(url);
  await page.click('[data-sample="maple-court"]');
  await page.waitForSelector('.result');
  const marks = await page.locator('mark.hl').count();
  const cards = await page.locator('article.card').count();
  check('sample shows highlights and cards', marks >= 10 && cards >= 10, `marks=${marks} cards=${cards}`);
  const score = await page.locator('.score-num').innerText();
  check('score shown', Number(score) > 0 && Number(score) <= 100, `score=${score}`);

  // 2. Link card -> lease and mark -> card
  await page.locator('article.card').first().getByRole('button', { name: 'Show in lease' }).click();
  await page.waitForTimeout(700);
  const markSelected = await page.locator('mark.hl.is-selected').count();
  check('Show in lease selects and focuses the highlight', markSelected === 1);
  await page.locator('mark.hl').nth(3).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const cardSelected = await page.locator('article.card.is-selected').count();
  check('Enter on a highlight selects its card (keyboard)', cardSelected === 1);

  // 3. Copy message
  await page.locator('article.card').first().getByRole('button', { name: 'Copy message' }).click();
  await page.waitForTimeout(200);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check('Copy message puts a polite message on the clipboard', clip.includes("Hi [Landlord's name]") && clip.includes('[Your name]'));
  const toast = await page.locator('.toast.is-visible').innerText();
  check('copy confirmation announced', /copied/i.test(toast));

  // 4. Checklist dialog and download
  await page.getByRole('button', { name: 'Checklist' }).click();
  await page.waitForSelector('#checklist-dialog[open]');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download as Markdown' }).click()]);
  check('checklist downloads as .md', download.suggestedFilename().endsWith('.md'));
  await page.keyboard.press('Escape');

  // 5. Filters
  await page.getByRole('button', { name: /^High \d+/ }).click();
  const visible = await page.locator('article.card:visible').count();
  const highCount = await page.locator('.card-high').count();
  check('filter shows only high findings', visible === highCount && visible > 0);

  // 6. Paste flow + short input
  await page.getByRole('button', { name: 'New lease' }).click();
  await page.fill('#lease-text', 'Too short.');
  await page.getByRole('button', { name: 'Check my lease' }).click();
  check('short paste shows a designed alert', await page.locator('.alert').isVisible());
  await page.fill('#lease-text', 'Rent is $1,000 per month.\nThis lease will automatically renew for twelve months unless Tenant gives written notice at least sixty (60) days before the end of the term.\nLandlord may enter the unit at any time without notice. Tenant shall pay all of Landlord attorney fees. Tenant waives the right to a jury trial. Late fee of $10 per day applies.\nThe deposit is non-refundable. Guests may not stay more than 3 nights without written consent. '.repeat(2));
  await page.getByRole('button', { name: 'Check my lease' }).click();
  await page.waitForSelector('.result');
  check('pasted lease is analysed', (await page.locator('mark.hl').count()) >= 3);

  // 7. PDF: text PDF and scanned PDF
  const printer = await context.newPage();
  const leaseHtml = `<html><body style="font:14pt Georgia"><h2>RESIDENTIAL LEASE</h2><p>1. Automatic Renewal</p><p>At the end of the term this lease will automatically renew for a further twelve months unless Tenant gives written notice at least sixty (60) days before the end of the term.</p><p>2. Entry</p><p>Landlord may enter the apartment at any time without notice to inspect or show the apartment to prospective tenants.</p><p>3. Fees</p><p>Tenant pays a non-refundable move-in fee of $300 at signing and a flat cleaning fee regardless of condition.</p></body></html>`;
  await printer.setContent(leaseHtml);
  writeFileSync(join(tmp, 'text-lease.pdf'), await printer.pdf());
  await printer.setContent('<html><body><div style="width:400px;height:400px;background:#ccc"></div></body></html>');
  writeFileSync(join(tmp, 'scanned.pdf'), await printer.pdf());
  writeFileSync(join(tmp, 'notes.png'), Buffer.from('89504e470d0a1a0a', 'hex'));
  await printer.close();

  await page.getByRole('button', { name: 'New lease' }).click();
  await page.setInputFiles('#lease-file', join(tmp, 'text-lease.pdf'));
  await page.waitForSelector('.result', { timeout: 20000 });
  const pdfRules = await page.locator('article.card h3').allInnerTexts();
  check('text PDF is read in the browser and analysed', pdfRules.some((t) => /automatic renewal/i.test(t)) && pdfRules.some((t) => /entry/i.test(t)), pdfRules.join(' | '));

  await page.getByRole('button', { name: 'New lease' }).click();
  await page.setInputFiles('#lease-file', join(tmp, 'scanned.pdf'));
  await page.waitForSelector('.alert:not([hidden])', { timeout: 20000 });
  check('scanned PDF shows the scan message', /scan/i.test(await page.locator('.alert').innerText()));
  await page.setInputFiles('#lease-file', join(tmp, 'notes.png'));
  await page.waitForTimeout(300);
  check('wrong file type shows a message', /not supported/i.test(await page.locator('.alert').innerText()));

  // 8. Privacy: no lease data left the browser
  const external = requests.filter((r) => !r.url.startsWith(url) && !/fonts\.(googleapis|gstatic)\.com/.test(r.url) && !r.url.startsWith('data:') && !r.url.startsWith('blob:'));
  const posts = requests.filter((r) => r.method !== 'GET');
  check('no external requests other than fonts', external.length === 0, external.map((r) => r.url).join(','));
  check('no non-GET requests', posts.length === 0);
  check('no console or page errors', errors.length === 0, errors.join(' | '));

  // 9. Mobile layout
  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const m = await mobile.newPage();
  await m.goto(url);
  await m.click('[data-sample="riverside-house"]');
  await m.waitForSelector('.result');
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('375px: no horizontal overflow', overflow <= 0, `overflow=${overflow}`);
  check('375px: findings tab visible, lease hidden', (await m.locator('.paper').isHidden()) && (await m.locator('.findings').isVisible()));
  await m.getByRole('tab', { name: 'Lease' }).click();
  check('375px: lease tab shows the lease', await m.locator('.paper').isVisible());
} finally {
  await browser.close();
  stop();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
