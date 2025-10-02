import React, { useState, useEffect } from "react";
import RetellParagraph from "./RetellParagraph";
import RetellSentence from "./RetellSentence";
import { RetellLectureData } from "@/pages/retell-lecture/[name]";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";

interface Props {
  retellData: RetellLectureData;
}

const RetellLectureShadowing: React.FC<Props> = ({ retellData }) => {
  const [mode, setMode] = useState(true); // true = paragraph mode, false = sentence mode
  const [count, setCount] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState<'brian' | 'joanna' | 'olivia'>('brian');

  const handleModeChange = () => {
    setMode(!mode);
    setCount(0);
  };

  const handleBackClick = () => {
    if (count > 0) {
      setCount(count - 1);
    }
  };

  const handleNextClick = () => {
    if (count + 1 < retellData.sentences.length) {
      setCount(count + 1);
    }
  };

  const handleVoiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(event.target.value as 'brian' | 'joanna' | 'olivia');
  };

  return (
    <div className="z-10 items-center justify-between w-full max-w-5xl font-mono px-4 md:px-6 lg:px-8 py-4">
      <Head>
        <title>{retellData.name} - Retell Lecture Shadowing</title>
        <meta
          name="description"
          content="Luyện tập Retell Lecture với công cụ shadowing. Chọn giọng đọc và luyện tập từng câu hoặc cả đoạn."
        />
        <meta
          name="keywords"
          content="retell lecture, PTE, shadowing, luyện tập PTE, speaking PTE"
        />
        <meta name="author" content="PTE Intensive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="flex justify-center mb-4">
        <Link href="/retell-lecture">
          <Image
            src="/logo1.png"
            alt="Logo"
            width={150}
            height={150}
            className="w-24 h-24 md:w-36 md:h-36 lg:w-48 lg:h-48"
          />
        </Link>
      </div>

      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-4">
        Retell Lecture Shadowing: {retellData.name}
      </h1>

      {/* Voice Selector */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
        <label className="text-lg font-semibold text-gray-700">Chọn giọng đọc:</label>
        <select
          value={selectedVoice}
          onChange={handleVoiceChange}
          className="px-4 py-2 text-lg font-medium border-2 border-[#fc5d01] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fd7f33] bg-white text-gray-700"
        >
          <option value="brian">Brian</option>
          <option value="joanna">Joanna</option>
          <option value="olivia">Olivia</option>
        </select>
      </div>

      {mode ? (
        <RetellParagraph 
          sentences={retellData.sentences}
          fullText={retellData.fullText}
          selectedVoice={selectedVoice}
        />
      ) : (
        <RetellSentence
          sentence={retellData.sentences[count]}
          selectedVoice={selectedVoice}
        />
      )}

      {mode ? (
        <div className="flex flex-col md:flex-row mt-4 space-y-2 md:space-y-0 md:space-x-4">
          <button
            className="px-4 py-2 font-bold text-white bg-[#fc5d01] rounded-full hover:bg-[#fd7f33]"
            onClick={handleModeChange}
          >
            1 Sentence Mode
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row mt-4 space-y-2 md:space-y-0 md:space-x-4">
          <button
            className="px-4 py-2 font-bold text-white bg-[#fc5d01] rounded-full hover:bg-[#fd7f33]"
            onClick={handleModeChange}
          >
            Paragraph Mode
          </button>
          <button
            className="px-4 py-2 font-bold text-white bg-[#fc5d01] rounded-full hover:bg-[#fd7f33]"
            onClick={handleBackClick}
            disabled={count === 0}
          >
            Back
          </button>
          <button
            className="px-4 py-2 font-bold text-white bg-[#fc5d01] rounded-full hover:bg-[#fd7f33]"
            onClick={handleNextClick}
            disabled={count + 1 >= retellData.sentences.length}
          >
            Next
          </button>
          <button className="px-4 py-2 font-bold text-white bg-[#fc5d01] rounded-full" disabled>
            {count + 1}/{retellData.sentences.length}
          </button>
        </div>
      )}
    </div>
  );
};

export default RetellLectureShadowing;
