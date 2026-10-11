const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const React = require('react');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const samples = [{ id: 'a', name: 'Daily conversations', text: '', url: '' }, { id: 'b', name: 'Travel & culture / lesson', text: '', url: '' }, { id: 'c', name: 'A very long title '.repeat(12), text: '', url: '' }];
let states, cursor;
function load(file) {
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = module.paths;
  mod.require = name => {
    if (name === 'react') return { ...React, useState: () => [states[cursor++], () => {}] };
    if (name === 'next/head') return { __esModule: true, default: () => null };
    if (name === 'next/link') return { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { ...props, href }, children) };
    if (name.startsWith('.')) {
      const base = path.resolve(path.dirname(file), name);
      return load(['.tsx', '.ts', '.js'].map(ext => base + ext).find(fs.existsSync));
    }
    return require(name);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
  return mod.exports;
}
async function main() {
  const Page = load(path.join(root, 'pages/shadow.tsx')).default;
  function render(items = samples, query = '', loading = false, error = '') {
    cursor = 0;
    states = [query, items, loading, error, samples.length, 0, query, '/rung.jpg'];
    return renderToStaticMarkup(React.createElement(Page, { initialData: samples }));
  }
  const html = render();
  assert.ok(html.includes('SHADOWING STUDIO'));
  assert.ok(html.includes('background-image:url(/rung.jpg)'));
  assert.ok(html.includes('/shadowing/Travel%20%26%20culture%20%2F%20lesson'));
  assert.ok(render([], 'missing').includes('Chưa tìm thấy bài phù hợp'));
  assert.ok(render([], 'missing').includes('Xóa tìm kiếm'));
  assert.ok(render([], '', true).includes('shadow-skeleton'));
  assert.ok(render(samples, '', false, 'Offline').includes('Thử lại'));
  assert.ok(render(samples, '', false, 'Offline').includes('Daily conversations'));
  const config = (await import(require('node:url').pathToFileURL(path.join(root, 'tailwind.config.js')))).default;
  const css = await require('postcss')([require('tailwindcss')(config)]).process(fs.readFileSync(path.join(root, 'styles/globals.css'), 'utf8'), { from: path.join(root, 'styles/globals.css') });
  const browser = await require('puppeteer').launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css.css}</style></head><body>${html}</body></html>`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`);
      assert.equal(await page.$eval('.shadow-photo-background', el => getComputedStyle(el).position), 'fixed');
      assert.equal(await page.$eval('.shadow-photo-background', el => getComputedStyle(el).backgroundSize), 'cover');
      assert.equal(await page.$eval('.shadow-library-link', el => el.getAttribute('href')), '#shadow-library');
      assert.ok(await page.$eval('.shadow-library-link', el => el.getBoundingClientRect().height >= 44));
      assert.equal(await page.$eval('#shadow-search', el => el.getAttribute('type')), 'search');
      await page.focus('.shadow-lesson');
      assert.notEqual(await page.$eval('.shadow-lesson', el => getComputedStyle(el).boxShadow), 'none');
      await page.screenshot({ path: path.join(require('node:os').tmpdir(), `shadow-ui-${width}.png`), fullPage: true });
    }
  } finally { await browser.close(); }
  console.log('Shadow UI passed: encoded lesson links, empty/loading/error rendering, retained results on error, focus and responsive layout at 320/390/768/1440px. Mock state; no live API or Firebase.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });