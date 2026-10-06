import { MASTERY_THRESHOLDS } from '../wfd/mastery';
import { notificationTemplate } from './notificationTemplates';
import type { NotificationCandidate, NotificationHistory, NotificationPreferences, NotificationStats, WfdNotificationType } from './types';
export function localClock(now: number, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const value = (type: string) => parts.find(p => p.type === type)!.value;
  return { dateKey: `${value('year')}-${value('month')}-${value('day')}`, minutes: Number(value('hour')) * 60 + Number(value('minute')) };
}
export function inQuietHours(minutes: number, quiet: NotificationPreferences['quietHours']) {
  if (!quiet.enabled) return false;
  const parse = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const start = parse(quiet.start), end = parse(quiet.end);
  return start === end || (start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end);
}
export function evaluateUserNotifications(input: { userId: string; userStats: NotificationStats;
  notificationPreferences: NotificationPreferences; notificationHistory: NotificationHistory; currentTime: number;
  remainingThreshold?: number; minimumProgress?: number }): { shouldSend: boolean; reason?: string; candidate?: NotificationCandidate } {
  const { userId, userStats: s, notificationPreferences: p, notificationHistory: h, currentTime: now } = input;
  if (!p.enabled) return { shouldSend: false, reason: 'disabled' };
  const { dateKey, minutes } = localClock(now, p.timezone);
  if (inQuietHours(minutes, p.quietHours)) return { shouldSend: false, reason: 'quiet-hours' };
  if (h.dateKey === dateKey && h.reservedCount >= p.maxPushPerDay) return { shouldSend: false, reason: 'daily-limit' };
  if (h.lastReservedAt && now - h.lastReservedAt < 4 * 3600000) return { shouldSend: false, reason: 'spacing' };
  const candidates: NotificationCandidate[] = [];
  const add = (type: WfdNotificationType, priority: number, milestone?: number) => {
    const dedupeKey = `${type}:${userId}:${milestone ?? dateKey}`;
    if (!h.dedupeKeys.includes(dedupeKey)) candidates.push({ type, priority, dedupeKey,
      ...notificationTemplate(type, s, milestone), ...(milestone ? { milestone } : {}) });
  };
  // Review window stops before the evening window, leaving streak a fair opportunity.
  const reviewWindow = minutes >= 8 * 60 && minutes < p.reminderHour * 60;
  if (reviewWindow && !s.reviewedToday) {
    if (s.overdueReviewCount > 0 && p.overdueReview) add('overdue_review', 1);
    else if (s.dueReviewCount > 0 && p.dueReview) add('due_review', 3);
  }
  const remaining = s.goal - s.practiced;
  if (minutes >= p.reminderHour * 60 && remaining > 0 && s.goal > 0) {
    if (p.streakReminder && s.currentStreak >= 2) add('streak_warning', 2);
    else if (p.dailyGoal && remaining <= (input.remainingThreshold ?? 10) && s.practiced / s.goal >= (input.minimumProgress ?? 0.5)) add('daily_goal', 5);
  }
  const milestone = [...MASTERY_THRESHOLDS].reverse().find(m => s.masteryRate >= m && m > h.milestoneHighWater);
  if (p.masteryMilestone && milestone) add('mastery_milestone', 6, milestone);
  candidates.sort((a, b) => a.priority - b.priority);
  return candidates.length ? { shouldSend: true, candidate: candidates[0] } : { shouldSend: false, reason: 'not-eligible' };
}