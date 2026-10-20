import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadAudioData } from '../lib/retell-lecture.js';

const data = loadAudioData();
assert.deepEqual(data.availableVoices, ['ryan']);
assert.equal(data.sentences.length, 7);
assert.deepEqual(data.sentences.map(sentence => sentence.number), [1, 2, 3, 4, 5, 6, 7]);
for (const sentence of data.sentences) {
  assert.deepEqual(Object.keys(sentence.voices), ['ryan']);
  assert.ok(sentence.voices.ryan.startsWith('/shadowingsource/rl/'));
  const file = decodeURIComponent(sentence.voices.ryan);
  assert.ok(fs.statSync(path.join(process.cwd(), 'public', file)).size > 0);
  assert.equal(sentence.text, path.basename(file).replace(/^\d+_Ryan_/, '').replace(/\.mp3$/, ''));
}
assert.equal(data.fullText, data.sentences.map(sentence => sentence.text).join(' '));
assert.deepEqual(JSON.parse(JSON.stringify(data)), data);

const cwd = process.cwd();
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'rl-audio-test-'));
try {
  const directory = path.join(temporary, 'public/shadowingsource/rl');
  fs.mkdirSync(directory, { recursive: true });
  process.chdir(temporary);
  assert.throws(loadAudioData, /No Ryan audio/);
  fs.writeFileSync(path.join(directory, '1_Brian_Ignore.mp3'), 'other voice');
  fs.writeFileSync(path.join(directory, 'notes.txt'), 'ignore');
  assert.throws(loadAudioData, /No Ryan audio/);
  fs.writeFileSync(path.join(directory, '1_Ryan_First.mp3'), 'audio');
  fs.writeFileSync(path.join(directory, '3_Ryan_Third.mp3'), 'audio');
  assert.throws(loadAudioData, /Missing Ryan sentence 2/);
  fs.writeFileSync(path.join(directory, '2_Ryan_Second.mp3'), 'audio');
  assert.deepEqual(loadAudioData().sentences.map(sentence => sentence.number), [1, 2, 3]);
  fs.writeFileSync(path.join(directory, '2_Ryan_Duplicate.mp3'), 'audio');
  assert.throws(loadAudioData, /Duplicate Ryan sentence 2/);
  fs.unlinkSync(path.join(directory, '2_Ryan_Duplicate.mp3'));
  fs.writeFileSync(path.join(directory, '4_Ryan_Empty.mp3'), '');
  assert.throws(loadAudioData, /Empty Ryan audio/);
} finally {
  process.chdir(cwd);
  fs.rmSync(temporary, { recursive: true, force: true });
}
console.log('PASS: 7 ordered Ryan sentences, existing audio paths, exact filename transcripts, serialization, ignored files, missing/duplicate/empty audio checks.');