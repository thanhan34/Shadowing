import { clerkClient, getAuth } from '@clerk/nextjs/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAccess } from './access';

export async function requireAccess(req: NextApiRequest, res: NextApiResponse, staff = false) {
  res.setHeader('Cache-Control', 'no-store');
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: 'Bạn cần đăng nhập.' }); return null; }
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const access = getAccess(user.privateMetadata);
  if (!access.approved || (staff && !access.staff)) {
    res.status(403).json({ error: 'Bạn chưa có quyền truy cập.' }); return null;
  }
  return { client, user, access };
}