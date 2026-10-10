import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAccess } from '../../../lib/serverAccess';
import { firebaseAdmin } from '../../../lib/firebaseAdmin';
import { adminMasteryStats } from '../../../lib/wfd/adminMastery';
import type { MasteryQuestion } from '../../../lib/wfd/mastery';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await requireAccess(req, res, true);
    if (!session) return;
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
    const { userId, offset = '0', query = '' } = req.query;
    if (typeof offset !== 'string' || !/^\d+$/.test(offset) || !Number.isSafeInteger(Number(offset)) ||
      typeof query !== 'string' || query.length > 200 ||
      (userId !== undefined && (typeof userId !== 'string' || !/^[\w-]{1,150}$/.test(userId)))) {
      return res.status(400).json({ error: 'Tham số không hợp lệ.' });
    }
    const result = userId ? null : await session.client.users.getUserList({ limit: 20, offset: Number(offset), orderBy: '-created_at', ...(query.trim() ? { query: query.trim() } : {}) });
    const users = userId ? [await session.client.users.getUser(userId)] : result!.data;
    const db = firebaseAdmin().db;
    const active = await db.collection('writefromdictation').where('isHidden', '==', false).select('text').get();
    const ids = new Set(active.docs.map(doc => doc.id));
    const now = Date.now();
    const rows = await Promise.all(users.map(async user => {
      const doc = await db.collection('_wfd').doc('users').collection('profiles').doc(user.id).collection('mastery').doc('summary').get();
      const questions = (doc.data()?.questions || {}) as Record<string, MasteryQuestion>;
      return { questions, student: {
        id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Học viên',
        email: user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress || '',
        role: user.privateMetadata.role === 'admin' ? 'Quản trị viên' : user.privateMetadata.role === 'support' ? 'Hỗ trợ admin' : 'Học viên',
        stats: adminMasteryStats(questions, ids, now),
      } };
    }));
    if (userId) return res.json({ student: rows[0].student, now,
      questions: active.docs.map(doc => ({ id: doc.id, text: String(doc.data().text || ''), progress: rows[0].questions[doc.id] || null })),
    });
    return res.json({ users: rows.map(row => row.student), total: result!.totalCount, now });
  } catch (error) {
    if ((error as { status?: number }).status === 404) return res.status(404).json({ error: 'Không tìm thấy học viên.' });
    return res.status(503).json({ error: 'Không thể tải mastery. Vui lòng thử lại.' });
  }
}