import { createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { clerkClient } from '@clerk/nextjs/server';
import { getAccess } from '../access';
import { firebaseAdmin } from '../firebaseAdmin';
import { activeWfdIds, notificationStats } from './stats';
import { evaluateUserNotifications, localClock } from './notificationEngine';
import { defaultPreferences, NotificationHistory, NotificationPreferences } from './types';
export const tokenId = (value: string) => createHash('sha256').update(value).digest('hex');
export const notificationUser = (uid: string) => firebaseAdmin().db.collection('_notifications').doc(uid);
export const preferencesRef = (uid: string) => notificationUser(uid).collection('settings').doc('preferences');
export async function getPreferences(uid: string): Promise<NotificationPreferences> {
  return { ...defaultPreferences, ...(await preferencesRef(uid).get()).data() };
}
export function validatePreferences(value: unknown): NotificationPreferences {
  if (!value || typeof value !== 'object') throw new Error('Cài đặt không hợp lệ.');
  const data = value as Record<string, unknown>;
  const result = { ...defaultPreferences, quietHours: { ...defaultPreferences.quietHours } };
  for (const key of Object.keys(defaultPreferences) as (keyof NotificationPreferences)[]) {
    if (typeof defaultPreferences[key] === 'boolean') {
      if (typeof data[key] !== 'boolean') throw new Error('Cài đặt không hợp lệ.');
      Object.assign(result, { [key]: data[key] });
    }
  }
  if (!Number.isInteger(data.reminderHour) || Number(data.reminderHour) < 12 || Number(data.reminderHour) > 21) throw new Error('Giờ nhắc phải từ 12 đến 21.');
  if (![1, 2].includes(Number(data.maxPushPerDay))) throw new Error('Giới hạn mỗi ngày là 1 hoặc 2.');
  if (typeof data.timezone !== 'string' || data.timezone.length > 80) throw new Error('Múi giờ không hợp lệ.');
  try { localClock(Date.now(), data.timezone); } catch { throw new Error('Múi giờ không hợp lệ.'); }
  const quiet = data.quietHours as NotificationPreferences['quietHours'];
  if (!quiet || typeof quiet.enabled !== 'boolean' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(quiet.start)
    || !/^([01]\d|2[0-3]):[0-5]\d$/.test(quiet.end) || quiet.start === quiet.end) throw new Error('Giờ yên lặng không hợp lệ.');
  return { ...result, reminderHour: Number(data.reminderHour), maxPushPerDay: Number(data.maxPushPerDay),
    timezone: data.timezone, quietHours: { enabled: quiet.enabled, start: quiet.start, end: quiet.end } };
}
export async function savePreferences(uid: string, prefs: NotificationPreferences) {
  const db = firebaseAdmin().db;
  await db.runTransaction(async tx => {
    tx.set(preferencesRef(uid), { ...prefs, updatedAt: Timestamp.now() });
    tx.set(notificationUser(uid), { nextEvaluationAt: prefs.enabled ? Date.now() : Number.MAX_SAFE_INTEGER }, { merge: true });
  });
}
export async function registerToken(uid: string, token: string, deviceName: string) {
  const db = firebaseAdmin().db, id = tokenId(token);
  const ownerRef = db.collection('_notificationTokenOwners').doc(id);
  const ref = notificationUser(uid).collection('tokens').doc(id);
  await db.runTransaction(async tx => {
    const [owner, existing, tokens] = await Promise.all([tx.get(ownerRef), tx.get(ref),
      tx.get(notificationUser(uid).collection('tokens').where('enabled', '==', true))]);
    if (!existing.exists && tokens.size >= 20) throw new Error('Tối đa 20 thiết bị; hãy tắt thiết bị cũ trước.');
    if (owner.exists && owner.data()?.uid !== uid) {
      tx.set(notificationUser(owner.data()!.uid).collection('tokens').doc(id), { enabled: false }, { merge: true });
    }
    tx.set(ownerRef, { uid });
    tx.set(ref, { token, platform: 'web', deviceName, enabled: true,
      createdAt: existing.data()?.createdAt || Timestamp.now(), lastUsedAt: Timestamp.now() });
  });
  return id;
}
const emptyHistory = (): NotificationHistory => ({ dateKey: '', reservedCount: 0, lastReservedAt: 0, dedupeKeys: [], milestoneHighWater: 0 });
export async function deliverForUser(uid: string, activeIds: Set<string>) {
  const { db, messaging } = firebaseAdmin();
  const root = notificationUser(uid);
  // Re-check account approval server-side even when no browser session exists.
  const user = await (await clerkClient()).users.getUser(uid);
  if (!getAccess(user.privateMetadata).approved) {
    await root.set({ nextEvaluationAt: Number.MAX_SAFE_INTEGER }, { merge: true });
    return 'access-revoked';
  }
  const now = Date.now();
  const stateRef = root.collection('delivery').doc('state');
  const reservation = await db.runTransaction(async tx => {
    const [pDoc, stateDoc, tokens] = await Promise.all([tx.get(preferencesRef(uid)), tx.get(stateRef),
      tx.get(root.collection('tokens').where('enabled', '==', true))]);
    const p = { ...defaultPreferences, ...pDoc.data() } as NotificationPreferences;
    const h = { ...emptyHistory(), ...stateDoc.data() } as NotificationHistory;
    // Practice writes participate in the same snapshot; concurrent completion retries this reservation.
    const stats = await notificationStats(uid, now, p.timezone, activeIds, tx);
    const result = evaluateUserNotifications({ userId: uid, userStats: stats, notificationPreferences: p, notificationHistory: h, currentTime: now });
    const usable = tokens.docs.filter(t => t.data().lastUsedAt?.toMillis() > now - 90 * 86400000);
    const c = result.candidate;
    const logRef = c ? root.collection('logs').doc(tokenId(c.dedupeKey)) : null;
    const log = logRef ? await tx.get(logRef) : null;
    tx.set(root, { nextEvaluationAt: p.enabled ? now + 15 * 60000 : Number.MAX_SAFE_INTEGER }, { merge: true });
    for (const stale of tokens.docs.filter(t => !usable.includes(t))) tx.update(stale.ref, { enabled: false, reason: 'stale' });
    if (!c || !logRef || log?.exists || !usable.length) return null;
    const dateKey = localClock(now, p.timezone).dateKey;
    tx.set(stateRef, { dateKey, reservedCount: h.dateKey === dateKey ? h.reservedCount + 1 : 1,
      lastReservedAt: now, dedupeKeys: [...(h.dateKey === dateKey ? h.dedupeKeys : []), c.dedupeKey],
      milestoneHighWater: c.milestone || h.milestoneHighWater });
    tx.create(logRef, { ...c, userId: uid, dateKey, status: 'reserved', createdAt: Timestamp.now(), read: false });
    return { candidate: c, id: logRef.id, tokens: usable.map(t => ({ id: t.id, token: String(t.data().token) })) };
  });
  if (!reservation) return 'skipped';
  const logRef = root.collection('logs').doc(reservation.id);
  // Cancellation re-check immediately before network send. A later preference change cannot recall an accepted push.
  if (!(await getPreferences(uid)).enabled) {
    await logRef.update({ status: 'skipped', reason: 'disabled-before-send' }); return 'skipped';
  }
  const { candidate: c } = reservation;
  try {
    const response = await messaging.sendEachForMulticast({ tokens: reservation.tokens.map(t => t.token),
      data: { type: c.type, title: c.title, body: c.body, url: c.url, notificationId: reservation.id, userId: uid },
      webpush: { headers: { TTL: '900', Urgency: 'normal' } } });
    const batch = db.batch();
    response.responses.forEach((r, i) => {
      if (r.error && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error.code)) {
        batch.set(root.collection('tokens').doc(reservation.tokens[i].id), { enabled: false, reason: r.error.code }, { merge: true });
      }
    });
    batch.update(logRef, { status: response.successCount ? 'sent' : 'failed', sentAt: Timestamp.now(),
      successCount: response.successCount, failureCount: response.failureCount,
      errors: response.responses.filter(r => r.error).map(r => r.error!.code) });
    await batch.commit();
    return response.successCount ? 'sent' : 'failed';
  } catch {
    await logRef.update({ status: 'unknown', reason: 'delivery-outcome-unknown-no-automatic-retry' });
    return 'unknown';
  }
}
export async function runNotificationBatch() {
  const due = await firebaseAdmin().db.collection('_notifications').where('nextEvaluationAt', '<=', Date.now()).orderBy('nextEvaluationAt').limit(25).get();
  if (due.empty) return { processed: 0, results: [] };
  const ids = await activeWfdIds(); // One catalogue query per batch, not per student.
  const results = [];
  for (const doc of due.docs) {
    try { results.push(await deliverForUser(doc.id, ids)); }
    catch {
      await doc.ref.set({ nextEvaluationAt: Date.now() + 3600000 }, { merge: true });
      results.push('error');
    }
  }
  return { processed: results.length, results };
}