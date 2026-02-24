import React, { useEffect, useState } from "react";
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
  const [practice, setPractice] = useState("");
  const [arraySen, setArraySen] = useState<
    { id: string; text: string; url: string }[]
  >([]);
  const [mode, setMode] = useState(true);
  const [count, setCount] = useState(0);
  const [videoSource, setVideoSource] = useState("");
  const [sentence, setSentence] = useState("");
 
  useEffect(() => {
    if (!shadowingData.length) return;
    setVideoSource(shadowingData[0].url);
    setSentence(shadowingData[0].text);
    setShadowingDocumentID(shadowingData[0].id);
    setPractice(shadowingData[0].practice);
  }, [shadowingData]);
 
  const handleModeChange = () => {
    if (mode && arraySen.length === 0) {
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
      if (!shadowingDocumentID) return;

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

  useEffect(() => {
    const selectedParagraphData = shadowingData.find(
      (data) => data.id === shadowingDocumentID
    );

    if (selectedParagraphData) {
      setSentence(selectedParagraphData.text);
      setVideoSource(selectedParagraphData.url);
      setPractice(selectedParagraphData.practice);
    }
  }, [shadowingData, shadowingDocumentID]);

  if (!shadowingData.length) {
    return (
      <div className="glass w-full max-w-5xl rounded-card p-6 text-center">
        <p className="text-sm text-white/70 sm:text-base">Không tìm thấy dữ liệu shadowing cho bài này.</p>
      </div>
    );
  }

  const cleanedName = shadowingData[0].name?.replace(/<!--|-->/g, "") ?? "Shadowing";
  const activeSentence = arraySen[count];
 
  return (
    <div className="z-10 items-center justify-between w-full max-w-5xl font-mono px-4 md:px-6 lg:px-8 py-4">
      <Head>
        <title>{cleanedName} - Shadowing</title>
        <meta
          name="description"
          content="Công cụ Shadowing giúp bạn luyện tập hàng ngày nhằm cải thiện phát âm và phát triển thói quen đọc theo cụm từ. Sử dụng công cụ này để nâng cao kỹ năng nói và đạt được kết quả tối ưu với PTE Intensive."
        />
        <meta
          name="keywords"
          content="bộ công cụ PTE, luyện tập PTE, công cụ PTE, luyện thi PTE, bài tập PTE, tài liệu PTE, luyện PTE hiệu quả, nâng cao kỹ năng PTE, thi PTE đạt điểm cao"
        />
        <meta name="author" content="PTE Intensive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex justify-center">
        <Link href="/shadow" className="inline-flex rounded-full accent-ring">
          <Image
            src="/logo1.png"
            alt="Logo"
            width={150}
            height={150}
            className="w-24 h-24 md:w-36 md:h-36 lg:w-48 lg:h-48"
          />
        </Link>
      </div>

      <h1 className="mb-4 text-xl md:text-2xl lg:text-3xl font-bold text-center text-white">
        Shadowing: {cleanedName}
      </h1>

      {mode ? (
        <Paragraph videoSource={videoSource} sentence={sentence} />
      ) : activeSentence ? (
        <Sentence videoSource={activeSentence.url} sentence={activeSentence.text} />
      ) : (
        <p className="text-sm text-white/70">Không có câu để hiển thị.</p>
      )}

      {mode ? (
        <div className="mt-4 flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0">
          {arraySen.length === 0 && (
            <p className="text-red-500">
              Chức năng 1 Sentence Mode chưa thể sử dụng được cho câu này.
            </p>
          )}

          <button
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700"
            onClick={handleModeChange}
            disabled={arraySen.length === 0}
          >
            1 Sentence Mode
          </button>

          {practice && (
            <a
              href={practice}
              className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Practice
            </a>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0">
          <button
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700"
            onClick={handleModeChange}
          >
            Paragraph
          </button>
          <button
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700"
            onClick={handleBackClick}
            disabled={count === 0}
          >
            Back
          </button>
          <button
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700"
            onClick={handleNextClick}
            disabled={arraySen.length === 0 || count + 1 >= arraySen.length}
          >
            Next
          </button>
          <button className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full" disabled>
            {arraySen.length > 0 ? `${count + 1}/${arraySen.length}` : "0/0"}
          </button>
        </div>
      )}

    </div>
  );
};

export default ShadowingSentence;
