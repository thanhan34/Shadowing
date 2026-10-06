import type { NotificationStats, WfdNotificationType } from './types';
export function notificationTemplate(type: WfdNotificationType, stats: NotificationStats, milestone = 0) {
  switch (type) {
    case 'due_review': return { title: `🧠 ${stats.dueReviewCount} câu WFD đến hạn ôn`, body: 'Ôn ngay để củng cố trí nhớ.', url: '/writefromdictation?mode=review' };
    case 'overdue_review': return { title: `🧠 ${stats.overdueReviewCount} câu WFD đang quá hạn ôn`, body: 'Ôn lại các câu này để duy trì kiến thức đã học.', url: '/writefromdictation?mode=review' };
    case 'streak_warning': return { title: `🔥 Giữ streak ${stats.currentStreak} ngày`, body: `Bạn còn ${stats.goal - stats.practiced} câu để hoàn thành mục tiêu hôm nay.`, url: '/writefromdictation' };
    case 'daily_goal': return { title: `🎯 Còn ${stats.goal - stats.practiced} câu nữa`, body: 'Hoàn thành hôm nay để đạt Daily Goal.', url: '/writefromdictation' };
    case 'mastery_milestone': return { title: `🎉 Bạn đã đạt ${milestone}% Mastery`, body: `${stats.masteredCount} / ${stats.total} câu đã đạt Mastered.`, url: '/writefromdictation/mastery' };
    default: throw new Error('Notification type is not enabled in Phase 1');
  }
}