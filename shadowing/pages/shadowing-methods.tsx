import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getNextImage } from "../utils/background";
import Head from 'next/head';

// Method components
import BasicDictation from "../components/shadowing-methods/BasicDictation";
import GapFill from "../components/shadowing-methods/GapFill";
import ReorderMode from "../components/shadowing-methods/ReorderMode";
import TimedTyping from "../components/shadowing-methods/TimedTyping";
import PhrasesPractice from "../components/shadowing-methods/PhrasesPractice";
import RepeatAndType from "../components/shadowing-methods/RepeatAndType";

// Type definition for methods
interface Method {
  id: string;
  title: string;
  description: string;
  integration?: string;
}

const ShadowingMethods: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState("");
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");

  useEffect(() => {
    setBackgroundImage(getNextImage());
  }, []);

  const basicMethods: Method[] = [
    {
      id: "basic-dictation",
      title: "Nghe – Chép (Basic Dictation)",
      description: "Nghe audio → Gõ lại → So sánh đáp án.",
      integration: "Tích hợp phương pháp Chunking: Chia câu thành từng cụm để dễ nhớ."
    },
    {
      id: "gap-fill",
      title: "Điền từ còn thiếu (Gap-fill)",
      description: "Câu hiển thị với từ trống (_ _ _) → Điền từ vào ô trống.",
      integration: "Tích hợp phương pháp Reverse Dictation: Từng bước ẩn từ để học viên nhớ."
    },
    {
      id: "reorder-mode",
      title: "Sắp xếp từ (Reorder Mode)",
      description: "Các từ bị xáo trộn → Kéo thả để sắp xếp lại đúng thứ tự.",
      integration: "Tích hợp phương pháp Story Linking: Ghép các câu thành đoạn văn ngắn."
    },
    {
      id: "timed-typing",
      title: "Gõ theo thời gian (Timed Typing)",
      description: "Nghe câu → Gõ lại trong 10–15 giây → Đo tốc độ gõ.",
      integration: "Tích hợp phương pháp Dictation Loop: Lặp lại nhiều lần nếu sai."
    },
    {
      id: "phrase-practice",
      title: "Học theo cụm từ (Phrase Practice)",
      description: "Chia câu dài thành nhiều cụm nhỏ → Nghe từng cụm → Gõ lại.",
      integration: "Tích hợp phương pháp Chunking + Story Linking."
    },
    {
      id: "repeat-type",
      title: "Nghe – Nói – Gõ lại (Repeat + Type)",
      description: "Nghe câu → Nhắc lại → Gõ lại → Kiểm tra phát âm.",
      integration: "Tích hợp phương pháp Peer Teaching: Học viên ghi âm lại và tự kiểm tra."
    }
  ];

  const advancedMethods: Method[] = [
    {
      id: "chunking",
      title: "Chunking",
      description: "Chia nhỏ câu dài để dễ ghi nhớ."
    },
    {
      id: "story-linking",
      title: "Story Linking",
      description: "Ghép câu WFD thành đoạn văn để ghi nhớ bối cảnh."
    },
    {
      id: "dictation-loop",
      title: "Dictation Loop",
      description: "Nghe – gõ – lặp lại cho đến khi đúng."
    },
    {
      id: "reverse-dictation",
      title: "Reverse Dictation",
      description: "Chép ngược từ đáp án để nhớ cấu trúc."
    },
    {
      id: "peer-teaching",
      title: "Peer Teaching",
      description: "Học viên ghi âm và đối chiếu với giọng chuẩn."
    }
  ];

  const renderMethodComponent = () => {
    switch (activeMethod) {
      case "basic-dictation":
        return <BasicDictation />;
      case "gap-fill":
        return <GapFill />;
      case "reorder-mode":
        return <ReorderMode />;
      case "timed-typing":
        return <TimedTyping />;
      case "phrase-practice":
        return <PhrasesPractice />;
      case "repeat-type":
        return <RepeatAndType />;
      default:
        return null;
    }
  };

  return (
    <main
      className="bg-cover bg-center bg-fixed flex mx-auto min-h-screen flex-col items-center w-full p-4 sm:p-6 space-y-5 backdrop-blur-lg"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Head>
        <title>Phương Pháp Học Shadowing - PTE Intensive</title>
        <meta
          name="description"
          content="Khám phá 6 phương pháp học cơ bản và 5 phương pháp học chuyên sâu để nâng cao kỹ năng nghe, nói và phát âm tiếng Anh. Tối ưu hóa việc học với các phương pháp Shadowing hiệu quả."
        />
        <meta
          name="keywords"
          content="shadowing, phương pháp học tiếng Anh, dictation, gap-fill, reorder mode, timed typing, phrase practice, chunking, story linking, dictation loop, reverse dictation, peer teaching"
        />
        <meta name="author" content="PTE Intensive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>      <Link href="/" className="flex justify-center">
        <Image src="/logo1.png" alt="Logo" width={150} height={150} className="sm:w-40 sm:h-40 lg:w-48 lg:h-48" />
      </Link>
      <h1 className="mb-2 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-600 dark:text-white">
        PHƯƠNG PHÁP HỌC SHADOWING
      </h1>

      {/* Tab navigation */}
      <div className="flex w-full max-w-4xl mb-4 border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium text-lg ${
            activeTab === "basic"
              ? "text-[#fc5d01] border-b-2 border-[#fc5d01]"
              : "text-gray-500 hover:text-[#fd7f33]"
          }`}
          onClick={() => {
            setActiveTab("basic");
            setActiveMethod(null);
          }}
        >
          Phương Pháp Cơ Bản
        </button>
        <button
          className={`py-2 px-4 font-medium text-lg ${
            activeTab === "advanced"
              ? "text-[#fc5d01] border-b-2 border-[#fc5d01]"
              : "text-gray-500 hover:text-[#fd7f33]"
          }`}
          onClick={() => {
            setActiveTab("advanced");
            setActiveMethod(null);
          }}
        >
          Phương Pháp Chuyên Sâu
        </button>
      </div>

      {/* Method selection */}
      {!activeMethod && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
          {(activeTab === "basic" ? basicMethods : advancedMethods).map((method) => (
            <div
              key={method.id}
              className="p-4 bg-white bg-opacity-30 backdrop-blur-lg border border-gray-200 rounded-lg shadow-lg hover:bg-opacity-40 cursor-pointer transition-all duration-300 hover:shadow-xl"
              onClick={() => setActiveMethod(method.id)}
            >
              <h2 className="mb-2 text-lg font-bold text-[#fc5d01]">{method.title}</h2>
              <p className="text-gray-700">{method.description}</p>
              {method.integration && (
                <p className="mt-2 text-sm text-[#fd7f33] italic">{method.integration}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Active method component */}
      {activeMethod && (
        <div className="w-full max-w-4xl">
          <button
            className="mb-4 px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-300"
            onClick={() => setActiveMethod(null)}
          >
            ← Quay lại danh sách phương pháp
          </button>
          {renderMethodComponent()}
        </div>
      )}
    </main>
  );
};

export default ShadowingMethods;
