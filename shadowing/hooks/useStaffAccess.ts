import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/** Fail closed and bind the server-verified role to the current signed-in user. */
export function useStaffAccess() {
  const { userId, isLoaded } = useAuth();
  const [allowedFor, setAllowedFor] = useState('');
  useEffect(() => {
    setAllowedFor('');
    if (!isLoaded || !userId) return;
    let disposed = false;
    let current: AbortController | undefined;
    async function refresh() {
      current?.abort();
      const controller = new AbortController();
      current = controller;
      setAllowedFor('');
      try {
        const response = await fetch('/api/access', { cache: 'no-store', signal: controller.signal });
        const data = response.ok ? await response.json() : null;
        if (!disposed && !controller.signal.aborted) setAllowedFor(data?.staff === true ? userId! : '');
      } catch {
        if (!disposed && !controller.signal.aborted) setAllowedFor('');
      }
    }
    void refresh();
    window.addEventListener('focus', refresh);
    return () => { disposed = true; current?.abort(); window.removeEventListener('focus', refresh); };
  }, [isLoaded, userId]);
  return !!(isLoaded && userId && allowedFor === userId);
}