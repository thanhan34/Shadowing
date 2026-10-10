const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file) {
  const filename = path.resolve(__dirname, '..', file);
  const m = new Module(filename, module);
  m.require = name => {
    if (name === 'next/link') return { default: ({ children, prefetch, ...props }) => React.createElement('a', props, children), __esModule: true };
    if (name === '../lib/adminNavigation') return load('lib/adminNavigation.ts');
    return require(name);
  };
  m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  return m.exports;
}
const { filterAdminGroups, AdminNavigationLinks } = load('components/AdminNavigation.tsx');
assert.equal(filterAdminGroups('').length, 4);
assert.equal(filterAdminGroups('  DUYET HOC VIEN  ')[0].items[0].href, '/admin/students');
assert.equal(filterAdminGroups('khong-ton-tai').length, 0);
assert.equal(filterAdminGroups('WFD')[0].items.length, 5);
const render = query => renderToStaticMarkup(React.createElement(AdminNavigationLinks, { groups: filterAdminGroups(query), pathname: '/admin/students', onNavigate() {} }));
assert.equal((render('').match(/aria-current="page"/g) || []).length, 1);
assert.equal((render('').match(/href=/g) || []).length, 16);
assert.ok(render('WFD').includes('href="/admin/wfd-mastery"'));
assert.ok(render('WFD').includes('href="/admin/wfd-challenges"'));
assert.ok(render('khong-ton-tai').includes('role="status"'));
assert.ok(!render('Essay').includes('href="/admin/students"'));
console.log('Admin navigation: search, accent normalization, links, active state and empty state passed.');