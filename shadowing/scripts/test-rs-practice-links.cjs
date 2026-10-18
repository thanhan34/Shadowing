const assert = require('node:assert/strict');
const { practiceUrlForId, planUpdates } = require('./update-rs-practice-links.cjs');
const url = 'https://www.apeuni.com/practice/repeat_sentences/170';
for (const id of ['#170 RS', '#170', '170', '  #00170 rs  ']) assert.equal(practiceUrlForId(id), url);
for (const id of ['', null, undefined, 170, '#0 RS', '#170 WFD', '#-170 RS', '#170 RS #171', 'abc170', '#1.7 RS', '999999999999999999']) assert.equal(practiceUrlForId(id), null);
const snapshot = (id, data) => ({ id, data: () => data });
const plan = planUpdates([
  snapshot('missing', { ID: '#170 RS' }),
  snapshot('wrong', { ID: '#170 RS', practiceUrl: 'wrong', isHidden: true }),
  snapshot('correct', { ID: '#170 RS', practiceUrl: url }),
  snapshot('invalid', { ID: '#170 WFD' }),
]);
assert.deepEqual(plan.updates.map(item => item.snapshot.id), ['missing', 'wrong']);
assert.ok(plan.updates.every(item => item.practiceUrl === url));
assert.deepEqual(plan.unchanged, ['correct']);
assert.deepEqual(plan.invalid, [{ documentId: 'invalid', ID: '#170 WFD' }]);
assert.deepEqual(planUpdates([]), { updates: [], unchanged: [], invalid: [] });
console.log('RS practice link tests passed: ID validation, URL mapping, hidden documents, existing links, idempotency and invalid-ID reporting.');