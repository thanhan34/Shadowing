const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(filename) {
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = module.paths;
  instance.require = name => {
    if (name === 'next/head') return { __esModule: true, default: () => null };
    if (name === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
    if (name.startsWith('.')) {
      const base = path.resolve(path.dirname(filename), name);
      return load(['.tsx', '.ts'].map(ext => base + ext).find(file => fs.existsSync(file)));
    }
    return require(name);
  };
  instance._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
  return instance.exports;
}
const { PendingApprovalView } = load(path.resolve(__dirname, '../pages/pending-approval.tsx'));
const render = (access, busy = false, error = '') => renderToStaticMarkup(React.createElement(PendingApprovalView, { access, busy, error, onCheck() {} }));
const loading = render(null, true);
assert.ok(!loading.includes('Chờ phê duyệt'));
assert.ok(loading.includes('disabled'));
const pending = render({ approved: false, admin: false });
assert.ok(pending.includes('Chờ phê duyệt'));
assert.ok(!pending.includes('href="/shadow"'));
assert.ok(!pending.includes('href="/admin/students"'));
const approved = render({ approved: true, admin: false });
assert.ok(approved.includes('href="/shadow"'));
assert.ok(!approved.includes('href="/admin/students"'));
assert.ok(render({ approved: true, admin: true }).includes('href="/admin/students"'));
assert.ok(render(null, false, 'Test error').includes('role="alert"'));
assert.ok(!loading.includes('xác minh quyền'));
console.log('Pending approval: loading, pending, approved, admin and error rendering passed.');