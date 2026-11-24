export const modes = { flash: 'Flashcards', match: 'Word Match', memory: 'Memory Flip', spell: 'Word Scramble', recall: 'Recall Challenge' } as const;
export type Mode = keyof typeof modes;
type Entry = { best: number; recalls: number; due: number; xp: number; day: string };
export type Progress = Record<string, Entry>;
export const dayKey = (now: number) => new Date(now).toLocaleDateString('en-CA');
const skills = { flash: 0, match: 1, memory: 1, spell: 2, recall: 3 };

export function score(previous: Entry | undefined, mode: Mode, correct: boolean, now: number): Entry {
  const old = previous ?? { best: -1, recalls: 0, due: 0, xp: 0, day: '' };
  const level = skills[mode];
  const due = now >= old.due;
  const xp = correct && mode !== 'flash' && (level > old.best || (due && mode === 'recall')) ? level * 3 : 0;
  const recalls = !correct ? 0 : old.recalls + Number(mode === 'recall' && (due || !old.recalls));
  const interval = [1, 3, 7, 14, 30][Math.min(4, Math.max(0, recalls - 1))];
  return { best: correct ? Math.max(old.best, level) : old.best, recalls, xp: old.xp + xp, day: dayKey(now),
    due: !correct ? now : mode === 'recall' && (due || !old.recalls) ? now + interval * 86400000 : previous?.due ?? now };
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}