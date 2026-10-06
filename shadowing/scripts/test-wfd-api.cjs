const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
let authorized = true;
let calls = [];
class WfdError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fakeService = { WfdError };
for (const name of ['getDashboard', 'saveRankSnapshot', 'setGoal', 'startAttempt', 'submitAttempt']) {
  fakeService[name] = async (...args) => { calls.push({ name, args }); return { ok: true }; };
}
const filename = path.resolve(__dirname, '../pages/api/wfd/[action].ts');
const m = new Module(filename, module);
m.require = name => {
  if (name.endsWith('/serverAccess')) return { requireAccess: async (req, res) => {
    if (!authorized) { res.status(401).json({ error: 'unauthorized' }); return null; }
    return { user: { id: 'trusted-user', firstName: 'Test', lastName: 'User', imageUrl: '' } };
  } };
  if (name.endsWith('/rules')) return { GOALS: [10, 20, 30, 50] };
  if (name.endsWith('/service')) return fakeService;
  return require(name);
};
m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
async function request(action, method = 'POST', body = {}) {
  const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; }, end() { return this; } };
  await m.exports.default({ query: { action }, method, body }, res);
  return res;
}
(async () => {
  assert.equal((await request('unknown')).code, 404);
  assert.equal((await request('dashboard')).code, 405);
  authorized = false;
  for (const action of ['start', 'submit', 'goal', 'snapshot']) assert.equal((await request(action)).code, 401);
  assert.equal((await request('dashboard', 'GET')).code, 401);
  assert.equal(calls.length, 0);
  authorized = true;
  for (const goal of [0, 15, '20', 100000, null]) assert.equal((await request('goal', 'POST', { goal })).code, 400);
  assert.equal((await request('goal', 'POST', { goal: 20 })).code, 200);
  assert.deepEqual(calls.pop(), { name: 'setGoal', args: ['trusted-user', 20] });
  for (const questionId of ['', '../x', null, 'x'.repeat(151)]) assert.equal((await request('start', 'POST', { questionId })).code, 400);
  assert.equal((await request('submit', 'POST', { attemptId: 'not-a-ticket', answer: 'test' })).code, 400);
  const attemptId = '12345678-1234-1234-1234-123456789012';
  assert.equal((await request('submit', 'POST', { attemptId, answer: 'x'.repeat(2001) })).code, 400);
  assert.equal((await request('submit', 'POST', { attemptId, answer: 'test', xp: 99999, userId: 'attacker', accuracy: 100, createdAt: 1 })).code, 200);
  const submit = calls.pop();
  assert.deepEqual(submit.args, ['trusted-user', { name: 'Test User', avatar: '' }, attemptId, 'test']);
  assert.equal(submit.name, 'submitAttempt');
  assert.equal((await request('dashboard', 'GET')).code, 200);
  console.log('WFD API: authentication gates, methods, validation, trusted identity and ignored client XP/accuracy/time passed (mocked auth/service).');
})().catch(error => { console.error(error); process.exitCode = 1; });