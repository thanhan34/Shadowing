const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const Module = require('node:module');
const assert = require('node:assert/strict');
const React = require('react');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const samples = [{ id: 'a', ID: '#1', text: 'Students should / check the library opening hours.', vietnameseTranslation: 'Sinh viên nên kiểm tra giờ mở cửa của thư viện.' }, { id: 'b', text: 'A sentence without chunking.' }];
let states;
let cursor;
function load(file) {
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = module.paths;
  mod.require = name => {
    if (name === 'react') return { ...React, useState: () => [states[cursor++], () => {}] };
    if (name === 'next/head') return { __esModule: true, default: () => null };
    if (name === 'firebase/firestore' || name === '../firebase') return {};
    if (name.startsWith('.')) {
      const base = path.resolve(path.dirname(file), name);
      return load(['.tsx', '.ts'].map(ext => base + ext).find(fs.existsSync));
    }
    return require(name);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
  return mod.exports;
}
async function main() {
  const Page = load(path.join(root, 'pages/RepeatSentence.tsx')).default;
  const render = (query = '', filter = 'with', loading = false, error = '', large = false) => {
    cursor = 0;
    states = [samples, query, filter, loading, error, large];
    return renderToStaticMarkup(React.createElement(Page));
  };
  const html = render();
  assert.ok(html.includes('Students should'));
  assert.ok(!html.includes('A sentence without chunking.'));
  assert.ok(render('', 'without').includes('A sentence without chunking.'));
  assert.ok(render('missing').includes('Chưa tìm thấy câu phù hợp'));
  assert.ok(render('#1').includes('Students should'));
  assert.ok(render('', 'with', true).includes('rs-skeleton'));
  assert.ok(render('', 'with', false, 'Network unavailable').includes('Thử lại'));
  assert.ok(render('', 'with', false, '', true).includes('rs-text-large'));
  const config = (await import(require('node:url').pathToFileURL(path.join(root, 'tailwind.config.js')))).default;
  const css = await require('postcss')([require('tailwindcss')(config)]).process(fs.readFileSync(path.join(root, 'styles/globals.css'), 'utf8'), { from: path.join(root, 'styles/globals.css') });
  const browser = await require('puppeteer').launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css.css}</style></head><body>${html}</body></html>`);
      assert.equal(await page.$$eval('details[open]', els => els.length), 0);
      await page.click('.rs-settings summary');
      await page.click('.rs-translation summary');
      assert.equal(await page.$$eval('details[open]', els => els.length), 2);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`);
      const colors = await page.$eval('.ui-tab-active', el => ({ text: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }));
      assert.deepEqual(colors, { text: 'rgb(255, 255, 255)', background: 'rgb(252, 93, 1)' });
      await page.click('.rs-settings summary');
      await page.click('.rs-translation summary');
      await page.screenshot({ path: path.join(os.tmpdir(), `rs-ui-${width}.png`), fullPage: true });
    }
  } finally { await browser.close(); }
  console.log('Repeat Sentence UI passed: filters/search, loading/error/empty, large text markup, disclosure interactions, white/orange tabs, 320/390/768/1440px layout. Mock data; no live Firebase requests.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });