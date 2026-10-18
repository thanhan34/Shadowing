const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');

function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const instance = new Module(filename, module);
  instance.require = name => mocks[name] || require(name);
  instance._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, filename);
  return instance.exports;
}
const policy = load('lib/access.ts');
const users = Array.from({ length: 205 }, (_, index) => ({
  id: `user-${index}`, firstName: 'Student', lastName: `${index}`,
  emailAddresses: [], privateMetadata: index === 203 ? { role: 'admin' }
    : index === 204 ? { role: 'support', approvalStatus: 'revoked' }
      : { approvalStatus: index % 2 === 0 ? 'approved' : 'revoked' },
}));
let dataset = users;
let calls = [];
let fail = false;
let authorized = true;
const api = load('pages/api/admin/students.ts', {
  '../../../lib/access': policy,
  '../../../lib/firebaseAdmin': { firebaseAdmin: () => { throw new Error('GET must not use Firebase'); } },
  '../../../lib/serverAccess': { requireAccess: async (_req, res) => {
    if (!authorized) { res.status(403).json({ error: 'Forbidden' }); return null; }
    return { access: { admin: true }, client: { users: { getUserList: async params => {
      calls.push(params);
      if (fail && params.offset === 100) throw new Error('Clerk unavailable');
      return { totalCount: dataset.length, data: dataset.slice(params.offset, params.offset + params.limit) };
    } } } };
  } },
}).default;
async function request(offset) {
  calls = [];
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
  await api({ method: 'GET', query: { offset } }, res);
  return res;
}
(async () => {
  const expected = users.filter(user => policy.getAccess(user.privateMetadata).approved).length;
  for (const offset of [0, 20, 80, 200, 220]) {
    const res = await request(offset);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.total, 205);
    assert.equal(res.body.approvedCount, expected);
    assert.deepEqual(res.body.users.map(user => user.id), users.slice(offset, offset + 20).map(user => user.id));
    assert.deepEqual(calls.map(call => call.offset), [0, 100, 200]);
  }
  users[1].privateMetadata.approvalStatus = 'approved';
  assert.equal((await request(0)).body.approvedCount, expected + 1);
  fail = true;
  assert.equal((await request(0)).statusCode, 503);
  fail = false;
  dataset = [];
  assert.deepEqual((await request(0)).body, { canManageRoles: true, total: 0, approvedCount: 0, users: [] });
  authorized = false;
  assert.equal((await request(0)).statusCode, 403);
  assert.equal(calls.length, 0);
  console.log('Admin students API: global counts, pagination, staff access, refresh, empty data, failures and authorization passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });