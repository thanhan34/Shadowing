// // import React, { useEffect } from "react";
// // import { addDoc, collection } from "firebase/firestore";
// // import { db } from "../firebase";

// // const Paragraph = () => {
// //   const data = [
// //     { name: "Name1", url: "URL1", text: "Text1" },
// //     { name: "Name2", url: "URL2", text: "Text2" },
// //     // ... add more objects as needed
// //   ];

// //   const handleSubmit = async () => {
// //     try {
// //       for (const item of data) {
// //         const { name, url, text } = item;
// //         if (name && url && text) {
// //           await addDoc(collection(db, "shadowing"), {
// //             name: name,
// //             url: url,
// //             text: text,
// //           });
// //           console.log("Document written to Firebase");
// //         } else {
// //           console.log("Incomplete data, skipping...");
// //         }
// //       }
// //     } catch (e) {
// //       console.error("Error adding to Firebase", e);
// //     }
// //   };

// //   useEffect(() => {
// //     // Automatically trigger handleSubmit when the component mounts
// //     handleSubmit();
// //   }, []);

// //   return (
// //     <main className="flex flex-col items-center justify-between min-h-screen p-24">
// //       {/* Your JSX content if needed */}
// //       <h1>Hello</h1>
// //     </main>
// //   );
// // };

// // export default Paragraph;
import React, { useEffect, useState } from "react";
import { getDownloadURL, ref, listAll } from "firebase/storage";
import { storage } from "../firebase"; // Make sure to import the storage instance correctly

const Paragraph = () => {
  const [downloadLinks, setDownloadLinks] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    const fetchDownloadLinks = async () => {
      try {
        const storageRef = ref(storage, "gs://pteshadowing.appspot.com"); // Update with your storage folder
        const files = await listAll(storageRef);

        const downloadPromises = files.items.map(async (file) => {
          const downloadURL = await getDownloadURL(file);
          return { name: file.name, url: downloadURL };
        });

        const links = await Promise.all(downloadPromises);
        setDownloadLinks(links);
      } catch (error) {
        console.error("Error fetching download links:", error);
      }
    };

    fetchDownloadLinks();
  }, []);

  return (
    <main className="flex flex-col items-center justify-between min-h-screen p-24">
      <h1>Download Links</h1>
      <ul>
        {downloadLinks.map((link) => (
          <p>{link.name},{link.url}</p>
          
        ))}
      </ul>
    </main>
  );
};

export default Paragraph;
