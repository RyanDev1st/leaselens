// Records the demo flow of the built app to submission/demo.webm at 1920x1080.
// Usage: npm run build && node submission/capture.mjs      (CAPTIONS=0 to record without on-screen captions)
// Follows submission/video-script.md with slow, deliberate pacing.
import { chromium } from 'playwright';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startPreview } from './serve.mjs';

const CAPTIONS = process.env.CAPTIONS !== '0';
const here = fileURLToPath(new URL('.', import.meta.url));
const outFile = join(here, 'demo.webm');
const tmp = mkdtempSync(join(tmpdir(), 'leaselens-video-'));

const { url, stop } = await startPreview(4174);
const browser = await chromium.launch();

// A realistic "own lease" PDF, made from text so the PDF has a real text layer.
const printCtx = await browser.newContext();
const printer = await printCtx.newPage();
await printer.setContent(`<html><body style="font:13pt Georgia;line-height:1.5;margin:40px">
<h2>LEASE AGREEMENT: 52 Orchard Row, Room 2</h2>
<p>1. Term</p><p>The lease runs for twelve (12) months from September 1.</p>
<p>2. Renewal</p><p>This lease will automatically renew for another twelve (12) months unless Tenant gives written notice at least ninety (90) days before the end of the term.</p>
<p>3. Rent</p><p>Rent is $980 per month. If rent is not received by the third day of the month, a late fee of $15 per day will be charged until paid.</p>
<p>4. Entry</p><p>Landlord may enter the room at any time without notice for inspections or showings.</p>
<p>5. Deposit</p><p>A non-refundable move-in fee of $250 is due at signing. A flat cleaning fee will be deducted from the deposit regardless of the condition of the room.</p>
<p>6. Roommates</p><p>All tenants are jointly and severally liable for the full rent and for any damage to the house.</p>
<p>7. Guests</p><p>Guests may not stay more than 3 nights in any 30-day period without Landlord's written consent.</p>
<p>8. Pets</p><p>Pets are not allowed. Tenant shall pay a $200 fee if an animal is found on the property.</p>
</body></html>`);
const ownLeasePdf = join(tmp, 'my-lease.pdf');
writeFileSync(ownLeasePdf, await printer.pdf({ format: 'A4' }));
await printCtx.close();

const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: tmp, size: { width: 1920, height: 1080 } },
  permissions: ['clipboard-read', 'clipboard-write'],
});
await context.addInitScript(({ captions }) => {
  window.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
      #__cursor{position:fixed;z-index:2147483647;width:22px;height:22px;margin:-4px 0 0 -4px;pointer-events:none;
        border-radius:50%;background:rgba(15,92,110,.28);border:2px solid #0f5c6e;transition:transform .08s}
      #__cursor.down{transform:scale(.7)}
      #__cap{position:fixed;z-index:2147483646;left:50%;bottom:44px;transform:translateX(-50%) translateY(10px);max-width:1280px;
        background:#1d1b16;color:#faf6ee;font:500 30px/1.35 'Source Serif 4',Georgia,serif;padding:16px 28px;border-radius:8px;
        opacity:0;transition:opacity .35s,transform .35s;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.25)}
      #__cap.on{opacity:1;transform:translateX(-50%) translateY(0)}
      #__card{position:fixed;inset:0;z-index:2147483645;background:#f1eee8;display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:18px;font-family:'Source Serif 4',Georgia,serif;color:#1d1b16;opacity:0;pointer-events:none;transition:opacity .5s}
      #__card.on{opacity:1}
      #__card h1{font-size:84px;margin:0;font-weight:700;letter-spacing:-.02em}
      #__card p{font-size:34px;margin:0;color:#34312a;max-width:1200px;text-align:center}`;
    document.head.append(style);
    const cursor = document.createElement('div');
    cursor.id = '__cursor';
    cursor.style.left = '-50px';
    document.body.append(cursor);
    addEventListener('mousemove', (e) => { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => cursor.classList.add('down'), true);
    addEventListener('mouseup', () => cursor.classList.remove('down'), true);
    const cap = document.createElement('div');
    cap.id = '__cap';
    cap.setAttribute('aria-hidden', 'true');
    document.body.append(cap);
    const card = document.createElement('div');
    card.id = '__card';
    card.setAttribute('aria-hidden', 'true');
    document.body.append(card);
    window.__caption = (t) => {
      if (!captions) return;
      if (!t) { cap.classList.remove('on'); return; }
      cap.textContent = t;
      cap.classList.add('on');
    };
    window.__titleCard = (h, p) => {
      if (!h) { card.classList.remove('on'); return; }
      card.innerHTML = '';
      const a = document.createElement('h1'); a.textContent = h;
      const b = document.createElement('p'); b.textContent = p || '';
      card.append(a, b);
      card.classList.add('on');
    };
  });
}, { captions: CAPTIONS });

const page = await context.newPage();
const hold = (ms) => page.waitForTimeout(ms);
const caption = (t) => page.evaluate((x) => window.__caption(x), t);
const titleCard = (h, p) => page.evaluate(([a, b]) => window.__titleCard(a, b), [h, p]);

async function glide(locator, { settle = 500 } = {}) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 45 });
  await hold(settle);
}
async function click(locator, opts) {
  await glide(locator, opts);
  await locator.click();
}
async function slowScroll(selector, by, ms) {
  await page.evaluate(
    ([sel, delta, duration]) =>
      new Promise((resolve) => {
        const el = sel ? document.querySelector(sel) : document.scrollingElement;
        const start = el.scrollTop;
        const t0 = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          el.scrollTop = start + delta * eased;
          p < 1 ? requestAnimationFrame(step) : resolve();
        };
        requestAnimationFrame(step);
      }),
    [selector, by, ms],
  );
}

await page.goto(url);
await page.waitForSelector('.start');
await page.mouse.move(960, 540);

// 0:00 Problem
await titleCard('LeaseLens', 'Read your lease before you sign it.');
await hold(5000);
await titleCard(null);
await hold(700);
await caption('Your first lease: 12 pages of dense text, signed under deadline pressure.');
await hold(6500);
await caption('LeaseLens checks it in your browser. Nothing is uploaded. No account. No key.');
await hold(6500);
await caption('');
await slowScroll(null, 380, 3500);
await hold(2500);
await slowScroll(null, -380, 2000);
await hold(800);

// 0:30 Try a sample
await caption('Try a sample. It is fictional, and it has a lot to look at.');
await hold(3000);
await click(page.locator('[data-sample="maple-court"]'));
await page.waitForSelector('.result');
await hold(1500);
await caption('Risk score, a mix of findings, and a first read of what to look at first.');
await hold(7000);

// 0:55 Highlights in place
await caption('Every risky sentence is highlighted where it sits, colour and underline by risk.');
await glide(page.locator('.paper-body'), { settle: 600 });
await slowScroll(null, 560, 5000);
await hold(2500);
await slowScroll(null, 700, 6000);
await hold(2500);
await caption('');

// 1:15 Linked cards
await slowScroll(null, -3000, 2500);
await hold(800);
await caption('Each finding has a plain-language explanation, what is normal, and why it matters.');
await hold(5500);
await click(page.locator('article.card').first().getByRole('button', { name: 'Show in lease' }));
await hold(3500);
await caption('One click jumps to the exact sentence in the lease.');
await hold(3500);

// 1:30 Negotiation message
await caption('And a polite, ready-to-send message to negotiate it.');
const firstCard = page.locator('article.card').nth(1);
await firstCard.scrollIntoViewIfNeeded();
await click(firstCard.locator('summary'));
await hold(5500);
await click(firstCard.getByRole('button', { name: 'Copy message' }));
await hold(3500);
await caption('Copied. Paste it into an email.');
await hold(2500);

// 1:45 Filter + all-in-one + checklist
await caption('Filter by risk, or copy one message covering every high and medium point.');
await click(page.getByRole('button', { name: /^High \d+/ }));
await hold(3500);
await click(page.getByRole('button', { name: /^All \d+/ }));
await hold(1000);
await click(page.getByRole('button', { name: /Copy one message/ }));
await hold(3500);
await caption('A checklist of questions to ask before signing. Print it or download it.');
await click(page.getByRole('button', { name: 'Checklist' }));
await page.waitForSelector('#checklist-dialog[open]');
await hold(5000);
await slowScroll('#checklist-dialog', 700, 4000);
await hold(2500);
await page.keyboard.press('Escape');
await hold(800);

// 2:05 Optional deeper read
await caption('Optional: a deeper read with your own Gemini key. Kept only in this tab, never required.');
await click(page.getByRole('button', { name: 'Deeper read' }));
await page.waitForSelector('dialog[open]');
await hold(6500);
await page.keyboard.press('Escape');
await hold(800);

// 2:15 A fairer lease
await caption('A fairer lease looks different: lower score, fewer flags.');
await click(page.getByRole('button', { name: 'New lease' }));
await page.waitForSelector('.start');
await hold(1000);
await click(page.locator('[data-sample="riverside-house"]'));
await page.waitForSelector('.result');
await hold(6500);

// 2:30 Your own lease, offline
await caption('Now your own lease. First, turn the network off.');
await click(page.getByRole('button', { name: 'New lease' }));
await page.waitForSelector('.start');
await context.setOffline(true);
await hold(4500);
await caption('Network off. Drop a PDF: it is read on this device.');
await page.setInputFiles('#lease-file', ownLeasePdf);
await page.waitForSelector('.result', { timeout: 30000 });
await hold(5500);
await caption('Still works, offline. The lease never left the browser.');
await slowScroll(null, 400, 3000);
await hold(5000);
await context.setOffline(false);

// 2:55 Close
await caption('');
await slowScroll(null, -2000, 1500);
await hold(500);
await titleCard('LeaseLens', 'Know what you are signing. Private, free, in your browser. Informational, not legal advice.');
await hold(6500);

const video = page.video();
await context.close();
await browser.close();
stop();
const saved = await video.path();
mkdirSync(here, { recursive: true });
copyFileSync(saved, outFile);
rmSync(tmp, { recursive: true, force: true });
console.log('saved', outFile, readdirSync(here).join(', '));
