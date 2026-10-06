import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Card from '../../components/ui/Card';
import AppShellBackground from '../../components/ui/AppShellBackground';
import { notificationRequest } from '../../lib/notifications/client';
interface Stats { masteredCount: number; total: number; masteryRate: number; dueReviewCount: number; overdueReviewCount: number; retentionRate: number | null; trackedCount: number; capacity: number }
export default function MasteryPage() {
  const [stats, setStats] = useState<Stats | null>(null), [error, setError] = useState('');
  useEffect(() => { notificationRequest('mastery').then(setStats).catch(e => setError(e.message)); }, []);
  return <AppShellBackground><Head><title>WFD Mastery · PTE Intensive</title></Head><main className="mx-auto max-w-3xl space-y-6 px-4 pb-12 pt-32 text-textGlass-primary">
    <h1 className="text-3xl font-bold">WFD Mastery</h1><p role="status">{error || (!stats ? 'Đang tải tiến độ…' : '')}</p>
    {stats && <><div className="grid gap-4 sm:grid-cols-2">{[
      ['Mastered', `${stats.masteredCount} / ${stats.total} (${stats.masteryRate.toFixed(1)}%)`],
      ['Đến hạn ôn', stats.dueReviewCount], ['Quá hạn ít nhất 24 giờ', stats.overdueReviewCount],
      ['Mastered chưa quá hạn', stats.retentionRate === null ? 'Chưa có dữ liệu' : `${stats.retentionRate.toFixed(1)}%`],
    ].map(([label, value]) => <Card key={label} className="space-y-2 p-6"><h2 className="text-sm text-textGlass-secondary">{label}</h2><p className="text-2xl font-semibold">{value}</p></Card>)}</div>
      {stats.trackedCount >= stats.capacity && <p role="alert">Đã đạt giới hạn {stats.capacity} câu theo dõi. Cần nâng cấp lưu trữ trước khi thêm câu mới.</p>}</>}
    <Card className="space-y-4 p-6"><h2 className="text-xl font-semibold">Cách tính Phase 1</h2>
      <p className="text-textGlass-secondary">Trả lời đúng 100%, sau đó vượt qua hai lượt ôn đến hạn để đạt Mastered. Lịch ôn: 1, 3, 7, 14, 30 ngày. Luyện sớm không tăng bậc; trả lời sai đưa câu về Learning.</p>
      <p className="text-sm text-textGlass-muted">“Mastered chưa quá hạn” là chỉ số lịch ôn, không phải xác suất nhớ. Tiến độ bắt đầu từ các lượt luyện hợp lệ sau khi tính năng được triển khai; không suy diễn từ XP cũ.</p>
      <div className="flex flex-wrap gap-4"><Link className="accent-ring rounded-btn p-3 text-primary" href="/writefromdictation?mode=review">Ôn câu đến hạn</Link><Link className="accent-ring rounded-btn p-3 text-primary" href="/settings/notifications">Cài đặt thông báo</Link></div>
    </Card>
  </main></AppShellBackground>;
}