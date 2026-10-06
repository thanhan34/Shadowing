import type { NextApiRequest, NextApiResponse } from 'next';
import { timingSafeEqual } from 'node:crypto';
import { runNotificationBatch } from '../../../lib/notifications/service';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  const secret = process.env.WFD_NOTIFICATION_CRON_SECRET;
  const supplied = req.headers.authorization || '';
  const expected = `Bearer ${secret}`;
  if (!secret || secret.length < 32 || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return res.status(401).end();
  try { return res.json(await runNotificationBatch()); }
  catch { return res.status(503).json({ error: 'Notification batch unavailable' }); }
}