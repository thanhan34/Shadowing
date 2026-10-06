import type { NextApiRequest, NextApiResponse } from 'next';
import { Timestamp } from 'firebase-admin/firestore';
import { requireAccess } from '../../../lib/serverAccess';
import { getPreferences, notificationUser, registerToken, savePreferences, validatePreferences } from '../../../lib/notifications/service';
import { activeWfdIds, notificationStats } from '../../../lib/notifications/stats';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const action = String(req.query.action);
  if (!['settings', 'token', 'disable-device', 'ack', 'mastery', 'prompt'].includes(action)) return res.status(404).end();
  if (!['GET', 'POST'].includes(req.method || '') || (req.method === 'GET' && !['settings', 'mastery'].includes(action))) return res.status(405).end();
  // Same-origin browser mutations only; authorization is still mandatory below.
  if (req.method === 'POST' && req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).end();
  try {
    const auth = await requireAccess(req, res);
    if (!auth) return;
    const uid = auth.user.id, root = notificationUser(uid), body = req.body || {};
    if (action === 'settings' && req.method === 'GET') {
      const [preferences, logs, state] = await Promise.all([getPreferences(uid), root.collection('logs').orderBy('createdAt', 'desc').limit(30).get(), root.get()]);
      return res.json({ preferences, prompt: state.data()?.prompt || null,
        logs: logs.docs.map(d => ({ ...d.data(), id: d.id, createdAt: d.data().createdAt.toMillis() })) });
    }
    if (action === 'settings') {
      let preferences;
      try { preferences = validatePreferences(body); } catch (e) { return res.status(400).json({ error: (e as Error).message }); }
      await savePreferences(uid, preferences); return res.json({ preferences });
    }
    if (action === 'mastery') return res.json(await notificationStats(uid, Date.now(), 'Asia/Ho_Chi_Minh', await activeWfdIds()));
    if (action === 'token') {
      if (typeof body.token !== 'string' || body.token.length < 30 || body.token.length > 4096) return res.status(400).end();
      return res.json({ id: await registerToken(uid, body.token, String(body.deviceName || 'Web browser').slice(0, 100)) });
    }
    if (action === 'disable-device') {
      if (typeof body.id !== 'string' || !/^[a-f0-9]{64}$/.test(body.id)) return res.status(400).end();
      await root.collection('tokens').doc(body.id).set({ enabled: false }, { merge: true }); return res.json({ ok: true });
    }
    if (action === 'prompt') {
      if (!['prompted', 'later', 'granted', 'denied'].includes(body.choice)) return res.status(400).end();
      await root.set({ prompt: { choice: body.choice, at: Date.now() } }, { merge: true }); return res.json({ ok: true });
    }
    if (typeof body.id !== 'string' || !/^[a-f0-9]{64}$/.test(body.id) || !['clicked', 'read', 'dismissed', 'review_started'].includes(body.event)) return res.status(400).end();
    const log = root.collection('logs').doc(body.id);
    if (!(await log.get()).exists) return res.status(404).end();
    await log.update({ [body.event + 'At']: Timestamp.now(), ...(body.event === 'clicked' || body.event === 'read' ? { read: true } : {}) });
    return res.json({ ok: true });
  } catch (e) {
    console.error('WFD notifications API:', e instanceof Error ? e.name : 'error');
    return res.status(503).json({ error: 'Thông báo tạm thời không khả dụng. Vui lòng thử lại.' });
  }
}
export const config = { api: { bodyParser: { sizeLimit: '12kb' } } };