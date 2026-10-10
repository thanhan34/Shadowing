const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
function load(relative, mocks = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const m = new Module(filename, module);
  m.paths = module.paths;
  m.require = name => Object.hasOwn(mocks, name) ? mocks[name] : require(name);
  m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
  return m.exports;
}
const statsModule = load('lib/wfd/adminMastery.ts');
const now = 200000000;
const q = (mastered, nextReviewAt) => ({ mastered, nextReviewAt, stage: mastered ? 2 : 0, lastPracticedAt: 100 });
const questions = { a: q(true, now - 86400000), b: q(true, now + 1), c: q(false, now), hidden: q(true, now) };
const ids = new Set(['a', 'b', 'c', 'new']);
const stats = statsModule.adminMasteryStats(questions, ids, now);
assert.equal(stats.masteryRate, 50);
assert.equal(stats.practicedCount, 3);
assert.equal(stats.dueReviewCount, 2);
assert.equal(stats.overdueReviewCount, 1);
assert.equal(stats.retentionRate, 50);
assert.equal(statsModule.adminMasteryStats({}, ids, now).retentionRate, null);
assert.equal(statsModule.adminMasteryStats(questions, new Set(), now).masteryRate, 0);
let allowed = true, reads = 0, listArgs;
const user = { id: 'user_1', firstName: 'An', lastName: 'Nguyen', emailAddresses: [], privateMetadata: {} };
const chain = { collection() { return this; }, doc() { return this; }, async get() { reads++; return { data: () => ({ questions }) }; } };
const db = { collection(name) { if (name !== 'writefromdictation') return chain; return { where: () => ({ select: () => ({ get: async () => ({ docs: [...ids].map(id => ({ id, data: () => ({ text: id }) })) }) }) }) }; } };
const handler = load('pages/api/admin/wfd-mastery.ts', {
  '../../../lib/serverAccess': { requireAccess: async (req, res, staff) => {
    assert.equal(staff, true); res.setHeader('Cache-Control', 'no-store');
    if (!allowed) { res.status(403).json({ error: 'denied' }); return null; }
    return { access: { admin: true }, client: { users: { getUser: async () => user, getUserList: async args => { listArgs = args; return { data: [user], totalCount: 1 }; } } } };
  } },
  '../../../lib/firebaseAdmin': { firebaseAdmin: () => ({ db }) },
  '../../../lib/wfd/adminMastery': statsModule,
}).default;
async function request(query = {}, method = 'GET') {
  const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; }, end() { return this; } };
  await handler({ query, method }, res); return res;
}
(async () => {
  allowed = false; assert.equal((await request()).code, 403); assert.equal(reads, 0);
  allowed = true; assert.equal((await request({}, 'POST')).code, 405); assert.equal(reads, 0);
  for (const query of [{ offset: '-1' }, { offset: '1.5' }, { userId: '../bad' }, { userId: ['user_1'] }, { query: 'a'.repeat(201) }]) assert.equal((await request(query)).code, 400);
  const list = await request({ query: 'An', offset: '20' });
  assert.equal(list.code, 200); assert.equal(list.headers['Cache-Control'], 'no-store');
  assert.equal(listArgs.query, 'An'); assert.equal(listArgs.offset, 20);
  assert.equal(list.body.users[0].stats.masteryRate, 50);
  assert.equal(list.body.users[0].questions, undefined);
  const detail = await request({ userId: 'user_1' });
  assert.equal(detail.body.questions.length, 4);
  assert.equal(detail.body.questions.find(item => item.id === 'new').progress, null);
  assert.ok(!detail.body.questions.some(item => item.id === 'hidden'));
  console.log('Admin WFD mastery: statistics, boundaries, empty data, auth, read-only API, validation, search, detail and hidden-question exclusion passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });