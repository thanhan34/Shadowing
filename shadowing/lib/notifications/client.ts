import { db } from '../../firebase';
import { firebaseConfig } from '../firebaseConfig';
export async function notificationRequest(action: string, body?: object) {
  const response = await fetch(`/api/notifications/${action}`, { cache: 'no-store', ...(body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : {}) });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Không thể cập nhật thông báo.');
  }
  return response.json();
}
export async function registerBrowserToken() {
  const sdk = await import('firebase/messaging');
  if (!await sdk.isSupported()) throw new Error('Trình duyệt này chưa hỗ trợ Web Push.');
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error('Hệ thống chưa cấu hình Web Push VAPID key.');
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?config=${encodeURIComponent(JSON.stringify(firebaseConfig))}`, { scope: '/firebase-push/' });
  if (!registration.active) await new Promise<void>((resolve, reject) => {
    const worker = registration.installing || registration.waiting;
    if (!worker) return reject(new Error('Service worker chưa sẵn sàng.'));
    const timer = setTimeout(() => reject(new Error('Service worker không phản hồi.')), 15000);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') { clearTimeout(timer); resolve(); }
      if (worker.state === 'redundant') { clearTimeout(timer); reject(new Error('Service worker không thể kích hoạt.')); }
    });
  });
  const token = await sdk.getToken(sdk.getMessaging(db.app), { vapidKey, serviceWorkerRegistration: registration });
  if (!token) throw new Error('Chưa nhận được token thông báo.');
  const data = await notificationRequest('token', { token, deviceName: navigator.userAgent.slice(0, 100) });
  localStorage.setItem('wfd-push-device', data.id);
  localStorage.removeItem('wfd-push-optout');
  return data;
}
export async function removeBrowserToken() {
  localStorage.setItem('wfd-push-optout', 'true');
  const id = localStorage.getItem('wfd-push-device');
  if (id) await notificationRequest('disable-device', { id });
  const sdk = await import('firebase/messaging');
  if (await sdk.isSupported()) await sdk.deleteToken(sdk.getMessaging(db.app));
  localStorage.removeItem('wfd-push-device');
}
export function safeNotificationUrl(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin && /^\/writefromdictation(?:\/mastery)?$/.test(url.pathname) ? url.pathname + url.search : '/writefromdictation';
  } catch { return '/writefromdictation'; }
}