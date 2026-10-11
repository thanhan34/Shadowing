import { GrammarSection, GrammarTopic } from '../data/grammar';

export function normalizeGrammarSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

export function filterGrammarSections(sections: GrammarSection[], topic: GrammarTopic, query: string): GrammarSection[] {
  const terms = normalizeGrammarSearch(query).split(/\s+/).filter(Boolean);
  return sections.filter(section => {
    if (section.topic !== topic) return false;
    const text = normalizeGrammarSearch([section.title, section.description, ...(section.headers || []), ...(section.rows || []).flat(), ...(section.notes || [])].join(' '));
    return terms.every(term => text.includes(term));
  });
}