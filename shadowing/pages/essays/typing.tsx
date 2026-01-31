import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Navigation from "../../components/Navigation";
import ProgressBar from "../../components/essay-practice/ProgressBar";
import ResultScreen from "../../components/essay-practice/ResultScreen";
import TypingArea from "../../components/essay-practice/TypingArea";
import {
  essayTemplates,
  getPracticeModeLabel,
  getTemplateText,
  PracticeMode
} from "../../data/essayTemplates";
import { getNextImage } from "../../utils/background";

type ProgressState = {
  typedText: string;
  errorCount: number;
  startedAt: number | null;
};

const sectionLabels = [
  "Introduction",
  "Body Paragraph 1",
  "Body Paragraph 2",
  "Conclusion"
];

const EssayTypingPage: React.FC = () => {
  const router = useRouter();
  const { template, mode } = router.query;
  const [backgroundImage, setBackgroundImage] = useState("");
  const [typedText, setTypedText] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [completedSeconds, setCompletedSeconds] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [missingSeed, setMissingSeed] = useState(0);
  const [missingRatios, setMissingRatios] = useState<number[]>([]);

  useEffect(() => {
    setBackgroundImage(getNextImage());
  }, []);

  const templateId = typeof template === "string" ? template : null;
  const modeValue = typeof mode === "string" ? (mode as PracticeMode) : null;
  const selectedTemplate = essayTemplates.find(item => item.id === templateId) || null;
  const templateText = selectedTemplate ? getTemplateText(selectedTemplate) : "";

  useEffect(() => {
    if (!templateId || modeValue !== "missing" || !selectedTemplate) {
      setMissingSeed(0);
      setMissingRatios([]);
      return;
    }

    const nextSeed = Date.now();
    const nextRatios = selectedTemplate.paragraphs.map(paragraph => {
      if (!paragraph) return 0.4;
      return 0.3 + Math.random() * 0.2;
    });

    setMissingSeed(nextSeed);
    setMissingRatios(nextRatios);
  }, [templateId, modeValue, selectedTemplate]);

  const storageKey = useMemo(() => {
    if (!templateId || !modeValue) return null;
    return `pte-essay-progress:${templateId}:${modeValue}`;
  }, [templateId, modeValue]);

  const displayText = useMemo(() => {
    if (!selectedTemplate) return "";

    if (modeValue === "copy") {
      return templateText;
    }

    if (modeValue === "missing") {
      return selectedTemplate.paragraphs
        .map((paragraph, index) => {
          if (!paragraph) {
            return "";
          }
          const ratio = missingRatios[index] ?? 0.4;
          const splitIndex = Math.max(1, Math.floor(paragraph.length * ratio));
          const visible = paragraph.slice(0, splitIndex);
          const hiddenLength = paragraph.length - splitIndex;
          return `${visible}${" ".repeat(hiddenLength)}`;
        })
        .join("\n");
    }

    return "";
  }, [selectedTemplate, modeValue, templateText, missingSeed, missingRatios]);

  useEffect(() => {
    if (!templateId || !modeValue || !selectedTemplate) {
      return;
    }

    if (!storageKey) {
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ProgressState;
        setTypedText(parsed.typedText || "");
        setErrorCount(parsed.errorCount || 0);
        setStartedAt(parsed.startedAt || null);
      } catch (error) {
        console.error("Failed to parse localStorage progress", error);
      }
    }

    setIsLoaded(true);
  }, [templateId, modeValue, selectedTemplate, storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    if (!isLoaded) return;

    const nextState: ProgressState = {
      typedText,
      errorCount,
      startedAt
    };
    window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  }, [typedText, errorCount, startedAt, storageKey, isLoaded]);

  const completionPercentage = useMemo(() => {
    if (!templateText) return 0;
    return (typedText.length / templateText.length) * 100;
  }, [typedText, templateText]);

  const totalCharacters = templateText.length;
  const wpm = useMemo(() => {
    if (!completedSeconds) return 0;
    const minutes = completedSeconds / 60 || 1;
    return Math.round((typedText.length / 5) / minutes);
  }, [completedSeconds, typedText.length]);

  const handleProgressChange = useCallback((textValue: string, errors: number) => {
    setTypedText(textValue);
    setErrorCount(errors);
  }, []);

  const handleComplete = useCallback((durationSeconds: number) => {
    setCompletedSeconds(durationSeconds);
  }, []);

  const handleStartChange = useCallback((nextStartedAt: number | null) => {
    setStartedAt(nextStartedAt);
  }, []);

  const handleReset = () => {
    const confirmed = window.confirm("Bạn chắc chắn muốn reset tiến độ? Tất cả dữ liệu sẽ bị xoá.");
    if (!confirmed) return;

    setTypedText("");
    setErrorCount(0);
    setStartedAt(null);
    setCompletedSeconds(null);
    if (modeValue === "missing" && templateId && selectedTemplate) {
      const nextSeed = Date.now();
      const nextRatios = selectedTemplate.paragraphs.map(paragraph => {
        if (!paragraph) return 0.4;
        return 0.3 + Math.random() * 0.2;
      });
      setMissingSeed(nextSeed);
      setMissingRatios(nextRatios);
    }

    if (storageKey) {
      window.localStorage.removeItem(storageKey);
    }
  };

  if (!templateId || !modeValue || !selectedTemplate) {
    if (typeof window !== "undefined") {
      router.replace("/essays/practice");
    }
    return null;
  }

  return (
    <main className="min-h-screen w-full bg-white">
      <Head>
        <title>Essay Typing - PTE Intensive</title>
        <meta
          name="description"
          content="Strict typing practice for fixed PTE essay templates."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ProgressBar percentage={completionPercentage} />

      <div
        className="bg-cover bg-center bg-fixed min-h-screen"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <Navigation />

          <Link href="/" className="flex justify-center">
            <Image
              src="/logo1.png"
              alt="Logo"
              width={140}
              height={140}
              className="sm:w-36 sm:h-36 lg:w-40 lg:h-40"
            />
          </Link>

          <div className="rounded-xl bg-white bg-opacity-95 p-6 shadow-lg space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[#fc5d01]">Template</span>
              <h1 className="text-xl font-bold text-gray-800">
                {selectedTemplate.label} · {getPracticeModeLabel(modeValue)}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-gray-700">
              <span className="rounded-full bg-[#fedac2] px-3 py-1">Accuracy first</span>
              <span className="rounded-full bg-[#fedac2] px-3 py-1">No autocorrect</span>
              <span className="rounded-full bg-[#fedac2] px-3 py-1">Line-by-line</span>
            </div>
            <div className="rounded-lg border border-[#fedac2] bg-[#fedac2] px-3 py-2 text-sm text-gray-700">
              Lưu ý: Vui lòng dùng bàn phím tiếng Anh hoặc tắt Vietkey để tránh gõ sai ký tự.
            </div>
          </div>

          {completedSeconds !== null ? (
            <ResultScreen
              timeSeconds={completedSeconds}
              totalCharacters={totalCharacters}
              errorCount={errorCount}
              wpm={wpm}
              onReset={handleReset}
            />
          ) : (
            <div className="rounded-xl bg-white bg-opacity-95 p-6 shadow-lg space-y-4">
              <TypingArea
                mode={modeValue}
                templateText={templateText}
                displayText={displayText}
                sectionLabels={sectionLabels}
                persistedText={typedText}
                persistedErrors={errorCount}
                persistedStartedAt={startedAt}
                onProgressChange={handleProgressChange}
                onStartChange={handleStartChange}
                onComplete={handleComplete}
              />
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-lg border border-[#fc5d01] text-[#fc5d01] font-semibold py-3 hover:bg-[#fedac2] transition-colors"
              >
                Reset tiến độ
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default EssayTypingPage;