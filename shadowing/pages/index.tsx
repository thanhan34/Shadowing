import { Inter } from "next/font/google";
import ShadowingSentence from "@/components/ShadowingSentence";
import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, startAfter, limit  } from "firebase/firestore";
import { db } from "../firebase";
import Image from "next/image";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [arrayParagraph, setArrayParagraph] = useState<
    { id: string; text: string; url: string; name: string }[]
  >([]);
 


  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(
          query(collection(db, "shadowing"), orderBy("name"))
        );
        const paragraphData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          text: doc.get("text"),
          url: doc.get("url"),
          name: doc.get("name"),
        }));
        setArrayParagraph(paragraphData);
        if (paragraphData.length > 0) {
          

        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
    return () => {};
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(
          query(collection(db, "shadowing"), orderBy("name"))
        );
        const paragraphData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          text: doc.get("text"),
          url: doc.get("url"),
          name: doc.get("name"),
        }));

        // Filter data based on the search query
        const filteredData = paragraphData.filter((data) =>
          data.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setArrayParagraph(filteredData);

        // ... rest of your code
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
    return () => {};
  }, [searchQuery]); // Add searchQuery as a dependency
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchQuery = e.target.value;
    setSearchQuery(newSearchQuery);
  };
  return (
    <main
      className={
        "flex mx-auto min-h-screen flex-col items-center min-w-screen  p-24 space-y-5 w-full"
      }
    >
      <Link href="/" className="flex justify-center">
        <Image
          src="/logo1.png"
          alt="Logo"
          width={300} // Set the desired width
          height={200} // Set the desired height
        />
      </Link>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-600 dark:text-white">
        Read Aloud Shadowing
      </h1>
      <input
        type="text"
        placeholder="Search..."
        onChange={handleSearchInputChange}
        value={searchQuery}
        className="w-48 px-4 py-2 border rounded-lg outline-none focus:border-blue-500"
      />
      
      {arrayParagraph.map((data) => (
        <Link
          href={`/shadowing/${data.name}`}
          key={data.id}
          className="block w-full p-6 bg-white border border-gray-200 rounded-lg shadow min-w-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-600 dark:text-white">
            {data.name}
          </h5>
        </Link>
      ))}

      {/* <ShadowingSentence /> */}
    </main>
  );
}
