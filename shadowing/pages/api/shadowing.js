import { firebaseAdmin } from '../../lib/firebaseAdmin';
import { requireAccess } from '../../lib/serverAccess';

export default async function handler(req, res) {
  try {
    if (!await requireAccess(req, res)) return;
    // Fetch all shadowing documents
    const querySnapshot = await firebaseAdmin().db.collection('shadowing').orderBy('name').get();
    const paragraphData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      text: doc.get("text"),
      url: doc.get("url"),
      name: doc.get("name"),
    }));

    res.status(200).json(paragraphData);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ 
      error: "Error fetching data",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}
