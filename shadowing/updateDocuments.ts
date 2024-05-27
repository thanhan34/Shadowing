import { db } from "./firebase"; // Adjust the path as needed
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

const updateDocuments = async () => {
  const collectionRef = collection(db, "writefromdictation");
  const querySnapshot = await getDocs(collectionRef);

  querySnapshot.forEach(async (document) => {
    const docRef = doc(db, "writefromdictation", document.id);
    const data = document.data();
    
    if (data.occurrence === 0) {
      await updateDoc(docRef, { isHidden: true });
    } else {
      await updateDoc(docRef, { isHidden: false });
    }
  });
};

updateDocuments()
  .then(() => console.log("Documents updated"))
  .catch((error) => console.error("Error updating documents:", error));
