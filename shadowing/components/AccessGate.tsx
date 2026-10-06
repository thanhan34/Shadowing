import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getAuth, signInWithCustomToken, signOut, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { db } from '../firebase';
import { isPublicPath } from '../lib/access';
import AppShellBackground from './ui/AppShellBackground';
import Card from './ui/Card';

// Serialize Firebase mutations across effect cleanup, retries and account changes.
let connectionQueue: Promise<void> = Promise.resolve();

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [readyFor, setReadyFor] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const publicPage = isPublicPath(router.pathname) || router.pathname === '/pending-approval';
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setReadyFor(''); setError('');
    const auth = getAuth(db.app);
    if (isLoaded && !userId) {
      connectionQueue = connectionQueue.catch(() => {}).then(() => signOut(auth)).catch(() => {});
    }
    if (publicPage) return;
    const timer = window.setTimeout(() => {
      cancelled = true;
      controller.abort();
      setError('Kết nối mất quá 25 giây. Vui lòng kiểm tra mạng và thử lại.');
    }, 25000);
    async function connect() {
      try {
        if (cancelled) return;
        if (auth.currentUser && auth.currentUser.uid !== userId) await signOut(auth);
        await setPersistence(auth, inMemoryPersistence);
        if (cancelled) return;
        const response = await fetch('/api/firebase-token', { method: 'POST', signal: controller.signal, cache: 'no-store' });
        if (cancelled) return;
        if (!response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('Máy chủ xác thực chưa sẵn sàng. Vui lòng thử lại.');
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Không thể xác thực dữ liệu.');
        if (cancelled) return;
        if (auth.currentUser?.uid !== userId) await signInWithCustomToken(auth, data.token);
        if (!cancelled) setReadyFor(userId!);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Lỗi kết nối.');
      } finally { window.clearTimeout(timer); }
    }
    if (isLoaded && userId) connectionQueue = connectionQueue.catch(() => {}).then(connect);
    else if (isLoaded) {
      window.clearTimeout(timer);
      setError('Bạn cần đăng nhập để tiếp tục.');
    }
    return () => { cancelled = true; controller.abort(); window.clearTimeout(timer); };
  }, [isLoaded, userId, publicPage, attempt]);
  if (publicPage || (isLoaded && userId && readyFor === userId)) return <>{children}</>;
  if (!error) return <AppShellBackground>
    <main className="mx-auto flex max-w-xl justify-center px-4 pt-40" aria-busy="true">
      <div role="status" className="flex items-center justify-center p-4">
        <span aria-hidden="true" className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white/70 motion-safe:animate-spin" />
        <span className="sr-only">Đang tải trang…</span>
      </div>
    </main>
  </AppShellBackground>;
  return <AppShellBackground><main className="mx-auto max-w-xl px-4 pt-40 text-white"><Card>
    <p role="alert">{error}</p>
    {error && <button className="ui-button-secondary mt-4" onClick={() => setAttempt(value => value + 1)}>Thử lại</button>}
  </Card></main></AppShellBackground>;
}