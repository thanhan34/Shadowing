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
        {downloadLinks.map((link,index) => (
          <p key={index}>{link.name},{link.url}</p>
          
        ))}
      </ul>
    </main>
  );
};

export default Paragraph;
