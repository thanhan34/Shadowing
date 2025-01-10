import { collection, getDocs, query, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "../../firebase";

export default async function handler(req, res) {
  try {
    // Fetch all shadowing documents
    const querySnapshot = await getDocs(query(collection(db, "shadowing"), orderBy("name")));
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
