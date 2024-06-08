import React, { useState, useEffect } from "react";
import Paragraph from "./Paragraph";
import Sentence from "./Sentence";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { ShadowingData } from "@/pages/shadowing/[name]";
import Image from "next/image";
import Link from "next/link";

interface Props {
  shadowingData: ShadowingData[];
}

const ShadowingSentence: React.FC<Props> = ({ shadowingData }) => {
  const [shadowingDocumentID, setShadowingDocumentID] = useState("");
  const [shadowingParagraphID, setShadowingParagraphID] = useState("");
  const [practice, setPractice] = useState("");
  const [arraySen, setArraySen] = useState<
    { id: string; text: string; url: string }[]
  >([]);
  const [arrayParagraph, setArrayParagraph] = useState<
    { id: string; text: string; url: string; name: string }[]
  >([]);
  const [mode, setMode] = useState(true);
  const [count, setCount] = useState(0);
  const [videoSource, setVideoSource] = useState("");
  const [sentence, setSentence] = useState("");
 

  useEffect(() => {
    setVideoSource(shadowingData[0].url);
    setSentence(shadowingData[0].text);
    setShadowingDocumentID(shadowingData[0].id);
    setPractice(shadowingData[0].practice);
  }, []);
 
  const handleModeChange = () => {
    if (arraySen.length === 0) {
      // You can display a message, show an alert, or take other actions here
      console.log("No sentences available for this paragraph.");
      return; // Exit the function early
    }
    setMode(!mode);
    setCount(0);
  };
  const handleBackClick = () => {
    if (count > 0) {
      setCount(count - 1);
    }
  };
  const handleNextClick = () => {
    if (arraySen.length > 0 && count + 1 < arraySen.length) {
      setCount(count + 1);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shadowingRef = collection(db, "shadowing");
        const sentenceRef = collection(
          shadowingRef,
          shadowingDocumentID,
          "sentence"
        );
        const q = query(sentenceRef, orderBy("timestamp"));
        const sentenceSnapshot = await getDocs(q);
        const data = sentenceSnapshot.docs.map((doc) => ({
          id: doc.id,
          text: doc.get("text"),
          url: doc.get("url"),
        }));
        setArraySen(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [shadowingDocumentID]);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Get the selected option value (shadowing document ID)
    const selectedValue = event.target.value;

    // Update the selected shadowing document ID state
    setShadowingDocumentID(selectedValue);
    setMode(true);
  };

  useEffect(() => {
    const selectedParagraphData = arrayParagraph.find(
      (data) => data.id === shadowingDocumentID
    );

    // Update the states with the text and video url from the matching object
    if (selectedParagraphData) {
      setSentence(selectedParagraphData.text);
      setVideoSource(selectedParagraphData.url);
    }
  }, [shadowingDocumentID]);

  return (
    <div className="z-10 items-center justify-between w-full max-w-5xl font-mono" >
      <Link href="/" className="flex justify-center">
        <Image
          src="/logo1.png"
          alt="Logo"
          width={300} // Set the desired width
          height={200} // Set the desired height
        />
      </Link>

      <h1 className="pt-2 mb-1 text-2xl font-bold lg:mb-0 lg:mr-4">
        Shadowing: {shadowingData[0].name}
      </h1>
      {mode ? (
        <Paragraph videoSource={videoSource} sentence={sentence} />
      ) : (
        <Sentence
          videoSource={arraySen[count].url}
          sentence={arraySen[count].text}
        />
      )}

      {mode ? (
        <div className="flex  mt-2 space-x-2 lg:flex-row">
          {arraySen.length === 0 && (
            <p className="text-red-500">
              Chức năng 1 Sentence Mode chưa thể sử dụng được cho câu này.
            </p>
          )}
          <button
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700"
            onClick={handleModeChange}
          >
            1 Sentence Mode
          </button>
          <a
            href={practice}
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700"
            target="_blank" // Opens the link in a new tab/window
            rel="noopener noreferrer" // Recommended for security reasons
          >
            Practice
          </a>
        </div>
      ) : (
        <div className="flex mt-2 space-x-2 lg:flex-row">
          <button
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700"
            onClick={handleModeChange}
          >
            Paragraph
          </button>
          <button
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700"
            onClick={handleBackClick}
          >
            Back
          </button>
          <button
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700"
            onClick={handleNextClick}
          >
            Next
          </button>
          <button className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full " disabled>{count +1}/{arraySen.length}</button>
        </div>
      )}
    </div>
  );
};

export default ShadowingSentence;
