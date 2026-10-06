import { loadAudioData } from '../../lib/describe-image-shadowing';
import { requireAccess } from '../../lib/serverAccess';
export default async function handler(req,res) {
 try {
 if (!await requireAccess(req,res)) return;
 return res.json(loadAudioData());
 } catch { return res.status(500).json({error: 'Unable to load audio'}); }
}
