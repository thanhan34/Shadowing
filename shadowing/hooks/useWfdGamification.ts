import { useCallback, useEffect, useRef, useState } from 'react';
import type { Profile, WeeklyEntry, Challenge } from '../lib/wfd/rules';

export interface RankedEntry extends WeeklyEntry { rank: number; accuracy: number }
export interface Dashboard {
  day: string; week: string; profile: Profile; today: { goal: number; practiced: number; rewarded: boolean };
  leaderboard: RankedEntry[]; me: RankedEntry | null; previousRank: number | null;
  nextRank: { name: string; xpNeeded: number } | null;
  challengeAwards: { week: string; title: string; unlockedAt: string }[];
  challenge: (Challenge & { progress: number; rewarded: boolean }) | null;
}
export async function wfdRequest(action: string, body?: object) {
  const response = await fetch(`/api/wfd/${action}`, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Không thể đồng bộ gamification.');
  return data;
}
export function useWfdGamification() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [celebrations, setCelebrations] = useState<string[]>([]);
  const [session, setSession] = useState({ practiced: 0, xp: 0, accuracySum: 0 });
  const [initialRank, setInitialRank] = useState<number | null>(null);
  const sessionWeek = useRef('');
  const ticket = useRef<{ questionId: string; promise: Promise<string> } | null>(null);
  const locked = useRef(false);
  const queue = useRef<{ attemptId: string; answer: string }[]>([]);
  const [queued, setQueued] = useState(0);
  const [retryError, setRetryError] = useState('');
  const refresh = useCallback(async () => {
    try { const next: Dashboard = await wfdRequest('dashboard'); setData(next); setError(''); return next; }
    catch (e) { setError((e as Error).message); return null; }
  }, []);
  useEffect(() => {
    let active = true;
    refresh().then(next => { if (active && next) { setInitialRank(next.me?.rank || null); sessionWeek.current = next.week; } });
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 60000);
    return () => { active = false; clearInterval(timer); };
  }, [refresh]);
  const prepare = useCallback((questionId: string) => {
    if (ticket.current?.questionId === questionId) return;
    const promise = wfdRequest('start', { questionId }).then(result => result.attemptId as string);
    ticket.current = { questionId, promise };
    void promise.catch(e => { if (ticket.current?.promise === promise) ticket.current = null; setError(e.message); });
  }, []);
  const send = useCallback(async () => {
    if (locked.current) return;
    locked.current = true; setPending(true);
    try {
      while (queue.current.length) {
        const result = await wfdRequest('submit', queue.current[0]);
        if (result.eligible) {
          window.dispatchEvent(new Event('wfd-practiced'));
          try {
            const attribution = JSON.parse(sessionStorage.getItem('wfd-push-attribution') || 'null');
            if (attribution && Date.now() - attribution.at < 30 * 60000) {
              void fetch('/api/notifications/ack', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: attribution.id, event: 'review_started' }) }).catch(() => {});
              sessionStorage.removeItem('wfd-push-attribution');
            }
          } catch { /* Analytics must not interfere with practice. */ }
        }
        queue.current.shift(); setQueued(queue.current.length); setRetryError('');
        setSession(s => ({ practiced: s.practiced + 1, xp: s.xp + result.xp, accuracySum: s.accuracySum + result.accuracy }));
        setMessage(result.xp ? `+${result.xp} XP` : result.reason === 'daily-limit' ? 'Đã lưu lượt luyện · hết 5 lượt nhận XP cho câu này hôm nay.' : 'Đã lưu lượt luyện · không đủ điều kiện nhận XP.');
        setCelebrations(items => [...items, ...result.celebrations, ...result.newBadges.map((title: string) => `🏅 ${title}`)]);
      }
      await refresh();
    } catch (e) { setRetryError((e as Error).message); }
    finally { locked.current = false; setPending(false); }
  }, [refresh]);
  const submit = useCallback(async (questionId: string, answer: string) => {
    const prepared = ticket.current;
    if (!prepared || prepared.questionId !== questionId) {
      setError('Chưa khởi tạo lượt nhận XP. Điểm WFD vẫn được chấm; hãy nghe lại để bắt đầu lượt mới.'); return;
    }
    ticket.current = null;
    try {
      queue.current.push({ attemptId: await prepared.promise, answer });
      setQueued(queue.current.length);
      await send();
    }
    catch (e) { setError((e as Error).message); }
  }, [send]);
  const retrySubmit = useCallback(() => { if (queue.current.length) void send(); }, [send]);
  const resetTicket = useCallback(() => { ticket.current = null; }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (queue.current.length || locked.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  const resetSession = useCallback(async () => {
    if (queue.current.length || locked.current) return;
    try { const snapshot = await wfdRequest('snapshot', {}); setInitialRank(snapshot.rank); sessionWeek.current = snapshot.week; setSession({ practiced: 0, xp: 0, accuracySum: 0 }); }
    catch (e) { setError((e as Error).message); }
  }, []);
  return { data, error: retryError || error, pending, queued, message, celebrations, setCelebrations, refresh, prepare, submit,
    resetTicket, retrySubmit, hasRetry: !!retryError,
    session, initialRank: data?.week === sessionWeek.current ? initialRank : null, resetSession };
}