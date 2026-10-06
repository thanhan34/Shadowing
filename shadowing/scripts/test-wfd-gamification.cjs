const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const store = new Map();
let queue = Promise.resolve();
class Ref {
  constructor(key) { this.key = key; this.id = key.split('/').pop(); }
  collection(name) { return new Collection(`${this.key}/${name}`); }
}
class Collection {
  constructor(key, filter) { this.key = key; this.filter = filter; }
  doc(id) { return new Ref(`${this.key}/${id}`); }
  where(field, operator, value) { return new Collection(this.key, data => data[field] === value); }
}
function snapshot(ref, data) { return { id: ref.id, exists: !!data, data: () => data && structuredClone(data) }; }
const db = {
  collection: name => new Collection(name),
  runTransaction: fn => {
    const run = queue.then(async () => {
      const writes = [];
      const result = await fn({
        get: async ref => {
          assert.equal(writes.length, 0, 'All transaction reads must precede writes');
          if (ref instanceof Collection) return { docs: [...store].filter(([key, data]) => key.startsWith(ref.key + '/') && !key.slice(ref.key.length + 1).includes('/') && (!ref.filter || ref.filter(data))).map(([key, data]) => snapshot(new Ref(key), data)) };
          return snapshot(ref, store.get(ref.key));
        },
        create: (ref, data) => { assert.ok(!store.has(ref.key)); writes.push([ref.key, structuredClone(data)]); },
        set: (ref, data, opts) => writes.push([ref.key, opts?.merge ? { ...store.get(ref.key), ...structuredClone(data) } : structuredClone(data)]),
      });
      for (const [key, data] of writes) store.set(key, data);
      return result;
    });
    queue = run.catch(() => {});
    return run;
  },
};
const cache = {};
function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  if (cache[filename]) return cache[filename];
  const m = new Module(filename, module);
  m.require = name => {
    if (name === '../firebaseAdmin') return { firebaseAdmin: () => ({ db }) };
    if (name.startsWith('.')) return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), name + '.ts')));
    return require(name);
  };
  m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, filename);
  return cache[filename] = m.exports;
}
const rules = load('lib/wfd/rules.ts');
const service = load('lib/wfd/service.ts');
const realNow = Date.now;
let clock = Date.parse('2026-10-05T01:00:00Z');
Date.now = () => clock;
const uid = 'student-1';
const prefix = `_wfd/users/profiles/${uid}`;
const identity = { name: 'Test Student', avatar: '' };
async function attempt(q = 'q1', answer = 'this is a test') {
  clock += 6000;
  const { attemptId } = await service.startAttempt(uid, q);
  clock += 6000;
  return service.submitAttempt(uid, identity, attemptId, answer);
}
(async () => {
  assert.equal(rules.calculateWfdXp(100, true, true), 12);
  for (const [accuracy, expected] of [[100, 10], [99, 8], [90, 8], [89, 6], [80, 6], [79, 5], [0, 5]]) assert.equal(rules.calculateWfdXp(accuracy, true, false), expected);
  assert.equal(rules.calculateWfdXp(100, false, true), 0);
  assert.equal(rules.calculateWfdXp(NaN, true, true), 0);
  assert.deepEqual(rules.calendar(Date.parse('2026-10-04T16:59:59Z')), { day: '2026-10-04', week: '2026-09-28' });
  assert.deepEqual(rules.calendar(Date.parse('2026-10-04T17:00:00Z')), { day: '2026-10-05', week: '2026-10-05' });
  for (let i = 1; i <= 25; i++) store.set(`writefromdictation/q${i}`, { text: 'this is a test', isHidden: false, topic: 'Education' });
  const first = await attempt();
  assert.equal(first.xp, 12); assert.equal(first.newBadges[0], 'Starter');
  const duplicate = await service.submitAttempt(uid, identity, first.attemptId, 'changed answer');
  assert.equal(duplicate.duplicate, true); assert.equal(duplicate.xp, 12);
  assert.equal(store.get(prefix).totalXp, 12);
  for (let i = 0; i < 4; i++) assert.equal((await attempt()).xp, 10);
  const sixth = await attempt(); assert.equal(sixth.xp, 0); assert.equal(sixth.reason, 'daily-limit');
  assert.equal(store.get(`${prefix}/days/2026-10-05`).practiced, 5);
  assert.ok(store.has(`${prefix}/attempts/${sixth.attemptId}`));
  clock += 6000;
  const fast = await service.startAttempt(uid, 'q2');
  assert.equal((await service.submitAttempt(uid, identity, fast.attemptId, 'this is a test')).reason, 'too-fast');
  const extra = await attempt('q2', 'this is a test many extra words'); assert.ok(extra.accuracy < 100);
  await service.setGoal(uid, 10);
  assert.equal(store.get(`${prefix}/days/2026-10-05`).goal, 20);
  for (let i = 3; i <= 16; i++) await attempt(`q${i}`);
  const day = store.get(`${prefix}/days/2026-10-05`); assert.equal(day.practiced, 20); assert.equal(day.rewarded, true);
  assert.equal(store.get(prefix).currentStreak, 1);
  await service.setGoal(uid, 50); await service.setGoal(uid, 10);
  assert.equal((await attempt('q17')).xp, 12, 'Goal reward not repeated');
  const challenge = { week: '2026-10-05', title: 'Test', type: 'questions', target: 1, rewardXp: 300, topic: '', minimumAccuracy: 90, badgeTitle: 'Weekly Test' };
  store.set('_wfd/challenges/items/2026-10-05', challenge);
  assert.equal((await attempt('q18')).xp, 312);
  assert.equal((await attempt('q19')).xp, 12);
  clock += 6000; const parallel = await service.startAttempt(uid, 'q20'); clock += 6000;
  const results = await Promise.all([service.submitAttempt(uid, identity, parallel.attemptId, 'this is a test'), service.submitAttempt(uid, identity, parallel.attemptId, 'this is a test')]);
  assert.equal(results.filter(r => r.duplicate).length, 1);
  const dashboard = await service.getDashboard(uid);
  assert.equal(dashboard.me.rank, 1); assert.equal(dashboard.challengeAwards[0].title, 'Weekly Test');
  clock = Date.parse('2026-10-06T01:00:00Z');
  assert.equal((await attempt()).xp, 10, 'Daily cap resets; mastery does not');
  assert.equal(store.get(`${prefix}/days/2026-10-06`).goal, 10);
  store.set(prefix, { ...store.get(prefix), currentStreak: 6, lastCompletedDate: '2026-10-05' });
  for (let i = 2; i <= 10; i++) await attempt(`q${i}`);
  assert.ok(store.get(prefix).milestones.includes(7)); assert.equal(store.get(prefix).currentStreak, 7);
  clock = Date.parse('2026-10-09T01:00:00Z'); assert.equal((await service.getDashboard(uid)).profile.currentStreak, 0);
  const entry = { userId: 'a', xp: 10, accuracySum: 100, practiced: 1, attempts: 1, reachedAt: 1 };
  assert.ok(rules.compareRanks(entry, { ...entry, xp: 9 }) < 0);
  assert.ok(rules.compareRanks(entry, { ...entry, accuracySum: 90 }) < 0);
  assert.ok(rules.compareRanks(entry, { ...entry, attempts: 2 }) < 0);
  assert.ok(rules.compareRanks(entry, { ...entry, reachedAt: 2 }) < 0);
  const context = { accuracy: 95, topic: 'Education', xp: 8, firstDay: true, mastery: true };
  for (const [type, expected] of [['questions', 1], ['xp', 8], ['topic', 1], ['accuracy', 1], ['days', 1], ['mastery', 1]]) assert.equal(rules.challengeIncrement({ ...challenge, type, topic: 'Education' }, context), expected);
  await assert.rejects(() => service.submitAttempt('another-user', identity, first.attemptId, 'this is a test'), /không hợp lệ/);
  console.log('WFD gamification: XP, timezone, caps, duplicate/concurrent replay, daily goal, streak, badges, challenges, rankings and ownership passed (in-memory transaction harness).');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Date.now = realNow; });