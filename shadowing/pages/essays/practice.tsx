import React, { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import TemplateSelector from "../../components/essay-practice/TemplateSelector";
import ModeSelector from "../../components/essay-practice/ModeSelector";
import { essayTemplates, PracticeMode, getPracticeModeLabel } from "../../data/essayTemplates";
import { getNextImage } from "../../utils/background";

const EssayPracticePage: React.FC = () => {
  const router = useRouter();
  const [backgroundImage, setBackgroundImage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);

  useEffect(() => {
    setBackgroundImage(getNextImage());
  }, []);

  const handleStart = () => {
    if (!selectedTemplateId || !selectedMode) {
      return;
    }

    router.push({
      pathname: "/essays/typing",
      query: {
        template: selectedTemplateId,
        mode: selectedMode
      }
    });
  };

  return (
    <main
      className="bg-cover bg-center bg-fixed flex mx-auto min-h-screen flex-col items-center w-full p-4 sm:p-6 space-y-6"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Head>
        <title>Essay Practice - PTE Intensive</title>
        <meta
          name="description"
          content="Practice fixed PTE essay templates with strict typing validation."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>      <Link href="/" className="flex justify-center">
        <Image
          src="/logo1.png"
          alt="Logo"
          width={150}
          height={150}
          className="sm:w-40 sm:h-40 lg:w-48 lg:h-48"
        />
      </Link>

      <div className="w-full max-w-5xl space-y-6 rounded-xl bg-white bg-opacity-90 p-6 shadow-lg">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#fc5d01]">Essay Practice</h1>
          <p className="text-sm text-gray-700">
            Chọn dạng template và chế độ luyện tập. Bạn phải gõ chính xác từng ký tự.
          </p>
        </div>

        <TemplateSelector
          templates={essayTemplates}
          selectedId={selectedTemplateId}
          onSelect={setSelectedTemplateId}
        />

        <ModeSelector selectedMode={selectedMode} onSelect={setSelectedMode} />

        <div className="flex flex-col gap-2 rounded-lg border border-[#fedac2] bg-[#fedac2] p-4 text-sm text-gray-700">
          <p>
            <span className="font-semibold text-[#fc5d01]">Template:</span>{" "}
            {selectedTemplateId
              ? essayTemplates.find(item => item.id === selectedTemplateId)?.label
              : "Chưa chọn"}
          </p>
          <p>
            <span className="font-semibold text-[#fc5d01]">Mode:</span>{" "}
            {selectedMode ? getPracticeModeLabel(selectedMode) : "Chưa chọn"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={!selectedTemplateId || !selectedMode}
          className="w-full rounded-lg bg-[#fc5d01] py-3 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#fd7f33] transition-colors"
        >
          Bắt đầu luyện tập
        </button>
      </div>
    </main>
  );
};

export default EssayPracticePage;