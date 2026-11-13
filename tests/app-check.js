// Browser checks for COD SETTLE. Run: node tests/app-check.js [screenshot-dir]
const { chromium, devices } = require('playwright');
const path = require('path');
const assert = require('assert');
const fs = require('fs');
(async () => {
  const out = process.argv[2];
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  const b = await chromium.launch();
  for (const [dev, scheme] of [['iPhone 13', 'dark'], ['Pixel 7', 'light']]) {
    const ctx = await b.newContext({ ...devices[dev], colorScheme: scheme });
    const p = await ctx.newPage();
    await p.goto(url);
    const st = async () => [await p.textContent('#s-title'), (await p.textContent('#t-amount')).trim(), await p.textContent('#r-collected'), await p.textContent('#r-diff')];
    const fill = async (a, b2, c) => { await p.fill('#shopee', a); await p.fill('#tng', b2); await p.fill('#cash', c); };
    const shot = async (n) => out && p.screenshot({ path: `${out}/${scheme}-${n}.png`, fullPage: true });

    assert.deepStrictEqual(await st(), ['Enter all three amounts', 'RM—', '—', '—']);
    await shot('empty');
    await fill('500', '320.50', '179.50');
    assert.deepStrictEqual(await st(), ['Settlement balanced', 'RM320.50', 'RM 500.00', 'RM 0.00']);
    assert.strictEqual((await p.getAttribute('#transfer', 'class')).trim(), 'card transfer');
    await p.locator('#cash').blur(); await shot('ok');
    await fill('500', '300', '179.50');
    assert.deepStrictEqual(await st(), ['Short by RM 20.50', 'RM320.50', 'RM 479.50', 'RM 20.50']);
    assert.match(await p.getAttribute('#transfer', 'class'), /caution/);
    await p.locator('#cash').blur(); await shot('warn');
    await fill('500', '350', '179.50');
    assert.deepStrictEqual(await st(), ['Over by RM 29.50', 'RM320.50', 'RM 529.50', '−RM 29.50']);
    await fill('100', '0', '150');
    assert.deepStrictEqual(await st(), ['Cash is more than Shopee Total', 'RM—', 'RM 150.00', '−RM 50.00']);
    assert.strictEqual(await p.locator('#copy').count(), 0);
    await p.fill('#shopee', ''); await p.type('#shopee', '-12.345abc');
    assert.strictEqual(await p.inputValue('#shopee'), '12.34');
    await p.fill('#shopee', '0.1'); await p.fill('#tng', '0.2'); await p.fill('#cash', '0');
    assert.deepStrictEqual(await st(), ['Over by RM 0.10', 'RM0.10', 'RM 0.20', '−RM 0.10']);
    await p.reload();
    assert.strictEqual(await p.inputValue('#shopee'), '');
    assert.deepStrictEqual(await st(), ['Enter all three amounts', 'RM—', '—', '—']);
    // No horizontal scroll, no storage used
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.strictEqual(await p.evaluate(() => localStorage.length + sessionStorage.length), 0);
    // Without logo files, badges show
    assert.strictEqual(await p.locator('.logo.has-img').count(), 0);
    console.log(`PASS ${dev} (${scheme})`);
    await ctx.close();
  }
  // Logo slot picks up an official file when present
  const dir = path.resolve(__dirname, '..', 'logos'); const f = path.join(dir, 'maybank.png');
  const existed = fs.existsSync(f);
  if (!existed) { fs.mkdirSync(dir, { recursive: true }); fs.copyFileSync(path.resolve(__dirname, '..', 'apple-touch-icon.png'), f); }
  const p = await b.newPage(); await p.goto(url); await p.waitForTimeout(300);
  assert.strictEqual(await p.locator('.logo[data-name="maybank"].has-img').count(), 1);
  if (!existed) { fs.unlinkSync(f); try { fs.rmdirSync(dir); } catch (e) {} }
  console.log('PASS logo file loading');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
