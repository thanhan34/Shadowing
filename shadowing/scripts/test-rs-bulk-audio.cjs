const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../lib/repeatSentenceAudio.ts');
const mod = new Module(filename, module);
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const { parseRepeatSentenceAudioFilename: parse, normalizeRepeatSentenceAudioText: normalize, uploadRepeatSentenceAudioFiles: upload, buildMissingRepeatSentenceAudioRows: exportRows } = mod.exports;
const file = (name, size = 10) => ({ name, size });

async function main() {
  assert.deepEqual(parse('12_rYaN_We_should review.MP3'), { voice: 'Ryan', text: 'We should review' });
  assert.equal(parse('1_Jenny_Test.mp3'), null);
  assert.equal(parse('Ryan_Test.wav'), null);
  assert.equal(parse('Ryan_.mp3'), null);
  assert.deepEqual(parse('Ryan_Test.mp3'), { voice: 'Ryan', text: 'Test' });
  for (const voice of ['Brian', 'Olivia', 'Joanna']) assert.equal(parse(`${voice}_Test.mp3`), null);
  assert.equal(normalize('We should / always review!'), normalize('we_should_always_review'));
  assert.equal(normalize('Don’t / stop.'), normalize("Don't stop"));
  const items = [{ id: 'a', text: 'We should / always review.' }, { id: 'b', text: 'Duplicate.' }, { id: 'c', text: 'Duplicate!' }, { id: 'd', text: 'Already complete.' }];
  const audio = { a: { Joanna: 'existing', Other: 'preserved' }, d: { Ryan: 'existing-ryan' } };
  const uploaded = [], saved = [], progress = [];
  const dependencies = {
    readAudio: async id => audio[id] ?? {},
    upload: async (f, id, voice) => { uploaded.push([f.name, id, voice]); return `url-${voice}`; },
    save: async (id, voice, url) => { saved.push([id, voice]); audio[id][voice] = url; },
    onResult: (result, count) => progress.push(count),
  };
  const results = await upload([
    file('1_Ryan_We should always review.mp3'),
    file('2_Ryan_Already complete.mp3'),
    file('3_Joanna_We should always review.mp3'),
    file('4_Ryan_We should always review.mp3'),
    file('Ryan_Duplicate.mp3'), file('Ryan_No match.mp3'),
    file('Jenny_Test.mp3'), file('Ryan_Empty.mp3', 0),
  ], items, dependencies);
  assert.deepEqual(results.map(r => r.status), ['success', 'skipped', 'error', 'skipped', 'skipped', 'skipped', 'error', 'error']);
  assert.equal(uploaded.length, 1);
  assert.equal(saved.length, 1);
  assert.equal(audio.a.Ryan, 'url-Ryan');
  assert.equal(audio.d.Ryan, 'existing-ryan');
  assert.equal(audio.a.Joanna, 'existing');
  assert.equal(audio.a.Other, 'preserved');
  assert.deepEqual(progress, [1, 2, 3, 4, 5, 6, 7, 8]);
  let attempts = 0;
  const failed = await upload([file('1_Ryan_We should always review.mp3'), file('2_Ryan_We should always review.mp3')], items, {
    ...dependencies, readAudio: async () => ({}),
    upload: async () => { if (++attempts === 1) throw new Error('Storage denied'); return 'url'; },
    save: async () => { throw new Error('Firestore denied'); },
  });
  assert.deepEqual(failed.map(r => r.status), ['error', 'error']);
  assert.equal(failed[0].message, 'Storage denied');
  assert.equal(failed[1].message, 'Firestore denied');
  const stale = await upload([file('Ryan_We should always review.mp3')], items, {
    ...dependencies, readAudio: async () => { throw new Error('Deleted or hidden'); },
  });
  assert.equal(stale[0].status, 'error');
  assert.deepEqual(await upload([], items, dependencies), []);
  const rows = exportRows([
    { id: 'missing', ID: '#1', text: 'We should / always review.', vietnameseTranslation: 'Ôn tập', audio: { Brian: 'old' } },
    { id: 'empty', text: 'Empty Ryan', audio: { Ryan: '' } },
    { id: 'spaces', text: 'Whitespace Ryan', audio: { Ryan: '  ' } },
    { id: 'absent', text: 'No audio field' },
    { id: 'complete', text: 'Complete Ryan', audio: { Ryan: 'https://audio.mp3' } },
  ]);
  assert.deepEqual(rows.map(row => row['Document ID']), ['missing', 'empty', 'spaces', 'absent']);
  assert.equal(rows[0]['English Text'], 'We should always review.');
  assert.equal(rows[0]['Vietnamese Translation'], 'Ôn tập');
  assert.equal(rows[0].ID, '#1');
  assert.ok(rows.every(row => row['Has Ryan Audio'] === 'No'));
  assert.deepEqual(exportRows([]), []);
  const XLSX = require('xlsx');
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Missing Ryan Audio');
  const readBack = XLSX.read(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }), { type: 'buffer' });
  assert.deepEqual(XLSX.utils.sheet_to_json(readBack.Sheets['Missing Ryan Audio'], { defval: '' }), rows);
  console.log('RS bulk audio passed: Ryan-only validation/upload, no overwrite, other voices preserved, matching/errors/progress, missing Ryan filtering and Excel round-trip. Firebase mocked.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });