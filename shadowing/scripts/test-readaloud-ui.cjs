const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const React = require('react');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const samples = [{ id: 'a', ID: '#1', text: 'Students should / check the library opening hours.', vietnameseTranslation: 'Sinh viên nên kiểm tra giờ mở cửa của thư viện.' }, { id: 'b', text: 'A passage without chunking.' }];
let states, cursor, highlight = true;
function load(file) {
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = module.paths;
  mod.require = name => {
    if (name === 'react') return { ...React, useState: () => [states[cursor++], () => {}] };
    if (name === 'next/head') return { __esModule: true, default: () => null };
    if (name === 'next/router') return { useRouter: () => ({ isReady: true, query: {} }) };
    if (name === 'next/link') return { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { ...props, href: '/readaloud/' + href.query.id + '?' + new URLSearchParams(href.query) }, children) };
    if (name === 'firebase/firestore' || name.endsWith('/firebase')) return {};
    if (name.includes('ReadAloudHighlightTools')) {
      const actual = load(path.resolve(path.dirname(file), name + '.tsx'));
      return { ...actual, useReadAloudHighlightRules: () => ({ rules: [{ id: 's', pattern: 'Students', color: '#ff4d4d' }], isHighlightEnabled: highlight, setIsHighlightEnabled() {} }) };
    }
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
  const Page = load(path.join(root, 'pages/readaloud.tsx')).default;
  const render = (query = '', filter = 'with', loading = false, error = '', large = false) => {
    cursor = 0; states = [samples, query, filter, loading, error, large];
    return renderToStaticMarkup(React.createElement(Page));
  };
  const html = render();
  assert.ok(html.includes('color:#ff4d4d'));
  highlight = false;
  assert.ok(!render().includes('color:#ff4d4d'));
  highlight = true;
  assert.ok(!html.includes('A passage without chunking.'));
  assert.ok(render('', 'without').includes('A passage without chunking.'));
  assert.ok(render('missing').includes('Chưa tìm thấy đoạn phù hợp'));
  assert.ok(render('Sinh viên').includes('Mở bài luyện'));
  assert.ok(render('#1').includes('search=%231'));
  assert.ok(render('', 'with', true).includes('rs-skeleton'));
  assert.ok(render('', 'with', false, 'Offline').includes('Thử lại'));
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
      await page.click('.rs-settings summary'); await page.click('.rs-translation summary');
      assert.equal(await page.$$eval('details[open]', els => els.length), 2);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`);
      assert.equal(await page.$eval('.ra-open-lesson', el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
      assert.ok(await page.$eval('.ra-open-lesson', el => el.getAttribute('href').includes('chunking=with')));
      await page.click('.rs-settings summary'); await page.click('.rs-translation summary');
      await page.screenshot({ path: path.join(require('node:os').tmpdir(), `ra-ui-${width}.png`), fullPage: true });
    }
  } finally { await browser.close(); }
  console.log('Read Aloud passed: filter/search/translation search, highlight on/off rendering, state handling, link context, native disclosures and 320/390/768/1440px layout. Mock data and router; no live Firebase.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });