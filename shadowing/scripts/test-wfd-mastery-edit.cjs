const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
function load(file, mocks) {
  const filename = path.resolve(__dirname, '..', file), m = new Module(filename, module);
  m.require = name => mocks[name] || require(name);
  m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
  return m.exports;
}
let saved = { questions: {}, lastReviewedAt: 123 }, writes = [], hidden = false;
const ref = p => ({ path: p, collection: name => ref(`${p}/${name}`), doc: (id = 'audit-id') => ref(`${p}/${id}`) });
const db = { collection: name => ref(name), runTransaction: async fn => fn({
  get: async r => r.path.startsWith('writefromdictation/') ? { exists: true, data: () => ({ isHidden: hidden }) } : { data: () => saved },
  set: (r, data) => { writes.push({ path: r.path, data }); },
}) };
const service = load('lib/wfd/editMastery.ts', { '../firebaseAdmin': { firebaseAdmin: () => ({ db }) } });
const edit = { userId: 'user_1', questionId: 'q1', stage: 0, nextReviewAt: 'now', reason: 'Test due review', expected: null };
let admin = true, authorized = true;
const handler = load('pages/api/admin/wfd-mastery-edit.ts', {
  '../../../lib/wfd/editMastery': service,
  '../../../lib/serverAccess': { requireAccess: async (req, res, staff) => {
    assert.equal(staff, true);
    if (!authorized) { res.status(401).end(); return null; }
    return { access: { admin }, user: { id: 'admin_1' }, client: { users: { getUser: async () => ({}) } } };
  } },
}).default;
async function request(body = edit, method = 'POST', headers = { 'content-type': 'application/json' }) {
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, end() {}, setHeader() {} };
  await handler({ body, method, headers }, res); return res;
}
(async () => {
  for (const value of [{ ...edit, stage: 5 }, { ...edit, stage: '2' }, { ...edit, reason: ' ' }, { ...edit, questionId: '../x' }, { ...edit, nextReviewAt: NaN }, { ...edit, expected: undefined }]) assert.equal(service.validateMasteryEdit(value), false);
  authorized = false; assert.equal((await request()).code, 401); authorized = true;
  admin = false; assert.equal((await request()).code, 403); admin = true;
  assert.equal((await request(edit, 'GET')).code, 405);
  assert.equal((await request(edit, 'POST', {})).code, 415);
  assert.equal((await request(edit, 'POST', { 'sec-fetch-site': 'cross-site' })).code, 403);
  assert.equal((await request({ ...edit, stage: -1 })).code, 400);
  assert.equal(writes.length, 0);
  const start = Date.now(), result = await request();
  assert.equal(result.code, 200); assert.ok(result.body.progress.nextReviewAt >= start && result.body.progress.nextReviewAt <= Date.now());
  assert.equal(result.body.progress.lastPracticedAt, 0);
  assert.equal(writes.length, 2); assert.equal(writes[0].data.lastReviewedAt, 123);
  assert.equal(writes[1].data.actorId, 'admin_1'); assert.equal(writes[1].data.before, null);
  saved = writes[0].data; writes = [];
  assert.equal((await request()).code, 409); assert.equal(writes.length, 0);
  const expected = saved.questions.q1;
  assert.equal((await request({ ...edit, expected, stage: 2, nextReviewAt: 2000000000000 })).body.progress.mastered, true);
  writes = []; hidden = true; assert.equal((await request({ ...edit, expected })).code, 404); assert.equal(writes.length, 0);
  hidden = false; saved = { questions: Object.fromEntries(Array.from({ length: 2000 }, (_, i) => [`other${i}`, expected])) };
  assert.equal((await request()).code, 409);
  console.log('Mastery edit: validation, admin-only access, CSRF, due-now, stage consistency, audit, history preservation, conflict, hidden questions and capacity passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });