const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const assert = require('node:assert/strict');
function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const m = new Module(filename, module);
  m.require = name => mocks[name] || require(name);
  m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
  return m.exports;
}
const policy = load('lib/access.ts');
const groups = load('lib/adminNavigation.ts').ADMIN_NAV_GROUPS;
for (const group of groups) for (const item of group.items) {
  assert.equal(policy.isAdminPath(item.href), true, item.href);
  assert.ok(fs.existsSync(path.resolve(__dirname, '../pages', `${item.href.slice(1)}.tsx`)), item.href);
}
async function check(actor, target, body, expected, failure = false) {
  const writes = [], updates = [];
  const client = { users: {
    getUser: async id => ({ id, privateMetadata: { role: id === 'actor' ? actor : target, approvalStatus: 'approved' } }),
    updateUserMetadata: async (id, data) => { if (failure) throw new Error('offline'); updates.push(data.privateMetadata); },
  } };
  const server = load('lib/serverAccess.ts', {
    './access': policy,
    '@clerk/nextjs/server': { clerkClient: async () => client, getAuth: () => ({ userId: actor ? 'actor' : null }) },
  });
  const api = load('pages/api/admin/students.ts', {
    '../../../lib/access': policy,
    '../../../lib/serverAccess': server,
    '../../../lib/firebaseAdmin': { firebaseAdmin: () => ({ db: { collection: () => ({ doc: () => ({ set: async data => writes.push(data) }) }) } }) },
  });
  const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; }, end() {} };
  await api.default({ method: 'POST', headers: { 'content-type': 'application/json' }, body: { userId: 'target', ...body } }, res);
  assert.equal(res.statusCode, expected, JSON.stringify({ actor, target, body }));
  if (expected === 200) {
    assert.equal(updates.length, 1);
    const final = writes.at(-1);
    assert.equal(final.admin, false);
    assert.equal(final.support, body.role === 'support');
    assert.equal(final.approved, body.role ? true : body.approved);
  } else if (failure) {
    assert.deepEqual(writes, [{ approved: false, admin: false, support: false }]);
  } else assert.equal(writes.length, 0);
}
(async () => {
  await check(null, 'student', { approved: true }, 401);
  await check('student', 'student', { approved: true }, 403);
  await check('support', 'student', { approved: true }, 200);
  await check('support', 'student', { approved: false }, 200);
  for (const target of ['admin', 'support']) await check('support', target, { approved: false }, 400);
  await check('support', 'student', { role: 'support' }, 403);
  await check('support', 'support', { role: 'student' }, 403);
  await check('admin', 'student', { role: 'support' }, 200);
  await check('admin', 'support', { role: 'student' }, 200);
  await check('admin', 'admin', { role: 'student' }, 403);
  await check('admin', 'student', { role: 'admin' }, 400);
  await check('admin', 'student', { role: 'support' }, 503, true);
  console.log('Staff API authorization, role updates, failure handling and navigation protection: passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });