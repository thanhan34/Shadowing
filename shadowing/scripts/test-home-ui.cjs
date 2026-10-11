const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const React = require('react');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
function load(file) {
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = module.paths;
  mod.require = name => {
    if (name === 'next/head') return { __esModule: true, default: () => null };
    if (name === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
    if (name === 'next/image') return { __esModule: true, default: ({ priority, ...props }) => React.createElement('img', props) };
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
  const Home = load(path.join(root, 'pages/index.tsx')).default;
  const html = renderToStaticMarkup(React.createElement(Home));
  const { HOME_PRACTICE_ITEMS, HOME_COMMUNITY_LINKS } = load(path.join(root, 'lib/homeNavigation.ts'));
  assert.equal(HOME_PRACTICE_ITEMS.length, 8);
  assert.equal(new Set(HOME_PRACTICE_ITEMS.map(item => item.href)).size, 8);
  for (const item of HOME_PRACTICE_ITEMS) assert.ok(html.includes(`href="${item.href}"`));
  assert.equal(HOME_COMMUNITY_LINKS.length, 3);
  assert.equal((html.match(/rel="noopener noreferrer"/g) || []).length, 3);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(html.includes('background-image:url(/rung.jpg)'));
  const config = (await import(require('node:url').pathToFileURL(path.join(root, 'tailwind.config.js')))).default;
  const css = await require('postcss')([require('tailwindcss')(config)]).process(fs.readFileSync(path.join(root, 'styles/globals.css'), 'utf8'), { from: path.join(root, 'styles/globals.css') });
  const browser = await require('puppeteer').launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewport({ width, height: 900 });
      await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css.css}</style></head><body>${html}</body></html>`);
      await page.evaluate(() => { history.replaceState(null, '', 'about:blank'); window.scrollTo(0, 0); });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`);
      assert.equal(await page.$eval('.home-photo-background', el => getComputedStyle(el).position), 'fixed');
      assert.equal(await page.$eval('#home-title', el => el.getBoundingClientRect().top > 88), true);
      assert.equal(await page.$$eval('.home-practice-card', elements => elements.length), 8);
      assert.equal(await page.$$eval('.home-cta, .home-practice-card, .home-community-link, .home-back-top', elements => elements.every(el => el.getBoundingClientRect().height >= 44)), true);
      await page.focus('.home-practice-card');
      assert.notEqual(await page.$eval('.home-practice-card', el => getComputedStyle(el).boxShadow), 'none');
      await page.click('a[href="#home-practice"]');
      assert.equal(await page.evaluate(() => location.hash), '#home-practice');
      assert.ok(await page.$eval('#home-practice', el => el.getBoundingClientRect().top >= 100));
      await page.screenshot({ path: path.join(require('node:os').tmpdir(), `home-ui-${width}.png`), fullPage: true });
    }
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    assert.equal(await page.$eval('.home-practice-card', el => getComputedStyle(el).transitionDuration), '0s');
  } finally { await browser.close(); }
  console.log('Home UI passed: eight practice routes, community links, semantic headings, retained photo, anchor navigation, focus, 44px targets, reduced motion and responsive layouts at 320/390/768/1024/1440/1920px.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });