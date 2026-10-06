import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAccess } from '../../../lib/serverAccess';
import { calendar, Challenge } from '../../../lib/wfd/rules';
import { challengeRef } from '../../../lib/wfd/service';
import { firebaseAdmin } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'POST'].includes(req.method || '')) { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
  try {
    const auth = await requireAccess(req, res, true);
    if (!auth) return;
    if (!auth.access.admin) return res.status(403).json({ error: 'Chỉ admin được cấu hình challenge.' });
    if (req.method === 'GET') {
      const docs = await challengeRef(calendar().week).parent.orderBy('week', 'desc').limit(20).get();
      return res.json({ challenges: docs.docs.map(doc => doc.data()) });
    }
    const b = req.body || {};
    const date = typeof b.week === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.week) ? new Date(`${b.week}T00:00:00+07:00`) : new Date(NaN);
    if (!Number.isFinite(date.getTime()) || calendar(date.getTime()).week !== b.week || b.week < calendar().week
      || typeof b.title !== 'string' || !b.title.trim() || b.title.length > 100
      || !['questions', 'xp', 'topic', 'accuracy', 'days', 'mastery'].includes(b.type)
      || !Number.isInteger(b.target) || b.target < 1 || b.target > 100000
      || !Number.isInteger(b.rewardXp) || b.rewardXp < 0 || b.rewardXp > 10000
      || typeof b.topic !== 'string' || b.topic.length > 100 || (b.type === 'topic' && !b.topic.trim())
      || !Number.isFinite(b.minimumAccuracy) || b.minimumAccuracy < 0 || b.minimumAccuracy > 100
      || typeof b.badgeTitle !== 'string' || b.badgeTitle.length > 100) return res.status(400).json({ error: 'Kiểm tra cấu hình và ngày thứ Hai của tuần hiện tại/tương lai.' });
    const challenge: Challenge = { title: b.title.trim(), week: b.week, type: b.type, target: b.target,
      rewardXp: b.rewardXp, topic: b.topic.trim(), minimumAccuracy: b.minimumAccuracy, badgeTitle: b.badgeTitle.trim() };
    const saved = await firebaseAdmin().db.runTransaction(async tx => {
      const ref = challengeRef(b.week);
      const existing = await tx.get(ref);
      if (existing.exists) return false; // Published rewards are immutable, including the current week.
      tx.create(ref, challenge);
      return true;
    });
    return saved ? res.json({ ok: true }) : res.status(409).json({ error: 'Tuần này đã có challenge. Không thay đổi challenge đã công bố.' });
  } catch (error) {
    console.error('WFD challenge:', error);
    return res.status(503).json({ error: 'Không thể tải/lưu challenge.' });
  }
}