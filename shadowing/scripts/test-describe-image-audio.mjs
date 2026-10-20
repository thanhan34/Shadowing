import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadAudioData } from '../lib/describe-image-shadowing.js';

const data = loadAudioData();
const openings = { line_chart: 1, pie_chart: 2, bar_chart: 3, map: 4, process: 5, picture: 6, table: 7 };
assert.deepEqual(data.availableVoices, ['ryan']);
assert.deepEqual(Object.keys(data.variants).sort(), Object.keys(openings).sort());
for (const [type, opening] of Object.entries(openings)) {
  const content = data.variants[type];
  assert.equal(content.sentences.length, 9);
  assert.deepEqual(content.sentences.map(sentence => sentence.number), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const sourceNumbers = content.sentences.map(sentence => {
    assert.deepEqual(Object.keys(sentence.voices), ['ryan']);
    const file = decodeURIComponent(sentence.voices.ryan);
    assert.ok(fs.statSync(path.join(process.cwd(), 'public', file)).size > 0);
    assert.equal(sentence.text, path.basename(file).replace(/^\d+_Ryan_/, '').replace(/\.mp3$/, ''));
    return Number(path.basename(file).split('_')[0]);
  });
  assert.equal(sourceNumbers[0], opening);
  const noun = type.endsWith('_chart') ? 'chart' : type;
  const expected = [
    `and the ${noun} shows the information about Topic`,
    `The given ${noun} contains many elements, including A, B, C`,
    `As can be seen from the ${noun},`,
    `In conclusion, the ${noun} also gives the information about keywords`,
  ];
  [1, 2, 3, 8].forEach((index, position) => {
    assert.equal(content.sentences[index].text.replace(/\s*,\s*/g, ',').replace(/[.,]+$/, ''), expected[position].replace(/\s*,\s*/g, ',').replace(/[.,]+$/, ''));
    if (!type.endsWith('_chart')) assert.doesNotMatch(content.sentences[index].text, /\bchart\b/i);
  });
  if (type.endsWith('_chart')) assert.deepEqual(sourceNumbers, [opening, 8, 10, 11, 12, 13, 14, 15, 16]);
  assert.equal(content.fullText, content.sentences.map(sentence => sentence.text).join(' '));
  for (const index of [4, 5, 6, 7]) assert.deepEqual(content.sentences[index], data.sentences[index]);
}
assert.deepEqual(data.sentences, data.variants.line_chart.sentences);
JSON.parse(JSON.stringify(data));

// Validate failure without touching the user's recordings.
const cwd = process.cwd();
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'di-audio-test-'));
try {
  fs.mkdirSync(path.join(temporary, 'public/shadowingsource/di'), { recursive: true });
  process.chdir(temporary);
  assert.throws(loadAudioData, /Missing Ryan audio for line_chart, sentence 1/);
  const originalDirectory = path.join(cwd, 'public/shadowingsource/di');
  for (const file of fs.readdirSync(originalDirectory)) fs.copyFileSync(path.join(originalDirectory, file), path.join('public/shadowingsource/di', file));
  const initial = loadAudioData();
  assert.deepEqual(initial, data, 'Repeated numeric prefixes must not conflict');
  fs.writeFileSync('public/shadowingsource/di/99_Ryan_and the chart shows the information about Topic.mp3', 'duplicate');
  assert.deepEqual(loadAudioData(), data, 'Duplicate transcript must not repeat or replace earlier audio');
  const mapFile = decodeURIComponent(data.variants.map.sentences[1].voices.ryan);
  fs.unlinkSync(path.join('public', mapFile));
  assert.throws(loadAudioData, /Missing Ryan audio for map, sentence 2/, 'Missing map audio must not fall back to chart');
} finally {
  process.chdir(cwd);
  fs.rmSync(temporary, { recursive: true, force: true });
}
console.log('PASS: 7 types, 9 sentences each, type-specific sentences 2/3/4/9, Ryan paths, shared sentences 5–8, duplicate prefixes/transcripts and missing-audio checks.');