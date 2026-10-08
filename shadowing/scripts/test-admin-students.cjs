const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

let states = [];
let cursor = 0;
function load(filename) {
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = module.paths;
  instance.require = name => {
    if (name === 'react') return { ...React, useState: initial => [cursor < states.length ? states[cursor++] : initial, () => {}], useEffect: () => {}, useCallback: callback => callback };
    if (name === 'next/head') return { __esModule: true, default: () => null };
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
const Students = load(path.resolve(__dirname, '../pages/admin/students.tsx')).default;
const users = [
  { id: '1', name: 'Đặng An', email: 'an@example.test', approved: false, admin: false, support: false },
  { id: '2', name: 'Binh', email: 'binh@example.test', approved: true, admin: false, support: false },
  { id: '3', name: 'Support', email: 'support@example.test', approved: false, admin: false, support: true },
  { id: '4', name: 'Admin', email: 'admin@example.test', approved: false, admin: true, support: false },
];
function render({ list = users, busy = false, error = '', query = '', filter = 'all', admin = true } = {}) {
  cursor = 0;
  states = [list, 0, list.length, busy, true, error, false, query, filter, '', admin];
  return renderToStaticMarkup(React.createElement(Students));
}
const all = render();
assert.ok(all.includes('Quản lý học viên'));
assert.equal((all.match(/<tbody>[\s\S]*<\/tbody>/)?.[0].match(/<tr>/g) || []).length, 4);
assert.ok(all.includes('Duyệt học viên Đặng An'));
assert.ok(all.includes('Thu hồi quyền của Binh'));
assert.ok(!all.includes('Thu hồi quyền của Admin'));
assert.ok(!all.includes('Cấp vai trò hỗ trợ cho Admin'));
assert.ok(!render({ admin: false }).includes('Cấp vai trò hỗ trợ cho'));
assert.ok(render({ query: 'dang an' }).includes('an@example.test'));
assert.ok(!render({ query: 'dang an' }).includes('binh@example.test'));
assert.ok(!render({ filter: 'pending' }).includes('support@example.test'));
assert.ok(render({ filter: 'approved' }).includes('support@example.test'));
assert.ok(render({ query: 'missing' }).includes('Không tìm thấy tài khoản phù hợp'));
assert.ok(render({ list: [] }).includes('Chưa có tài khoản trong trang này'));
assert.ok(render({ busy: true }).includes('aria-busy="true"'));
assert.ok(!render({ busy: true }).includes('<table'));
assert.ok(render({ error: 'Test error' }).includes('Thử lại'));
assert.ok(render({ error: 'Test error' }).includes('role="alert"'));
console.log('Admin students: rendering, Vietnamese search, filters, loading, errors, empty states and role controls passed.');