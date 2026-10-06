export type WfdNotificationType = 'due_review' | 'overdue_review' | 'daily_goal' | 'streak_warning'
  | 'almost_mastered' | 'weak_wfd' | 'mastery_milestone' | 'retention_drop' | 'target_forecast' | 'inactive_student';
export interface NotificationPreferences {
  enabled: boolean; dueReview: boolean; overdueReview: boolean; dailyGoal: boolean; streakReminder: boolean;
  almostMastered: boolean; weakWfd: boolean; masteryMilestone: boolean; retentionDrop: boolean;
  targetForecast: boolean; inactiveReminder: boolean; reminderHour: number; timezone: string;
  maxPushPerDay: number; quietHours: { enabled: boolean; start: string; end: string };
}
export const defaultPreferences: NotificationPreferences = {
  enabled: false, dueReview: true, overdueReview: true, dailyGoal: true, streakReminder: true,
  almostMastered: false, weakWfd: false, masteryMilestone: true, retentionDrop: false,
  targetForecast: true, inactiveReminder: false, reminderHour: 19, timezone: 'Asia/Ho_Chi_Minh',
  maxPushPerDay: 1, quietHours: { enabled: true, start: '22:00', end: '07:00' },
};
export interface NotificationStats {
  dueReviewCount: number; overdueReviewCount: number; reviewedToday: boolean;
  goal: number; practiced: number; currentStreak: number; masteryRate: number; masteredCount: number; total: number;
}
export interface NotificationHistory {
  dateKey: string; reservedCount: number; lastReservedAt: number; dedupeKeys: string[]; milestoneHighWater: number;
}
export interface NotificationCandidate {
  type: WfdNotificationType; priority: number; title: string; body: string; url: string; dedupeKey: string; milestone?: number;
}