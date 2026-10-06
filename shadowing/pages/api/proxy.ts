import type { NextApiRequest, NextApiResponse } from 'next';
import { firebaseAdmin } from '../../lib/firebaseAdmin';
import { getStorage } from 'firebase-admin/storage';
import { requireAccess } from '../../lib/serverAccess';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    if (!await requireAccess(req, res)) return;
    // Get the storage reference path from the URL
    const bucket = getStorage(firebaseAdmin().auth.app).bucket('pteshadowing.appspot.com');
    let objectPath = url;
    if (url.startsWith('https://')) {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/^\/v0\/b\/pteshadowing\.appspot\.com\/o\/(.+)$/);
      if (parsed.hostname !== 'firebasestorage.googleapis.com' || !match) return res.status(400).end();
      objectPath = decodeURIComponent(match[1]);
    } else if (url.startsWith('gs://pteshadowing.appspot.com/')) {
      objectPath = url.slice('gs://pteshadowing.appspot.com/'.length);
    } else if (url.includes('://')) return res.status(400).end();
    
    // Get the actual download URL
    const [downloadUrl] = await bucket.file(objectPath).getSignedUrl({ action: 'read', expires: Date.now() + 60000 });

    // Fetch the audio file using the download URL
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Set headers for audio streaming
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'private, no-store');

    // Stream the response
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch audio' });
  }
}
