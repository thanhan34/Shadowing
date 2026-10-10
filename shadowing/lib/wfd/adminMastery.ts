import type { MasteryQuestion } from './mastery';

export function adminMasteryStats(questions: Record<string, MasteryQuestion>, activeIds: Set<string>, now: number) {
  const entries = Object.entries(questions).filter(([id]) => activeIds.has(id));
  const mastered = entries.filter(([, question]) => question.mastered);
  const overdue = entries.filter(([, question]) => question.nextReviewAt + 86400000 <= now);
  return {
    total: activeIds.size, practicedCount: entries.length, masteredCount: mastered.length,
    masteryRate: activeIds.size ? mastered.length / activeIds.size * 100 : 0,
    dueReviewCount: entries.filter(([, question]) => question.nextReviewAt <= now).length,
    overdueReviewCount: overdue.length,
    retentionRate: mastered.length ? (mastered.length - overdue.filter(([, question]) => question.mastered).length) / mastered.length * 100 : null,
    lastPracticedAt: entries.reduce((latest, [, question]) => Math.max(latest, question.lastPracticedAt), 0),
  };
}
export type AdminMasteryStats = ReturnType<typeof adminMasteryStats>;
export interface MasteryStudent {
  id: string; name: string; email: string; role: string; stats: AdminMasteryStats;
}
export interface MasteryDetail {
  canEdit: boolean;
  student: MasteryStudent;
  questions: { id: string; text: string; progress: MasteryQuestion | null }[];
  now: number;
}