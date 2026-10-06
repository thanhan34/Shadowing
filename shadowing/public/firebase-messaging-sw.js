/* FCM compat matches the SDK installed in this project. Configuration is supplied
   in the registration URL from the shared public Firebase config, not secrets. */
self.addEventListener('notificationclick', event => {
  event.stopImmediatePropagation();
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil((async () => {
    const url = new URL(data.url || '/writefromdictation', self.location.origin);
    if (url.origin !== self.location.origin || !/^\/writefromdictation(?:\/mastery)?$/.test(url.pathname)) return;
    if (data.notificationId) url.searchParams.set('notificationId', data.notificationId);
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate(url.href); await existing.focus(); }
    else await self.clients.openWindow(url.href);
  })());
});
self.addEventListener('notificationclose', event => {
  const id = event.notification.data && event.notification.data.notificationId;
  if (id) event.waitUntil(fetch('/api/notifications/ack', { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, event: 'dismissed' }) }).catch(() => {}));
});
importScripts('https://www.gstatic.com/firebasejs/10.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.1.0/firebase-messaging-compat.js');
const config = JSON.parse(new URL(self.location.href).searchParams.get('config') || '{}');
firebase.initializeApp(config);
firebase.messaging().onBackgroundMessage(async payload => {
  const data = payload.data || {};
  if (!data.notificationId || !data.title) return;
  await self.registration.showNotification(data.title, {
    body: data.body, icon: '/logo1.png', tag: data.notificationId, data,
  });
});