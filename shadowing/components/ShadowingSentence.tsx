import React, { useState, useEffect } from "react";
import Paragraph from "./Paragraph";
import Sentence from "./Sentence";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { ShadowingData } from "@/pages/shadowing/[name]";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";

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
      console.log("No sentences available for this paragraph.");
      return;
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
    const selectedValue = event.target.value;
    setShadowingDocumentID(selectedValue);
    setMode(true);
  };

  useEffect(() => {
    const selectedParagraphData = arrayParagraph.find(
      (data) => data.id === shadowingDocumentID
    );

    if (selectedParagraphData) {
      setSentence(selectedParagraphData.text);
      setVideoSource(selectedParagraphData.url);
    }
  }, [shadowingDocumentID]);

  return (
    <div className="z-10 items-center justify-between w-full max-w-5xl font-mono px-4 md:px-6 lg:px-8 py-4">
      <Head>
        <title>{shadowingData[0].name} - Shadowing</title>
        <meta
          name="description"
          content="Sử dụng bộ công cụ luyện tập PTE hiệu quả nhất, với các bài tập đa dạng, tài liệu cập nhật và lộ trình cá nhân hóa. Nâng cao kỹ năng nghe, nói, đọc, viết và đạt điểm số mơ ước với PTE Intensive."
        />
        <meta
          name="keywords"
          content="bộ công cụ PTE, luyện tập PTE, công cụ PTE, luyện thi PTE, bài tập PTE, tài liệu PTE, luyện PTE hiệu quả, nâng cao kỹ năng PTE, thi PTE đạt điểm cao"
        />
        <meta name="author" content="PTE Intensive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="flex justify-center mb-4">
        <Link href="/shadow">
          <Image
            src="/logo1.png"
            alt="Logo"
            width={150} // Set smaller width for mobile
            height={150} // Set smaller height for mobile
            className="w-24 h-24 md:w-36 md:h-36 lg:w-48 lg:h-48" // Responsive classes
          />
        </Link>
      </div>

      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-4">
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
        <div className="flex flex-col md:flex-row mt-4 space-y-2 md:space-y-0 md:space-x-4">
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
            className="px-4 py-2 font-bold text-white bg-blue-500  rounded-full flex items-center justify-center hover:bg-blue-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            Practice
          </a>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row mt-4 space-y-2 md:space-y-0 md:space-x-4">
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
          <button className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full" disabled>
            {count + 1}/{arraySen.length}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShadowingSentence;
