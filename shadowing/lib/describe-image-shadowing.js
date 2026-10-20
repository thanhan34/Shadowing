import fs from 'fs';
import path from 'path';
const imageNouns = { line_chart: 'line chart', pie_chart: 'pie chart', bar_chart: 'bar chart', map: 'map', process: 'process', picture: 'picture', table: 'table' };
const normalizeTranscript = text => text.toLowerCase().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').replace(/[.,]+$/, '').trim();

export function loadAudioData() {
  const directory = path.join(process.cwd(), 'public/shadowingsource/di');
  const recordings = new Map();
  // Prefer the lowest prefix for duplicate transcripts (the original files 8 and 9).
  const files = fs.readdirSync(directory).sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b));
  for (const file of files) {
    const match = /^(\d+)_Ryan_(.+)\.mp3$/i.exec(file);
    if (!match) continue;
    const text = match[2].replace(/_/g, ' ').trim();
    const key = normalizeTranscript(text);
    if (recordings.has(key)) continue;
    recordings.set(key, {
      text,
      voices: { ryan: `/shadowingsource/di/${encodeURIComponent(file)}` },
    });
  }

  const variants = Object.fromEntries(Object.entries(imageNouns).map(([type, noun]) => {
    const subject = type.endsWith('_chart') ? 'chart' : noun;
    const transcripts = [
      `This is a ${noun},`,
      `and the ${subject} shows the information about Topic`,
      `The given ${subject} contains many elements, including A, B, C`,
      `As can be seen from the ${subject},`,
      'A has the maximum number, which is nearly 80 percent',
      'On the other hand, B has the minimum number, which is nearly 20 percent',
      'Overall, these elements are distributed clearly, highlighting differences between segments',
      'There are no major changes over time',
      `In conclusion, the ${subject} also gives the information about keywords`,
    ];
    const sentences = transcripts.map((transcript, index) => {
      const recording = recordings.get(normalizeTranscript(transcript));
      if (!recording) throw new Error(`Missing Ryan audio for ${type}, sentence ${index + 1}: ${transcript}`);
      return { number: index + 1, ...recording };
    });
    return [type, { sentences, fullText: sentences.map(sentence => sentence.text).join(' ') }];
  }));
  return {
    id: 'describe-image-1',
    name: 'Describe Image Practice',
    ...variants.line_chart,
    variants,
    availableVoices: ['ryan'],
  };
}
