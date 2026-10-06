import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAccess } from '../../../lib/serverAccess';
import { firebaseAdmin } from '../../../lib/firebaseAdmin';
import { getAccess } from '../../../lib/access';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await requireAccess(req, res, true);
    if (!session) return;
    if (req.method === 'GET') {
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const result = await session.client.users.getUserList({ limit: 20, offset, orderBy: '-created_at' });
      return res.json({ canManageRoles: session.access.admin, total: result.totalCount, users: result.data.map(user => ({
        id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(' '),
        email: user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress || '',
        admin: user.privateMetadata.role === 'admin',
        support: user.privateMetadata.role === 'support',
        approved: getAccess(user.privateMetadata).approved,
      })) });
    }
    if (req.method !== 'POST') return res.status(405).end();
    // JSON-only mutations prevent cross-origin form submissions.
    if (!req.headers['content-type']?.startsWith('application/json')) return res.status(415).end();
    const { userId, approved, role } = req.body || {};
    if (role !== undefined) {
      if (!session.access.admin) return res.status(403).json({ error: 'Chỉ admin được thay đổi vai trò.' });
      if (typeof userId !== 'string' || !['student', 'support'].includes(role)) return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
      const target = await session.client.users.getUser(userId);
      if (getAccess(target.privateMetadata).admin || userId === session.user.id) return res.status(403).json({ error: 'Không thay đổi vai trò admin tại đây.' });
      const ref = firebaseAdmin().db.collection('_access').doc(userId);
      // Remove old data privileges first. An interrupted update remains denied.
      await ref.set({ approved: false, admin: false, support: false });
      await session.client.users.updateUserMetadata(userId, { privateMetadata: {
        role, approvalStatus: 'approved', reviewedBy: session.user.id, reviewedAt: new Date().toISOString(),
      } });
      await ref.set({ approved: true, admin: false, support: role === 'support' });
      return res.json({ success: true });
    }
    if (typeof userId !== 'string' || typeof approved !== 'boolean') return res.status(400).json({ error: 'Dữ liệu không hợp lệ.' });
    const target = await session.client.users.getUser(userId);
    if (getAccess(target.privateMetadata).staff) return res.status(400).json({ error: 'Không duyệt hoặc thu hồi tài khoản quản trị tại đây.' });
    const { db } = firebaseAdmin();
    const ref = db.collection('_access').doc(userId);
    // Deny data access first; failures remain closed rather than partially approved.
    await ref.set({ approved: false, admin: false, support: false });
    await session.client.users.updateUserMetadata(userId, { privateMetadata: {
      approvalStatus: approved ? 'approved' : 'revoked', reviewedBy: session.user.id, reviewedAt: new Date().toISOString(),
    } });
    if (approved) await ref.set({ approved: true, admin: false, support: false });
    return res.json({ success: true });
  } catch { return res.status(503).json({ error: 'Không thể cập nhật. Kiểm tra Clerk/Firebase rồi thử lại.' }); }
}