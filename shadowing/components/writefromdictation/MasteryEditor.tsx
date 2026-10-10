import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import type { MasteryQuestion } from '../../lib/wfd/mastery';

export default function MasteryEditor({ userId, studentName, questionId, progress, onSaved }: {
  userId: string; studentName: string; questionId: string; progress: MasteryQuestion | null; onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(progress?.stage || 0);
  const [schedule, setSchedule] = useState('now');
  const [time, setTime] = useState(progress ? new Date(progress.nextReviewAt + 7 * 3600000).toISOString().slice(0, 16) : '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const nextReviewAt = schedule === 'now' ? 'now' : new Date(`${time}:00+07:00`).getTime();
    if (nextReviewAt !== 'now' && !Number.isFinite(nextReviewAt)) { setError('Vui lòng nhập lịch ôn hợp lệ.'); return; }
    if (!window.confirm(`Lưu mastery câu ${questionId} cho ${studentName}? Bậc ${stage + 1}/5 (${stage >= 2 ? 'Mastered' : 'Learning'}), ${schedule === 'now' ? 'đến hạn ngay' : `ôn lúc ${time.replace('T', ' ')} giờ Việt Nam`}. Đây là thay đổi dữ liệu thật, không phải bản xem trước.`)) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/wfd-mastery-edit', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, questionId, stage, nextReviewAt, reason, expected: progress }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể lưu mastery.');
      onSaved();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  if (!open) return <Button variant="secondary" onClick={() => setOpen(true)}>Chỉnh mastery</Button>;
  return <form onSubmit={save} className="space-y-4 border-t border-white/15 pt-4" aria-label={`Chỉnh mastery câu ${questionId}`}>
    <p className="text-sm text-textGlass-secondary">Thay đổi trực tiếp mastery và lịch ôn, không cộng XP hay tạo lượt luyện. Bậc 3–5 là Mastered. Thay đổi có thể ảnh hưởng thông báo ôn tập.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-sm"><span className="block">Bậc mastery</span><select className="ui-input w-full" value={stage} disabled={busy} onChange={event => setStage(Number(event.target.value))}>{[0, 1, 2, 3, 4].map(value => <option key={value} value={value}>Bậc {value + 1} · {value >= 2 ? 'Mastered' : 'Learning'}</option>)}</select></label>
      <label className="space-y-2 text-sm"><span className="block">Lịch ôn</span><select className="ui-input w-full" value={schedule} disabled={busy} onChange={event => setSchedule(event.target.value)}><option value="now">Đến hạn ngay (test ôn tập)</option><option value="custom">Chọn ngày giờ</option></select></label>
    </div>
    {schedule === 'custom' && <label className="block space-y-2 text-sm"><span>Ôn tiếp theo · giờ Việt Nam (UTC+7)</span><Input type="datetime-local" required value={time} max="2099-12-31T23:59" disabled={busy} onChange={event => setTime(event.target.value)} className="w-full" /></label>}
    <label className="block space-y-2 text-sm"><span>Lý do chỉnh sửa (bắt buộc)</span><Input required minLength={3} maxLength={500} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} placeholder="Ví dụ: Tạo câu đến hạn để kiểm tra audio trên local" className="w-full" /></label>
    {error && <p role="alert" className="text-sm">{error}</p>}
    <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy || reason.trim().length < 3}>{busy ? 'Đang lưu…' : 'Lưu mastery'}</Button><Button type="button" variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Hủy</Button></div>
  </form>;
}