import React, { useEffect, useState } from "react";
import { getDownloadURL, ref, listAll } from "firebase/storage";
import { storage } from "../firebase"; // Make sure to import the storage instance correctly

const Paragraph = () => {
  const [downloadLinks, setDownloadLinks] = useState<{ name: string; url: string }[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<{ name: string; url: string}[]>([]);
  const [searchKeywords, setSearchKeywords] = useState<string>("");
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
console.log(downloadLinks)
useEffect(() => {
  // Filter download links based on the searchKeywords
  const filtered = downloadLinks.filter((link) =>
    link.name.toLowerCase().includes(searchKeywords.toLowerCase())
  );
  setFilteredLinks(filtered);
}, [searchKeywords, downloadLinks]);
  return (
    <main className="flex flex-col items-center justify-between min-h-screen p-24">
      <h1>Download Links</h1>
      <input
        type="text"
        placeholder="Search by keyword"
        value={searchKeywords}
        onChange={(e) => setSearchKeywords(e.target.value)}
      />
      {/* <button onClick={handleSearch}>Search</button> */}
      <ul>
        {filteredLinks.map((link, index) => (
          <div className="pt-5" key={index}>
            <p>{link.name}</p>
            <p className="text-xs">{link.url}</p>
            <button
              className="p-2 bg-red-500 rounded-lg"
              onClick={() => {
                navigator.clipboard.writeText(link.url);
              }}
            >
              Copy
            </button>
          </div>
        ))}
      </ul>
    </main>
  );
};

export default Paragraph;
