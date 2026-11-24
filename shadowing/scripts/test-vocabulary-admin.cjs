const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const docs = new Map();
const filename = path.resolve(__dirname, '../lib/vocabularyAdmin.ts');
const mod = new Module(filename, module);
mod.require = name => {
  if (name === '../firebase') return { db: {} };
  if (name !== 'firebase/firestore') throw Error(name);
  return { doc: (_, collection, id) => { assert.equal(collection, 'vocabularyWords'); return id; }, serverTimestamp: () => 100,
    runTransaction: async (_, apply) => {
      const changes = [];
      await apply({ get: async id => { assert.equal(changes.length, 0); return { exists: () => docs.has(id), data: () => docs.get(id), get: k => docs.get(id)?.[k] }; },
        set: (id, value) => changes.push(() => docs.set(id, value)), delete: id => changes.push(() => docs.delete(id)) });
      changes.forEach(write => write());
    } };
};
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText, filename);
const { commitWord, VocabularyConflict } = mod.exports;
const row = id => ({id, data: docs.get(id)});
(async () => {
  const word = { term: 'library', meaning: 'thư viện', example: 'Visit the library.', topic: 'Education', imageUrl: 'photo' };
  await commitWord(null, word); const original = row('library');
  await assert.rejects(commitWord(null, word), VocabularyConflict);
  await commitWord(original, {...word, ipaUS:'a'});
  assert.equal(docs.get('library').imageUrl, 'photo'); assert.equal(docs.get('library').ipaUS, 'a');
  await assert.rejects(commitWord(original, null), VocabularyConflict);
  docs.set('legacy', {...word, term:'legacy', createdAt: 12});
  await assert.rejects(commitWord(row('legacy'), word), VocabularyConflict);
  await commitWord(row('legacy'), {...word, term:'renamed'});
  assert.equal(docs.get('renamed').createdAt, 12); assert.ok(!docs.has('legacy'));
  const renamed = row('renamed'); await commitWord(renamed, null); assert.ok(!docs.has('renamed'));
  await assert.rejects(commitWord(renamed, word), VocabularyConflict);
  console.log('PASS: create, edit IPA, preserve photo, legacy rename, delete, duplicates and stale changes (in memory)');
})().catch(err => { console.error(err); process.exitCode = 1; });