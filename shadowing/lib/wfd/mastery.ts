/** Product policy v1. This is a review schedule, not a measured probability of recall. */
export const REVIEW_DAYS = [1, 3, 7, 14, 30] as const;
export const MASTERY_THRESHOLDS = [25, 50, 75, 80, 90, 95, 100] as const;
export interface MasteryQuestion {
  stage: number;
  nextReviewAt: number;
  lastPracticedAt: number;
  mastered: boolean;
}
export interface ReviewBucket { count: number; mastered: number }
export interface MasterySummary {
  masteredCount: number;
  practicedCount: number;
  buckets: Record<string, ReviewBucket>;
  lastReviewedAt: number;
  updatedAt: number;
}
export const emptyMasterySummary = (): MasterySummary => ({ masteredCount: 0, practicedCount: 0,
  buckets: {}, lastReviewedAt: 0, updatedAt: 0 });
export function advanceMastery(previous: MasteryQuestion | undefined, perfect: boolean, now: number): MasteryQuestion {
  if (!perfect) return { stage: 0, mastered: false, lastPracticedAt: now, nextReviewAt: now + 86400000 };
  // Early repetition never advances a spaced review or postpones its due date.
  if (previous && previous.nextReviewAt > now) return { ...previous, lastPracticedAt: now };
  const stage = previous ? Math.min(previous.stage + 1, REVIEW_DAYS.length - 1) : 0;
  return { stage, mastered: stage >= 2, lastPracticedAt: now, nextReviewAt: now + REVIEW_DAYS[stage] * 86400000 };
}
// Hour buckets round UP: a reminder must never announce a question before it is due.
export const reviewBucketKey = (time: number) => String(Math.ceil(time / 3600000) * 3600000);
export function updateMasterySummary(summary: MasterySummary, previous: MasteryQuestion | undefined,
  next: MasteryQuestion, now: number): MasterySummary {
  const buckets = Object.fromEntries(Object.entries(summary.buckets).map(([key, value]) => [key, { ...value }]));
  if (previous) {
    const key = reviewBucketKey(previous.nextReviewAt);
    if (buckets[key]) {
      buckets[key].count--;
      buckets[key].mastered -= Number(previous.mastered);
      if (buckets[key].count <= 0) delete buckets[key];
    }
  }
  const key = reviewBucketKey(next.nextReviewAt);
  const bucket = buckets[key] || { count: 0, mastered: 0 };
  buckets[key] = { count: bucket.count + 1, mastered: bucket.mastered + Number(next.mastered) };
  return { buckets, masteredCount: summary.masteredCount + Number(next.mastered) - Number(previous?.mastered || false),
    practicedCount: summary.practicedCount + Number(!previous), updatedAt: now,
    lastReviewedAt: previous && previous.nextReviewAt <= now ? now : summary.lastReviewedAt };
}
export function summarizeMastery(summary: MasterySummary, total: number, now: number) {
  let dueReviewCount = 0, overdueReviewCount = 0, overdueMastered = 0;
  for (const [time, bucket] of Object.entries(summary.buckets)) {
    if (Number(time) <= now) dueReviewCount += bucket.count;
    if (Number(time) + 86400000 <= now) { overdueReviewCount += bucket.count; overdueMastered += bucket.mastered; }
  }
  return { dueReviewCount, overdueReviewCount, masteredCount: summary.masteredCount, total,
    masteryRate: total ? Math.min(100, summary.masteredCount / total * 100) : 0,
    retentionRate: summary.masteredCount ? (summary.masteredCount - overdueMastered) / summary.masteredCount * 100 : null };
}