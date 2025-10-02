import React, { useState, useEffect } from "react";
import RetellParagraph from "./RetellParagraph";
import RetellSentence from "./RetellSentence";
import { DescribeImageData } from "@/pages/describe-image-shadowing/[name]";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";

interface Props {
  describeImageData: DescribeImageData;
}

const DescribeImageShadowingComponent: React.FC<Props> = ({ describeImageData }) => {
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
    if (count + 1 < describeImageData.sentences.length) {
      setCount(count + 1);
    }
  };

  const handleVoiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(event.target.value as 'brian' | 'joanna' | 'olivia');
  };

  return (
    <div className="z-10 items-center justify-between w-full max-w-6xl px-4 md:px-6 lg:px-8 py-6">
      <Head>
        <title>{describeImageData.name} - Describe Image Shadowing</title>
        <meta
          name="description"
          content="Luyện tập Describe Image với công cụ shadowing. Chọn giọng đọc và luyện tập từng câu hoặc cả đoạn."
        />
        <meta
          name="keywords"
          content="describe image, PTE, shadowing, luyện tập PTE, speaking PTE"
        />
        <meta name="author" content="PTE Intensive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="flex justify-center mb-4">
        <Link href="/describe-image-shadowing">
          <Image
            src="/logo1.png"
            alt="Logo"
            width={150}
            height={150}
            className="w-24 h-24 md:w-36 md:h-36 lg:w-48 lg:h-48"
          />
        </Link>
      </div>

      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 text-white drop-shadow-lg">
        Describe Image Shadowing
      </h1>

      {/* Voice Selector Card */}
      <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <label className="text-xl font-bold text-gray-800">Chọn giọng đọc:</label>
          <select
            value={selectedVoice}
            onChange={handleVoiceChange}
            className="px-6 py-3 text-xl font-bold border-3 border-[#fc5d01] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#fd7f33] bg-white text-gray-800 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          >
            <option value="brian">🎙️ Brian</option>
            <option value="joanna">🎙️ Joanna</option>
            <option value="olivia">🎙️ Olivia</option>
          </select>
        </div>
      </div>

      {mode ? (
        <RetellParagraph 
          sentences={describeImageData.sentences}
          fullText={describeImageData.fullText}
          selectedVoice={selectedVoice}
        />
      ) : (
        <RetellSentence
          sentence={describeImageData.sentences[count]}
          selectedVoice={selectedVoice}
        />
      )}

      {mode ? (
        <div className="flex flex-col md:flex-row justify-center mt-6 space-y-3 md:space-y-0 md:space-x-4">
          <button
            className="px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] rounded-2xl hover:shadow-2xl hover:scale-105 transform transition-all duration-200"
            onClick={handleModeChange}
          >
            🎯 1 Sentence Mode
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row justify-center mt-6 space-y-3 md:space-y-0 md:space-x-4">
          <button
            className="px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] rounded-2xl hover:shadow-2xl hover:scale-105 transform transition-all duration-200"
            onClick={handleModeChange}
          >
            📝 Paragraph Mode
          </button>
          <button
            className="px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] rounded-2xl hover:shadow-2xl hover:scale-105 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            onClick={handleBackClick}
            disabled={count === 0}
          >
            ⬅️ Back
          </button>
          <button
            className="px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] rounded-2xl hover:shadow-2xl hover:scale-105 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            onClick={handleNextClick}
            disabled={count + 1 >= describeImageData.sentences.length}
          >
            Next ➡️
          </button>
          <button className="px-8 py-4 text-lg font-bold text-white bg-gray-600 rounded-2xl cursor-default" disabled>
            {count + 1}/{describeImageData.sentences.length}
          </button>
        </div>
      )}
    </div>
  );
};

export default DescribeImageShadowingComponent;
