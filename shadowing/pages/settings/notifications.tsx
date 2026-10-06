import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Head from 'next/head';
import Link from 'next/link';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AppShellBackground from '../../components/ui/AppShellBackground';
import { defaultPreferences, NotificationPreferences } from '../../lib/notifications/types';
import { notificationRequest, registerBrowserToken, removeBrowserToken, safeNotificationUrl } from '../../lib/notifications/client';
type Log = { id: string; title: string; body: string; url: string; createdAt: number; read: boolean; status: string };
const options = [ ['dueReview', 'Câu đến hạn ôn'], ['overdueReview', 'Câu quá hạn ôn'], ['streakReminder', 'Giữ streak'],
  ['dailyGoal', 'Hoàn thành Daily Goal'], ['masteryMilestone', 'Cột mốc Mastery'] ] as const;
export default function NotificationSettings() {
  const { userId } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPreferences);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [permission, setPermission] = useState('');
  useEffect(() => {
    setPermission('Notification' in window ? Notification.permission : 'unsupported');
    notificationRequest('settings').then(data => { setPrefs(data.preferences); setLogs(data.logs); })
      .catch(e => setMessage(e.message)).finally(() => setLoading(false));
  }, []);
  const save = async (next: NotificationPreferences) => {
    const data = await notificationRequest('settings', next); setPrefs(data.preferences);
    window.dispatchEvent(new Event('wfd-notification-settings')); setMessage('Đã lưu cài đặt.');
  };
  const action = async (fn: () => Promise<void>) => {
    setBusy(true); setMessage(''); try { await fn(); } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  };
  const enable = () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied') { setMessage('Thông báo đang bị chặn. Hãy mở cài đặt quyền của website trong trình duyệt, cho phép thông báo rồi thử lại.'); return; }
    const request = Notification.permission === 'granted' ? Promise.resolve('granted') : Notification.requestPermission();
    void action(async () => {
      const result = await request; setPermission(result);
      await notificationRequest('prompt', { choice: result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'later' });
      if (result !== 'granted') return;
      await registerBrowserToken();
      if (userId) localStorage.setItem('wfd-push-owner', userId);
      await save({ ...prefs, enabled: true });
    });
  };
  return <AppShellBackground><Head><title>Thông báo WFD · PTE Intensive</title></Head><main className="mx-auto max-w-3xl space-y-6 px-4 pb-12 pt-32 text-textGlass-primary">
    <h1 className="text-2xl font-bold sm:text-3xl">🔔 Thông báo WFD</h1>
    <p className="text-textGlass-secondary">Nhắc đúng nội dung cần ôn, không phải thông báo quảng cáo.</p>
    <Card className="space-y-4 p-6"><h2 className="text-xl font-semibold">Push Notifications: {prefs.enabled ? 'ON' : 'OFF'}</h2>
      <p className="text-sm text-textGlass-secondary">Quyền trình duyệt: {permission || 'đang kiểm tra'}. Mỗi thiết bị cần bật riêng.</p>
      <div className="flex flex-wrap gap-3"><Button disabled={busy || loading || permission === 'unsupported'} onClick={enable}>Bật trên thiết bị này</Button>
        <Button variant="secondary" disabled={busy || loading} onClick={() => void action(async () => { await save({ ...prefs, enabled: false }); })}>Tắt toàn bộ push</Button>
        <Button variant="secondary" disabled={busy || loading} onClick={() => void action(async () => { await removeBrowserToken(); setMessage('Đã tắt trên thiết bị này.'); })}>Tắt thiết bị này</Button></div>
      {permission === 'unsupported' && <p>Trình duyệt chưa hỗ trợ thông báo. Bạn vẫn có thể sử dụng phần luyện WFD.</p>}
    </Card>
    <Card className="space-y-4 p-6"><h2 className="text-xl font-semibold">Nội dung và thời gian</h2>
      <fieldset disabled={loading || busy} className="space-y-3">
        {options.map(([key, label]) => <label key={key} className="flex min-h-[44px] cursor-pointer items-center gap-3"><input className="h-5 w-5 accent-primary focus-visible:outline-primary" type="checkbox" checked={prefs[key]} onChange={e => setPrefs({ ...prefs, [key]: e.target.checked })} />{label}</label>)}
        <label className="block">Giờ nhắc mục tiêu (12–21)<Input type="number" min={12} max={21} value={prefs.reminderHour} onChange={e => setPrefs({ ...prefs, reminderHour: Number(e.target.value) })} /></label>
        <label className="block">Múi giờ gửi thông báo<Input value={prefs.timezone} onChange={e => setPrefs({ ...prefs, timezone: e.target.value })} /></label>
        <p className="text-xs text-textGlass-muted">Ngày Daily Goal và streak vẫn theo Asia/Ho_Chi_Minh, giống hệ thống WFD hiện tại. Nhắc ôn bắt đầu từ 08:00 theo múi giờ gửi.</p>
        <label className="block">Tối đa push/ngày<Input type="number" min={1} max={2} value={prefs.maxPushPerDay} onChange={e => setPrefs({ ...prefs, maxPushPerDay: Number(e.target.value) })} /></label>
        <label className="flex min-h-[44px] items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-primary" checked={prefs.quietHours.enabled} onChange={e => setPrefs({ ...prefs, quietHours: { ...prefs.quietHours, enabled: e.target.checked } })} />Giờ yên lặng</label>
        <div className="grid grid-cols-2 gap-4"><label>Bắt đầu<Input type="time" value={prefs.quietHours.start} onChange={e => setPrefs({ ...prefs, quietHours: { ...prefs.quietHours, start: e.target.value } })} /></label>
          <label>Kết thúc<Input type="time" value={prefs.quietHours.end} onChange={e => setPrefs({ ...prefs, quietHours: { ...prefs.quietHours, end: e.target.value } })} /></label></div>
        <Button onClick={() => void action(() => save(prefs))}>Lưu cài đặt</Button>
      </fieldset>
      <p role="status" className="text-sm text-textGlass-secondary">{message}</p>
      <p className="text-xs text-textGlass-muted">Weak WFD, forecast và các nhắc nâng cao chưa được gửi trong Phase 1. Milestone cũng tính vào giới hạn ngày; các push cách nhau ít nhất 4 giờ.</p>
    </Card>
    <Card className="space-y-4 p-6"><h2 className="text-xl font-semibold">Thông báo gần đây</h2>
      {!logs.some(log => log.status === 'sent') && <p className="text-textGlass-secondary">Chưa có thông báo đã gửi.</p>}
      {logs.filter(log => log.status === 'sent').map(log => <article key={log.id} className="rounded-btn border border-glass-border p-4">
        <Link className="accent-ring block rounded-btn" href={`${safeNotificationUrl(log.url)}${log.url.includes('?') ? '&' : '?'}notificationId=${log.id}`}><h3 className="font-semibold">{!log.read && <span className="text-primary">● </span>}{log.title}</h3><p className="text-sm text-textGlass-secondary">{log.body}</p></Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><time className="text-xs text-textGlass-muted">{new Date(log.createdAt).toLocaleString('vi-VN')}</time>
          {!log.read && <Button variant="secondary" disabled={busy} onClick={() => void action(async () => { await notificationRequest('ack', { id: log.id, event: 'read' }); setLogs(items => items.map(item => item.id === log.id ? { ...item, read: true } : item)); })}>Đánh dấu đã đọc</Button>}</div>
      </article>)}
    </Card>
  </main></AppShellBackground>;
}