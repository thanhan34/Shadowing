import type { NextApiRequest, NextApiResponse } from 'next';
import { clerkClient, getAuth } from '@clerk/nextjs/server';
import { getAccess } from '../../lib/access';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).end();
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const user = await (await clerkClient()).users.getUser(userId);
    return res.json(getAccess(user.privateMetadata));
  } catch { return res.status(503).json({ error: 'Không thể kiểm tra quyền truy cập.' }); }
}