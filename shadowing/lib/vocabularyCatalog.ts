import { decks, Deck, Word } from '../data/vocabulary';

export type Topic = Pick<Deck, 'topic'>;
export function topicEntry(name: string) {
  const topic = name.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (!topic || topic.length > 80) throw new Error('Nhập tên chủ đề từ 1 đến 80 ký tự.');
  const key = topic.toLowerCase();
  if (decks.some(d => d.topic.toLowerCase() === key)) throw new Error('Chủ đề này đã có trong bộ từ mẫu.');
  return { id: 'topic-' + encodeURIComponent(key), data: { topic } };
}

export const termPattern = /^[a-z]+(?:[ '-][a-z]+)*$/;
export function cleanIpa(value = '') {
  return value.trim().replace(/^\/+|\/+$/g, '').trim();
}
export function validTerm(term: string) {
  return term.length <= 64 && termPattern.test(term) && !(term in Object.prototype);
}
export function assembleDecks(rows: { topic: string; word: Word }[], topics: Topic[] = []) {
  const seen = new Set(decks.flatMap(d => d.words.map(w => w.term)));
  const catalog = new Map<string, Deck>(decks.map(d => [d.topic, { ...d, words: [...d.words] }]));
  for (const { topic } of topics) if (topic && !catalog.has(topic)) catalog.set(topic, { topic, words: [] });
  for (const { topic, word } of rows) {
    const deck = catalog.get(topic);
    if (!deck || !word || !validTerm(word.term) || !word.meaning || !word.example || seen.has(word.term)) continue;
    seen.add(word.term); deck.words.push(word);
  }
  return Array.from(catalog.values()).filter(d => d.words.length);
}