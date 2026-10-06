import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAccess } from '../../lib/serverAccess';
import { firebaseAdmin } from '../../lib/firebaseAdmin';
import { firebaseCredentialPresence, firebaseDiagnostic } from '../../lib/firebaseDiagnostics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  let stage = 'CLERK_ACCESS';
  try {
    const session = await requireAccess(req, res);
    if (!session) return;
    stage = 'FIREBASE_INIT';
    const { auth, db } = firebaseAdmin();
    stage = 'FIRESTORE_ACCESS';
    const ref = db.collection('_access').doc(session.user.id);
    const record = await ref.get();
    const access = record.data();
    // Synchronize staff data permissions with the current server-authorized role.
    if (session.access.staff && (!access?.approved || access?.admin !== session.access.admin || access?.support !== session.access.support)) {
      stage = 'FIRESTORE_PROVISION';
      await ref.set({ approved: true, admin: session.access.admin, support: session.access.support });
    } else if (!access?.approved) {
      return res.status(403).json({ error: 'Quyền dữ liệu chưa được cấp. Liên hệ admin.' });
    } else if (!session.access.staff && (access?.admin || access?.support)) {
      stage = 'FIRESTORE_PROVISION';
      await ref.set({ approved: true, admin: false, support: false });
    }
    stage = 'FIREBASE_TOKEN';
    const token = await auth.createCustomToken(session.user.id);
    return res.json({ token });
  } catch (error) {
    // Never log raw SDK errors: they can contain request headers or credentials.
    console.error('[firebase-token]', { stage, ...firebaseDiagnostic(error), ...firebaseCredentialPresence() });
    const messages: Record<string, string> = {
      CLERK_ACCESS: 'Không thể xác minh phiên Clerk. Thử đăng xuất rồi đăng nhập lại.',
      FIREBASE_INIT: 'Không thể khởi tạo Firebase Admin. Kiểm tra credentials phía server.',
      FIRESTORE_PROVISION: 'Không thể ghi quyền admin vào Firestore.',
      FIRESTORE_ACCESS: 'Không thể đọc quyền truy cập từ Firestore.',
      FIREBASE_TOKEN: 'Không thể ký token đăng nhập Firebase.',
    };
    return res.status(503).json({ error: `${messages[stage]} Mã chẩn đoán: ${stage}.`, diagnostic: stage });
  }
}