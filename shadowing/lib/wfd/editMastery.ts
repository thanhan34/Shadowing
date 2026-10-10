import { firebaseAdmin } from '../firebaseAdmin';
import type { MasteryQuestion } from './mastery';

export class MasteryEditError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    Object.setPrototypeOf(this, MasteryEditError.prototype);
    this.name = 'MasteryEditError';
  }
}
export interface MasteryEdit {
  userId: string; questionId: string; stage: number; nextReviewAt: number | 'now';
  reason: string; expected: MasteryQuestion | null;
}
const validProgress = (value: any): value is MasteryQuestion => !!value && Number.isInteger(value.stage) && value.stage >= 0 && value.stage <= 4 &&
  typeof value.mastered === 'boolean' && Number.isSafeInteger(value.nextReviewAt) && value.nextReviewAt > 0 && Number.isSafeInteger(value.lastPracticedAt) && value.lastPracticedAt >= 0;
export function validateMasteryEdit(value: any): value is MasteryEdit {
  return !!value && typeof value.userId === 'string' && /^[\w-]{1,150}$/.test(value.userId) &&
    typeof value.questionId === 'string' && /^[\w-]{1,150}$/.test(value.questionId) &&
    Number.isInteger(value.stage) && value.stage >= 0 && value.stage <= 4 &&
    (value.nextReviewAt === 'now' || (Number.isSafeInteger(value.nextReviewAt) && value.nextReviewAt > 0 && value.nextReviewAt <= 4102444800000)) &&
    typeof value.reason === 'string' && value.reason.trim().length >= 3 && value.reason.length <= 500 &&
    (value.expected === null || validProgress(value.expected));
}
export async function editMastery(edit: MasteryEdit, actorId: string) {
  const db = firebaseAdmin().db;
  const profile = db.collection('_wfd').doc('users').collection('profiles').doc(edit.userId);
  const ref = profile.collection('mastery').doc('summary');
  const audit = profile.collection('masteryEdits').doc();
  return db.runTransaction(async tx => {
    const [summary, question] = await Promise.all([tx.get(ref), tx.get(db.collection('writefromdictation').doc(edit.questionId))]);
    if (!question.exists || question.data()?.isHidden !== false) throw new MasteryEditError(404, 'Câu WFD không còn khả dụng.');
    const data = summary.data() || {};
    const questions = { ...(data.questions || {}) } as Record<string, MasteryQuestion>;
    const before = questions[edit.questionId] || null;
    if ((before === null) !== (edit.expected === null) || (before && edit.expected &&
      (['stage', 'mastered', 'nextReviewAt', 'lastPracticedAt'] as const).some(key => before[key] !== edit.expected![key]))) {
      throw new MasteryEditError(409, 'Tiến độ đã thay đổi. Hãy làm mới trang và thử lại.');
    }
    if (!before && Object.keys(questions).length >= 2000) throw new MasteryEditError(409, 'Học viên đã đạt giới hạn 2000 câu theo dõi.');
    const now = Date.now();
    const after: MasteryQuestion = { stage: edit.stage, mastered: edit.stage >= 2,
      nextReviewAt: edit.nextReviewAt === 'now' ? now : edit.nextReviewAt,
      lastPracticedAt: before?.lastPracticedAt || 0 };
    questions[edit.questionId] = after;
    // Preserve review history. An administrative edit is not a practice attempt.
    tx.set(ref, { ...data, questions, updatedAt: now });
    tx.set(audit, { actorId, userId: edit.userId, questionId: edit.questionId, reason: edit.reason.trim(), before, after, createdAt: now });
    return after;
  });
}