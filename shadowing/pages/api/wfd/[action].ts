import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAccess } from '../../../lib/serverAccess';
import { GOALS } from '../../../lib/wfd/rules';
import { getDashboard, saveRankSnapshot, setGoal, startAttempt, submitAttempt, WfdError } from '../../../lib/wfd/service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const action = req.query.action;
    const method = action === 'dashboard' ? 'GET' : 'POST';
    if (!['dashboard', 'start', 'submit', 'goal', 'snapshot'].includes(String(action))) return res.status(404).json({ error: 'Not found' });
    if (req.method !== method) { res.setHeader('Allow', method); return res.status(405).end(); }
    const auth = await requireAccess(req, res);
    if (!auth) return;
    const uid = auth.user.id;
    const body = req.body || {};
    if (action === 'dashboard') return res.json(await getDashboard(uid));
    if (action === 'snapshot') return res.json(await saveRankSnapshot(uid));
    if (action === 'goal') {
      if (!GOALS.includes(body.goal)) throw new WfdError(400, 'Mục tiêu không hợp lệ.');
      await setGoal(uid, body.goal);
      return res.json({ ok: true });
    }
    if (action === 'start') {
      if (typeof body.questionId !== 'string' || !/^[^/]{1,150}$/.test(body.questionId)) throw new WfdError(400, 'Câu hỏi không hợp lệ.');
      return res.json(await startAttempt(uid, body.questionId));
    }
    if (typeof body.attemptId !== 'string' || !/^[a-f0-9-]{36}$/.test(body.attemptId)
      || typeof body.answer !== 'string' || body.answer.length > 2000) throw new WfdError(400, 'Đáp án không hợp lệ.');
    return res.json(await submitAttempt(uid, {
      name: [auth.user.firstName, auth.user.lastName].filter(Boolean).join(' ') || auth.user.username || 'Học viên',
      avatar: auth.user.imageUrl || '',
    }, body.attemptId, body.answer));
  } catch (error) {
    if (error instanceof WfdError) return res.status(error.status).json({ error: error.message });
    console.error('WFD gamification:', error);
    return res.status(503).json({ error: 'Gamification tạm thời không khả dụng. Bạn vẫn có thể luyện WFD.' });
  }
}
export const config = { api: { bodyParser: { sizeLimit: '8kb' } } };