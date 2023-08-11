import React, { useEffect } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

const Paragraph = () => {
  const data = [
    { name: "Name1", url: "URL1", text: "Text1" },
    { name: "Name2", url: "URL2", text: "Text2" },
    // ... add more objects as needed
  ];

  const handleSubmit = async () => {
    try {
      for (const item of data) {
        const { name, url, text } = item;
        if (name && url && text) {
          await addDoc(collection(db, "shadowing"), {
            name: name,
            url: url,
            text: text,
          });
          console.log("Document written to Firebase");
        } else {
          console.log("Incomplete data, skipping...");
        }
      }
    } catch (e) {
      console.error("Error adding to Firebase", e);
    }
  };

  useEffect(() => {
    // Automatically trigger handleSubmit when the component mounts
    handleSubmit();
  }, []);

  return (
    <main className="flex flex-col items-center justify-between min-h-screen p-24">
      {/* Your JSX content if needed */}
      <h1>Hello</h1>
    </main>
  );
};

export default Paragraph;
