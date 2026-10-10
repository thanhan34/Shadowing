const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let states = [], cursor = 0;
function load(filename) {
  const m = new Module(filename, module);
  m.paths = module.paths;
  m.require = name => {
    if (name === 'react') return { ...React, useState: initial => [cursor < states.length ? states[cursor++] : initial, () => {}], useEffect() {} };
    if (name === 'next/head') return { __esModule: true, default: () => null };
    if (name.startsWith('.')) {
      const base = path.resolve(path.dirname(filename), name);
      return load(['.tsx', '.ts'].map(ext => base + ext).find(file => fs.existsSync(file)));
    }
    return require(name);
  };
  m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  return m.exports;
}
const Page = load(path.resolve(__dirname, '../pages/admin/wfd-mastery.tsx')).default;
const stats = { total: 2, practicedCount: 1, masteredCount: 1, masteryRate: 50, dueReviewCount: 1, overdueReviewCount: 0, retentionRate: 100, lastPracticedAt: 100 };
const user = { id: 'user_1', name: 'An', email: 'an@example.test', role: 'Học viên', stats };
const detail = { student: user, now: 1000, questions: [{ id: 'a', text: 'Example sentence.', progress: { stage: 2, mastered: true, lastPracticedAt: 100, nextReviewAt: 1000 } }, { id: 'b', text: 'New sentence.', progress: null }] };
function render({ users = [user], selected = '', data = null, filter = 'all', qFilter = 'all', busy = false, error = '' } = {}) {
  cursor = 0; states = [users, users.length, 0, '', '', filter, selected, data, qFilter, '', 0, busy, error, 0];
  return renderToStaticMarkup(React.createElement(Page));
}
assert.ok(render().includes('an@example.test'));
assert.ok(render().includes('50.0%'));
assert.ok(render({ users: [] }).includes('Không có tài khoản phù hợp'));
assert.ok(!render({ filter: 'new' }).includes('an@example.test'));
assert.ok(render({ busy: true }).includes('aria-busy="true"'));
assert.ok(!render({ busy: true }).includes('<table'));
assert.ok(render({ error: 'Failure' }).includes('role="alert"'));
assert.ok(render({ selected: user.id, data: detail }).includes('Example sentence.'));
assert.ok(!render({ selected: user.id, data: detail, qFilter: 'new' }).includes('Example sentence.'));
assert.ok(render({ selected: user.id, data: detail, qFilter: 'new' }).includes('New sentence.'));
console.log('Admin WFD mastery UI: overview, detail, filters, loading, errors and empty states passed (server-rendered).');