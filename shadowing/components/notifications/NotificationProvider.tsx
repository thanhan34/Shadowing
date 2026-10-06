import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { db } from '../../firebase';
import { defaultPreferences, NotificationPreferences } from '../../lib/notifications/types';
import { notificationRequest, registerBrowserToken, safeNotificationUrl } from '../../lib/notifications/client';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function NotificationProvider() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [prompt, setPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState<Record<string, string> | null>(null);
  const prefs = useRef<NotificationPreferences>(defaultPreferences);
  const choice = useRef<{ choice: string; at: number } | null>(null);
  const loadedFor = useRef('');
  const refresh = useCallback(async () => {
    if (!userId) return;
    const data = await notificationRequest('settings');
    prefs.current = data.preferences; choice.current = data.prompt; loadedFor.current = userId;
    return data;
  }, [userId]);
  useEffect(() => {
    if (!isLoaded) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    setPrompt(false); setBanner(null); loadedFor.current = '';
    const initialize = async () => {
      const sdk = await import('firebase/messaging');
      if (!await sdk.isSupported()) return;
      if (!active) return;
      const previousOwner = localStorage.getItem('wfd-push-owner');
      if (previousOwner && previousOwner !== userId) {
        await sdk.deleteToken(sdk.getMessaging(db.app)).catch(() => {});
        localStorage.removeItem('wfd-push-device');
        localStorage.removeItem('wfd-push-owner');
      }
      if (!userId) {
        // Revoke browser subscription after sign-out, even though the former API session is gone.
        await sdk.deleteToken(sdk.getMessaging(db.app)).catch(() => {});
        localStorage.removeItem('wfd-push-device');
        return;
      }
      const data = await refresh();
      if (!active) return;
      if (data?.preferences.enabled && Notification.permission === 'granted' && localStorage.getItem('wfd-push-optout') !== 'true') {
        await registerBrowserToken(); localStorage.setItem('wfd-push-owner', userId);
      }
      if (!active) return;
      unsubscribe?.();
      unsubscribe = sdk.onMessage(sdk.getMessaging(db.app), payload => {
        if (payload.data?.userId === userId && payload.data.notificationId) setBanner(payload.data);
      });
    };
    void initialize().catch(() => {}); // Push must never block WFD practice.
    const visible = () => { if (document.visibilityState === 'visible') void initialize().catch(() => {}); };
    const changed = () => { void refresh().catch(() => {}); };
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('wfd-notification-settings', changed);
    return () => { active = false; unsubscribe?.(); document.removeEventListener('visibilitychange', visible); window.removeEventListener('wfd-notification-settings', changed); };
  }, [userId, isLoaded, refresh]);
  useEffect(() => {
    const practiced = () => {
      if (!userId || loadedFor.current !== userId || !('Notification' in window) || Notification.permission !== 'default' || prefs.current.enabled) return;
      const previous = choice.current;
      if (previous && (previous.choice === 'denied' || Date.now() - previous.at < 30 * 86400000)) return;
      choice.current = { choice: 'prompted', at: Date.now() };
      setPrompt(true);
      void notificationRequest('prompt', { choice: 'prompted' }).catch(() => {});
    };
    window.addEventListener('wfd-practiced', practiced);
    return () => window.removeEventListener('wfd-practiced', practiced);
  }, [userId]);
  useEffect(() => { if (prompt) dialog.current?.showModal(); else dialog.current?.close(); }, [prompt]);
  useEffect(() => {
    const id = router.query.notificationId;
    if (!userId || typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) return;
    void notificationRequest('ack', { id, event: 'clicked' }).then(() => {
      sessionStorage.setItem('wfd-push-attribution', JSON.stringify({ id, at: Date.now() }));
    }).catch(() => {});
  }, [router.query.notificationId, userId]);
  const later = () => {
    setPrompt(false); choice.current = { choice: 'later', at: Date.now() };
    void notificationRequest('prompt', { choice: 'later' }).catch(() => {});
  };
  const enable = async () => {
    // Keep the permission request directly in the user activation handler.
    const permission = Notification.requestPermission();
    setBusy(true); setError('');
    try {
      const status = await permission;
      await notificationRequest('prompt', { choice: status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'later' });
      choice.current = { choice: status === 'granted' ? 'granted' : 'denied', at: Date.now() };
      if (status !== 'granted') { setPrompt(false); return; }
      await registerBrowserToken();
      if (userId) localStorage.setItem('wfd-push-owner', userId);
      await notificationRequest('settings', { ...prefs.current, enabled: true });
      await refresh(); setPrompt(false);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  if (!userId) return null;
  return <>
    <dialog ref={dialog} aria-labelledby="push-permission-title" className="w-[calc(100%-32px)] max-w-md rounded-card border border-glass-border bg-appBg-deep2 p-0 text-textGlass-primary shadow-glassStrong backdrop:bg-black/70"
      onCancel={event => { event.preventDefault(); if (!busy) later(); }}>
      <div className="space-y-4 p-6">
        <h2 id="push-permission-title" className="text-xl font-semibold">🔔 Nhắc bạn ôn WFD đúng lúc</h2>
        <p className="text-textGlass-secondary">PTE Intensive có thể nhắc bạn khi:</p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-textGlass-secondary"><li>Có câu WFD đến hạn ôn</li><li>Sắp mất streak</li><li>Còn vài câu để hoàn thành mục tiêu hôm nay</li></ul>
        <p className="text-xs text-textGlass-muted">Mặc định tối đa 1 thông báo/ngày, không gửi từ 22:00 đến 07:00.</p>
        {error && <p role="alert">{error}</p>}
        <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => void enable()}>Bật thông báo</Button><Button variant="secondary" disabled={busy} onClick={later}>Để sau</Button></div>
      </div>
    </dialog>
    {banner && <aside className="fixed bottom-4 right-4 z-50 max-w-sm p-2" aria-live="polite"><Card strong className="space-y-3 p-4">
      <h2 className="font-semibold text-textGlass-primary">{banner.title}</h2><p className="text-sm text-textGlass-secondary">{banner.body}</p>
      <div className="flex items-center gap-4"><Link className="accent-ring rounded-btn p-3 text-primary" href={`${safeNotificationUrl(banner.url)}${banner.url?.includes('?') ? '&' : '?'}notificationId=${encodeURIComponent(banner.notificationId)}`} onClick={() => setBanner(null)}>Xem ngay</Link>
        <Button variant="secondary" onClick={() => { void notificationRequest('ack', { id: banner.notificationId, event: 'dismissed' }).catch(() => {}); setBanner(null); }}>Đóng</Button></div>
    </Card></aside>}
  </>;
}