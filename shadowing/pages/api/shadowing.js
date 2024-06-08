// pages/api/shadowing.js
import { collection, getDocs, query, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "../../firebase";

export default async function handler(req, res) {
  const { page } = req.query;
  const itemsPerPage = 10;
  const offset = (page - 1) * itemsPerPage;
  
  try {
    let ref = query(collection(db, "shadowing"), orderBy("name"), limit(itemsPerPage));
    
    // Add pagination logic
    if (offset > 0) {
      const lastVisibleDoc = await getDocs(
        query(collection(db, "shadowing"), orderBy("name"), limit(offset))
      );
      const lastVisible = lastVisibleDoc.docs[lastVisibleDoc.docs.length - 1];
      ref = query(collection(db, "shadowing"), orderBy("name"), startAfter(lastVisible), limit(itemsPerPage));
    }
    
    const querySnapshot = await getDocs(ref);
    const paragraphData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      text: doc.get("text"),
      url: doc.get("url"),
      name: doc.get("name"),
    }));

    res.status(200).json(paragraphData);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
}