import fs from 'fs';
import path from 'path';

export function loadAudioData() {
  const directory = path.join(process.cwd(), 'public/shadowingsource/rl');
  const recordings = new Map();
  for (const file of fs.readdirSync(directory)) {
    const match = /^(\d+)_Ryan_(.+)\.mp3$/i.exec(file);
    if (!match) continue;
    const number = Number(match[1]);
    if (number < 1 || !Number.isSafeInteger(number)) throw new Error(`Invalid Ryan sentence number: ${file}`);
    if (recordings.has(number)) throw new Error(`Duplicate Ryan sentence ${number}`);
    if (fs.statSync(path.join(directory, file)).size === 0) throw new Error(`Empty Ryan audio: ${file}`);
    recordings.set(number, {
      number,
      text: match[2].replace(/_/g, ' ').trim(),
      voices: { ryan: `/shadowingsource/rl/${encodeURIComponent(file)}` },
    });
  }
  const sentences = [...recordings.values()].sort((a, b) => a.number - b.number);
  if (!sentences.length) throw new Error('No Ryan audio found for Retell Lecture');
  sentences.forEach((sentence, index) => {
    if (sentence.number !== index + 1) throw new Error(`Missing Ryan sentence ${index + 1}`);
  });
  return {
    id: 'retell-lecture-1',
    name: 'Retell Lecture Practice',
    sentences,
    fullText: sentences.map(sentence => sentence.text).join(' '),
    availableVoices: ['ryan'],
  };
}