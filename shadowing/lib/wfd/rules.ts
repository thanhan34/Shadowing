/** Versioned, server-authoritative reward policy. UI never supplies XP. */
export const XP_RULES = {
  version: 1, base: 5, perfect: 5, excellent: 3, good: 1, mastery: 2,
  dailyGoal: 20, maxPerQuestion: 5, minimumMs: 5000,
  streakRewards: { 7: 50, 14: 100, 30: 200 } as Record<number, number>,
};
export const GOALS = [10, 20, 30, 50] as const;
export const MILESTONES = [3, 7, 14, 30, 60, 100];
export function calculateWfdXp(accuracy: number, eligible: boolean, firstMastery: boolean, rules = XP_RULES) {
  if (!eligible || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) return 0;
  return rules.base + (accuracy === 100 ? rules.perfect : accuracy >= 90 ? rules.excellent : accuracy >= 80 ? rules.good : 0)
    + (firstMastery && accuracy === 100 ? rules.mastery : 0);
}
export function calendar(now = Date.now()) {
  const local = new Date(now + 7 * 3600000);
  const day = local.toISOString().slice(0, 10);
  local.setUTCDate(local.getUTCDate() - (local.getUTCDay() + 6) % 7);
  return { day, week: local.toISOString().slice(0, 10) };
}
export function dayDistance(a: string, b: string) {
  return (Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000;
}
export type Requirement = 'practiced' | 'perfectRun' | 'streak' | 'comeback';
export interface Achievement {
  id: string; title: string; description: string; icon: string;
  requirementType: Requirement; requirementValue: number; xpReward: number;
}
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'starter', title: 'Starter', description: 'Hoàn thành câu WFD đầu tiên.', icon: '🌱', requirementType: 'practiced', requirementValue: 1, xpReward: 0 },
  { id: 'first-100', title: 'First 100', description: 'Hoàn thành 100 WFD hợp lệ.', icon: '🎯', requirementType: 'practiced', requirementValue: 100, xpReward: 0 },
  { id: 'warrior', title: 'WFD Warrior', description: 'Hoàn thành 500 WFD hợp lệ.', icon: '🏅', requirementType: 'practiced', requirementValue: 500, xpReward: 0 },
  { id: 'master', title: 'WFD Master', description: 'Hoàn thành 1.000 WFD hợp lệ.', icon: '🏆', requirementType: 'practiced', requirementValue: 1000, xpReward: 0 },
  { id: 'perfect-ear', title: 'Perfect Ear', description: '10 đáp án hoàn hảo liên tiếp.', icon: '🎧', requirementType: 'perfectRun', requirementValue: 10, xpReward: 0 },
  { id: 'no-day-off', title: 'No Day Off', description: 'Hoàn thành goal 30 ngày liên tiếp.', icon: '🔥', requirementType: 'streak', requirementValue: 30, xpReward: 0 },
  { id: 'consistency', title: 'Consistency King', description: 'Hoàn thành goal 7 ngày liên tiếp.', icon: '📅', requirementType: 'streak', requirementValue: 7, xpReward: 0 },
  { id: 'comeback', title: 'Comeback', description: 'Trở lại sau ít nhất 7 ngày không hoạt động.', icon: '🚀', requirementType: 'comeback', requirementValue: 7, xpReward: 0 },
];
export interface Profile {
  goal: number; totalXp: number; practiced: number; currentStreak: number; longestStreak: number;
  lastCompletedDate: string; lastActiveDate: string; lastSubmitAt: number; perfectRun: number;
  unlocked: Record<string, string>; milestones: number[];
}
export const emptyProfile = (): Profile => ({ goal: 20, totalXp: 0, practiced: 0, currentStreak: 0,
  longestStreak: 0, lastCompletedDate: '', lastActiveDate: '', lastSubmitAt: 0, perfectRun: 0, unlocked: {}, milestones: [] });
export function visibleStreak(p: Profile, day: string) {
  return p.lastCompletedDate && dayDistance(day, p.lastCompletedDate) <= 1 ? p.currentStreak : 0;
}
export interface WeeklyEntry {
  userId: string; name: string; avatar: string; xp: number; practiced: number; attempts: number;
  accuracySum: number; reachedAt: number; currentStreak: number; lastCompletedDate: string;
}
export function compareRanks(a: WeeklyEntry, b: WeeklyEntry) {
  return b.xp - a.xp || (b.accuracySum / (b.practiced || 1) - a.accuracySum / (a.practiced || 1))
    || a.attempts - b.attempts || a.reachedAt - b.reachedAt || a.userId.localeCompare(b.userId);
}
export type ChallengeType = 'questions' | 'xp' | 'topic' | 'accuracy' | 'days' | 'mastery';
export interface Challenge {
  title: string; type: ChallengeType; target: number; rewardXp: number; topic: string;
  minimumAccuracy: number; badgeTitle: string; week: string;
}
export function challengeIncrement(c: Challenge, context: { accuracy: number; topic: string; xp: number; firstDay: boolean; mastery: boolean }) {
  switch (c.type) {
    case 'questions': return 1;
    case 'xp': return context.xp; // Practice XP only; bonuses cannot recursively complete challenges.
    case 'topic': return context.topic === c.topic ? 1 : 0;
    case 'accuracy': return context.accuracy >= c.minimumAccuracy ? 1 : 0;
    case 'days': return context.firstDay ? 1 : 0;
    case 'mastery': return context.mastery ? 1 : 0;
  }
}