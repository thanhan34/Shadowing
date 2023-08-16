import { Inter } from "next/font/google";
import ShadowingSentence from "@/components/ShadowingSentence";
import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import Link from "next/link";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
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
          // setShadowingDocumentID(paragraphData[0].id);
          // setSentence(paragraphData[0].text);
          // setVideoSource(paragraphData[0].url);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
    return () => {};
  }, []);
  return (
    <main
      className={`flex mx-auto min-h-screen flex-col items-center justify-between p-24 space-y-5`}
    >
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-600 dark:text-white">Read Aloud Shadowing</h1>
      {arrayParagraph.map((data) => (
        <Link href={`/shadowing/${data.name}`} key={data.id} className="block w-full max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-600 dark:text-white">{data.name}</h5>  
        </Link>
      ))}

      {/* <ShadowingSentence /> */}
    </main>
  );
}
