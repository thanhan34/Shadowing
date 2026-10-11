const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const React = require('react');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
let menu = null;
let staff = false;
const filename = path.join(root, 'components/Navigation.tsx');
const mod = new Module(filename, module);
mod.require = name => {
  if (name === 'react') return { ...React, useState: () => [menu, () => {}] };
  if (name === 'next/router') return { useRouter: () => ({ pathname: '/shadowing/[id]', asPath: '/shadowing/example' }) };
  if (name === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
  if (name === './AuthControls') return { __esModule: true, default: () => React.createElement('div', { className: 'flex items-center gap-2' }, React.createElement('a', { href: '/pending-approval', className: 'ui-button-secondary min-h-[44px]' }, 'Tài khoản'), React.createElement('span', { style: { width: 28, height: 28 } }, 'PI')) };
  if (name === './AdminNavigation') return { __esModule: true, default: () => staff ? React.createElement('button', { className: 'admin-nav-trigger' }, React.createElement('span', { className: 'sr-only sm:not-sr-only' }, 'Quản trị')) : null };
  return require(name);
};
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
const { default: Navigation, NavigationGroups, isNavigationActive, NAV_GROUPS } = mod.exports;
assert.equal(NAV_GROUPS.flatMap(group => group.items).length, 8);
assert.ok(isNavigationActive('/shadowing/[id]', '/shadow'));
assert.ok(isNavigationActive('/readaloud/[id]', '/readaloud'));
assert.ok(!isNavigationActive('/shadowingsource', '/shadow'));
assert.ok(!isNavigationActive('/grammar', '/'));
const groups = renderToStaticMarkup(React.createElement(NavigationGroups, { pathname: '/shadowing/[id]', onNavigate() {} }));
assert.equal((groups.match(/aria-current="page"/g) || []).length, 1);
assert.equal((groups.match(/href=/g) || []).length, 8);
async function main() {
  const config = (await import(require('node:url').pathToFileURL(path.join(root, 'tailwind.config.js')))).default;
  const css = await require('postcss')([require('tailwindcss')(config)]).process(fs.readFileSync(path.join(root, 'styles/globals.css'), 'utf8'), { from: path.join(root, 'styles/globals.css') });
  const browser = await require('puppeteer').launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (staff of [false, true]) {
      for (const width of [320, 390, 768, 1280, 1440, 1920]) {
        await page.setViewport({ width, height: 900 });
        menu = width >= 1280 ? 'practice' : 'mobile';
        const html = renderToStaticMarkup(React.createElement(Navigation));
        await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css.css}</style></head><body>${html}</body></html>`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}, staff=${staff}`);
        assert.ok(await page.$eval('.navigation-panel', el => el.getBoundingClientRect().bottom <= innerHeight), `Panel exceeds viewport at ${width}`);
        assert.ok(await page.$eval('.navigation-item', el => el.getBoundingClientRect().height >= 44));
        await page.focus('.navigation-item');
        assert.equal(await page.$eval('.navigation-item', el => getComputedStyle(el).outlineStyle), 'solid');
        if (!staff) await page.screenshot({ path: path.join(require('node:os').tmpdir(), `navigation-ui-${width}.png`) });
      }
    }
    menu = 'community';
    const html = renderToStaticMarkup(React.createElement(Navigation));
    assert.equal((html.match(/rel="noopener noreferrer"/g) || []).length, 4);
  } finally { await browser.close(); }
  console.log('Navigation UI passed: all practice links, nested active routes, external links, keyboard focus, 44px targets and responsive layouts at 320/390/768/1280/1440/1920px, including staff controls. Auth and state mocked.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });