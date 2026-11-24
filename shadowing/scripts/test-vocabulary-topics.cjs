const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText, file);
const { assembleDecks, topicEntry } = require('../lib/vocabularyCatalog.ts');
const t = topicEntry('  Công   nghệ ');
assert.deepEqual(t.data, { topic: 'Công nghệ' });
assert.equal(t.id, topicEntry('CÔNG NGHỆ'.normalize('NFD')).id);
assert.throws(() => topicEntry(' education '));
assert.throws(() => topicEntry('  '));
assert.ok(!topicEntry('Science / Health').id.includes('/'));
assert.equal(assembleDecks([], [t.data]).length, 2);
const word = { term: 'sensor', meaning: 'cảm biến', example: 'The sensor detects light.' };
const all = assembleDecks([{ topic: t.data.topic, word }], [t.data]);
assert.deepEqual(all.find(d => d.topic === t.data.topic), { ...t.data, words: [word] });
assert.deepEqual(assembleDecks([{ topic: t.data.topic, word }], [{ ...t.data, level: 'Pre PTE' }]), all);
assert.ok(all.filter(d => d.topic !== t.data.topic).every(d => !d.words.includes(word)));
console.log('PASS: topic normalization, duplicate IDs, validation, empty decks and published words.');