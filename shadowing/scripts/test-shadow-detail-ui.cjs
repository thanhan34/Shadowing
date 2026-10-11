const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const React = require('react');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
let states, cursor;
function load(file) {
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = module.paths;
  mod.require = name => {
    if (name === 'react') return { ...React, useState: initial => [cursor < states.length ? states[cursor++] : initial, () => {}] };
    if (name === 'firebase/firestore') return {};
    if (name === '../firebase') return { db: {} };
    if (name === 'next/head') return { __esModule: true, default: () => null };
    if (name === 'next/link') return { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { ...props, href }, children) };
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
  const Page = load(path.join(root, 'components/ShadowingSentence.tsx')).default;
  const text = 'Original <span class="ra-link">linked words</span> / unchanged.';
  const data = [{ id: 'a', name: 'Practice lesson', text, url: '/sample.mp3', practice: 'https://example.com/practice' }];
  function render(mode, count = 0, sentences = [{ id: 's1', text, url: '/one.mp3' }, { id: 's2', text, url: '/two.mp3' }]) {
    cursor = 0;
    states = ['a', data[0].practice, sentences, mode, count, data[0].url, text];
    return renderToStaticMarkup(React.createElement(Page, { shadowingData: data }));
  }
  const config = (await import(require('node:url').pathToFileURL(path.join(root, 'tailwind.config.js')))).default;
  const css = await require('postcss')([require('tailwindcss')(config)]).process(fs.readFileSync(path.join(root, 'styles/globals.css'), 'utf8'), { from: path.join(root, 'styles/globals.css') });
  const browser = await require('puppeteer').launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const mode of [true, false]) {
      const html = render(mode);
      assert.ok(html.includes(text), 'Transcript markup must remain unchanged');
      assert.ok(html.includes(mode ? '1 Sentence Mode' : 'Next'));
      if (!mode) { assert.match(html, /autoplay=""/i); assert.match(html, /loop=""/); }
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewport({ width, height: 1000 });
        await page.setContent(`<html><head><style>${css.css}</style></head><body><div class="shadow-detail"><main class="px-4 py-8">${html}</main></div></body></html>`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow: ${width}`);
        assert.equal(await page.$eval('audio', el => el.controls), true);
        assert.equal(await page.$eval('.shadow-detail-back', el => el.getAttribute('href')), '/shadow');
        assert.equal(await page.$eval('audio + div button', el => el.getBoundingClientRect().height >= 44), true);
        await page.screenshot({ path: path.join(require('node:os').tmpdir(), `shadow-detail-${mode ? 'paragraph' : 'sentence'}-${width}.png`), fullPage: true });
      }
    }
    assert.match(render(true, 0, []), /disabled=""/);
    assert.match(render(false, 1), /2\/2/);
  } finally { await browser.close(); }
  console.log('Shadow detail passed: unchanged transcript markup, controls, audio attributes and responsive layout. Mock data; no live Firebase/audio playback.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });