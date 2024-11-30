import type { NextApiRequest, NextApiResponse } from 'next';
import { storage } from '../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Get the storage reference path from the URL
    const decodedUrl = decodeURIComponent(url);
    const storageRef = ref(storage, decodedUrl);
    
    // Get the actual download URL
    const downloadUrl = await getDownloadURL(storageRef);

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
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    // Stream the response
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch audio' });
  }
}
