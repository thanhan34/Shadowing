import { firebaseAdmin } from '../firebaseAdmin';
import { calendar, emptyProfile, visibleStreak } from '../wfd/rules';
import type { MasteryQuestion } from '../wfd/mastery';
import { localClock } from './notificationEngine';
import type { Transaction } from 'firebase-admin/firestore';
export async function activeWfdIds() {
  const docs = await firebaseAdmin().db.collection('writefromdictation').where('isHidden', '==', false).select().get();
  return new Set(docs.docs.map(d => d.id));
}
export async function notificationStats(uid: string, now: number, timezone: string, activeIds: Set<string>, transaction?: Transaction) {
  const ref = firebaseAdmin().db.collection('_wfd').doc('users').collection('profiles').doc(uid);
  // Goals/streak use the existing WFD calendar (Asia/Ho_Chi_Minh), not the delivery timezone.
  const day = calendar(now).day;
  const [profileDoc, dailyDoc, masteryDoc] = await Promise.all([
    transaction ? transaction.get(ref) : ref.get(),
    transaction ? transaction.get(ref.collection('days').doc(day)) : ref.collection('days').doc(day).get(),
    transaction ? transaction.get(ref.collection('mastery').doc('summary')) : ref.collection('mastery').doc('summary').get(),
  ]);
  const profile = { ...emptyProfile(), ...profileDoc.data() };
  const questions = (masteryDoc.data()?.questions || {}) as Record<string, MasteryQuestion>;
  const entries = Object.entries(questions).filter(([id]) => activeIds.has(id));
  const due = entries.filter(([, q]) => q.nextReviewAt <= now);
  const mastered = entries.filter(([, q]) => q.mastered);
  const overdue = due.filter(([, q]) => q.nextReviewAt + 86400000 <= now);
  const lastReviewedAt = masteryDoc.data()?.lastReviewedAt || 0;
  return { dueReviewCount: due.length, overdueReviewCount: overdue.length,
    reviewedToday: !!lastReviewedAt && localClock(lastReviewedAt, timezone).dateKey === localClock(now, timezone).dateKey,
    goal: dailyDoc.data()?.goal || profile.goal, practiced: dailyDoc.data()?.practiced || 0,
    currentStreak: visibleStreak(profile, day), masteredCount: mastered.length, total: activeIds.size,
    masteryRate: activeIds.size ? mastered.length / activeIds.size * 100 : 0,
    retentionRate: mastered.length ? 100 * (mastered.length - overdue.filter(([, q]) => q.mastered).length) / mastered.length : null,
    reviewIds: due.map(([id]) => id), trackedCount: entries.length, capacity: 2000,
  };
}