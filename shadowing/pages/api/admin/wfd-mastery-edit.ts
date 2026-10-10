import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAccess } from '../../../lib/serverAccess';
import { editMastery, MasteryEditError, validateMasteryEdit } from '../../../lib/wfd/editMastery';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await requireAccess(req, res, true);
    if (!session) return;
    if (!session.access.admin) return res.status(403).json({ error: 'Chỉ admin được chỉnh mastery.' });
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
    if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).end();
    if (!req.headers['content-type']?.startsWith('application/json')) return res.status(415).end();
    if (!validateMasteryEdit(req.body)) return res.status(400).json({ error: 'Bậc ôn, lịch ôn hoặc lý do không hợp lệ.' });
    await session.client.users.getUser(req.body.userId);
    const progress = await editMastery(req.body, session.user.id);
    return res.json({ progress });
  } catch (error) {
    if (error instanceof MasteryEditError) return res.status(error.status).json({ error: error.message });
    if ((error as { status?: number }).status === 404) return res.status(404).json({ error: 'Không tìm thấy học viên.' });
    return res.status(503).json({ error: 'Không thể lưu mastery. Vui lòng tải lại tiến độ trước khi thử lại.' });
  }
}
export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };