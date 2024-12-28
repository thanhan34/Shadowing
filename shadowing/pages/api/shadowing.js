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

    // Print all shadowing page URLs
    console.log('All Shadowing Page URLs:');
    paragraphData.forEach(item => {
      console.log(`http://localhost:3000/shadowing/${encodeURIComponent(item.name)}`);
    });
    res.status(200).json(paragraphData);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
}
