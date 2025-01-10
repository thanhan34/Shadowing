import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";
import { CustomAudioRef } from "@/types";
import { db } from "../firebase";
import { collection, getDocs, CollectionReference, query, where, Query, DocumentData, Timestamp } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import { getNextImage } from "../utils/background";
import { parse } from 'json2csv';
import Head from "next/head";

interface AudioSample {
  audio: { [key: string]: string };
  text: string;
  occurrence: number;
  createdAt: Timestamp;
  isHidden: boolean;
  questionType: string;
}

const WriteFromDictation: React.FC = () => {
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const audioRef = useRef<CustomAudioRef>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [inputText, setInputText] = useState("");
  const [numberOfIncorrect, setNumberOfIncorrect] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState<string>("Brian");
  const [sortingOption, setSortingOption] = useState<string>("occurrence");
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [alwaysShowAnswer, setAlwaysShowAnswer] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [filterOption, setFilterOption] = useState<string>("All");

  useEffect(() => {
    setBackgroundImage(getNextImage());
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const collectionRef: CollectionReference<DocumentData> = collection(db, "writefromdictation");
        const q: Query<DocumentData> = query(collectionRef, where("isHidden", "==", false));

        const querySnapshot = await getDocs(q);
        const data: AudioSample[] = querySnapshot.docs.map((doc) => doc.data() as AudioSample);

        setAudioSamples(data);
        setCurrentIndex(0); // Reset the currentIndex to 0
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAudioSamples = useMemo(() => {
    switch (filterOption) {
      case "New":
        return audioSamples.filter(sample => sample.questionType === "New");
      case "Still Important":
        return audioSamples.filter(sample => sample.questionType === "Still Important");
      default:
        return audioSamples; // Show all items when filterOption is "All"
    }
  }, [audioSamples, filterOption]);

  const sortedAudioSamples = useMemo(() => {
    return [...filteredAudioSamples].sort((a, b) => {
      switch (sortingOption) {
        case "alphabetical":
          return a.text.localeCompare(b.text);
        case "occurrence":
          return b.occurrence - a.occurrence;
        case "newest":
          return b.createdAt.seconds - a.createdAt.seconds;
        case "easyToDifficult":
          return a.text.length - b.text.length;
        default:
          return b.occurrence - a.occurrence;
      }
    });
  }, [filteredAudioSamples, sortingOption]);

  const handleNext = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.stop();
    }
    setInputText("");
    setCurrentIndex((prevIndex) => (prevIndex + 1) % sortedAudioSamples.length);
    setShowAnswer(alwaysShowAnswer);
  }, [sortedAudioSamples.length, alwaysShowAnswer, audioRef]);

  const handlePlayAll = useCallback(() => {
    setIsAutoplay((prev) => !prev);
    if (!isAutoplay) {
      handleNext();
    }
  }, [isAutoplay, handleNext]);

  const handleAudioEnd = useCallback(() => {
    if (isAutoplay) {
      handleNext();
    }
  }, [isAutoplay, handleNext]);

  useEffect(() => {
    if (sortedAudioSamples.length > 0 && audioRef.current) {
      audioRef.current.play();
    }
  }, [sortedAudioSamples, currentIndex, audioRef]);

  const handleSelectChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newIndex = parseInt(event.target.value, 10);
    if (audioRef.current) {
      await audioRef.current.stop();
    }
    setCurrentIndex(newIndex);
    if (audioRef.current) {
      await audioRef.current.play();
    }
    setShowAnswer(alwaysShowAnswer);
    setInputText("");
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAlwaysShowAnswer(event.target.checked);
    setShowAnswer(event.target.checked);
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
  };

  const handleVoiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(event.target.value);
  };

  const handleSortingChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortingOption(event.target.value);
  };

  const handlePlaybackRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
  };

  const countIncorrect = () => {
    if (sortedAudioSamples.length === 0) return;

    const correctText = sortedAudioSamples[currentIndex]?.text.trim();
    const inputTextTrimmed = inputText.trim();

    const correctWords = correctText.split(/\s+/);
    const inputWords = inputTextTrimmed.split(/\s+/);

    let incorrectCount = 0;
    const wordCount = (words: string[]) =>
      words.reduce((count, word) => {
        count[word] = (count[word] || 0) + 1;
        return count;
      }, {} as Record<string, number>);

    const correctWordCounts = wordCount(correctWords);
    const inputWordCounts = wordCount(inputWords);

    Object.keys(correctWordCounts).forEach((word) => {
      if (!inputWordCounts[word] || inputWordCounts[word] < correctWordCounts[word]) {
        incorrectCount += correctWordCounts[word] - (inputWordCounts[word] || 0);
      }
    });

    setNumberOfIncorrect(incorrectCount);
  };

  const handleAnswerButtonClick = () => {
    setShowAnswer(true);
    countIncorrect();
  };

  const handlePlay = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.play();
    }
  }, [audioRef]);

  const handleRepeat = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.stop();
      setInputText("");
      await audioRef.current.play();
    }
  }, [audioRef]);

  const handleExportCSV = useCallback(() => {
    if (sortedAudioSamples.length === 0) return;

    const fields = ['text', 'occurrence', 'questionType'];
    const opts = { fields };

    try {
      const csv = parse(sortedAudioSamples, opts);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'audio_samples.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
  }, [sortedAudioSamples]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="bg-cover bg-center flex mx-auto min-h-screen flex-col items-center min-w-screen p-6 space-y-5 w-full backdrop-blur-lg" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <Head>
        <title>Write From Dictation - PTE Intensive</title>
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
      <Navigation />
      <Link href="/" className="flex justify-center mb-4">
        <Image src="/logo1.png" alt="Logo" width={200} height={200} />
      </Link>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
        Write From Dictation
      </h1>
      <div className="w-full max-w-2xl mx-auto">
        {sortedAudioSamples.length > 0 && (
          <AudioPlayer
            ref={audioRef}
            occurrence={sortedAudioSamples[currentIndex]?.occurrence}
            questionType={sortedAudioSamples[currentIndex]?.questionType}
            audio={sortedAudioSamples[currentIndex]?.audio[selectedVoice]}
            text={sortedAudioSamples[currentIndex]?.text}
            onEnded={handleAudioEnd}
            showAnswer={showAnswer}
            playbackRate={playbackRate}
            onPlaybackRateChange={handlePlaybackRateChange}
          />
        )}
        <div className="mt-4 w-full">
          <textarea
            id="txtInput"
            rows={5}
            className="w-full p-4 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            value={inputText}
            onChange={handleTextareaChange}
          ></textarea>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 mt-4">
          <div className="mb-4 md:mb-0 md:mr-4 w-full">
            <label htmlFor="audio-select" className="block mb-1 font-medium text-gray-700">
              Select Audio:
            </label>
            <select
              id="audio-select"
              value={currentIndex}
              onChange={handleSelectChange}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              disabled={sortedAudioSamples.length === 0}
            >
              {sortedAudioSamples.map((sample, index) => (
                <option key={index} value={index}>
                  Audio {index + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4 md:mb-0 md:mr-4 w-full">
            <label htmlFor="voice-select" className="block mb-1 font-medium text-gray-700">
              Select Voice:
            </label>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={handleVoiceChange}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              {sortedAudioSamples.length > 0 &&
                Object.keys(sortedAudioSamples[currentIndex]?.audio).map((voice, index) => (
                  <option key={index} value={voice}>
                    {voice}
                  </option>
                ))}
            </select>
          </div>
          <div className="mb-4 md:mb-0 md:mr-4 w-full">
            <label htmlFor="sorting-select" className="block mb-1 font-medium text-gray-700">
              Sort By:
            </label>
            <select
              id="sorting-select"
              value={sortingOption}
              onChange={handleSortingChange}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="occurrence">Occurrence (Highest to Lowest)</option>
              <option value="newest">Newest</option>
              <option value="easyToDifficult">Easy to Difficult (Shortest to Longest Text)</option>
            </select>
          </div>
          <div className="mb-4 md:mb-0 md:mr-4 w-full">
            <label htmlFor="filter-select" className="block mb-1 font-medium text-gray-700">
              Filter:
            </label>
            <select
              id="filter-select"
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="All">All</option>
              <option value="New">New</option>
              <option value="Still Important">Still Important</option>
            </select>
          </div>
        </div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="showAnswer"
            checked={alwaysShowAnswer}
            onChange={handleCheckboxChange}
            className="mr-2"
          />
          <label htmlFor="showAnswer" className="text-white">
            Always show answer
          </label>
        </div>
        <p className="mt-4 text-white">Incorrect: {numberOfIncorrect}</p>
        <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-2">
          <button
            className="px-4 py-2 w-full md:w-auto bg-purple-500 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-purple-400/50 shadow-xl"
            onClick={handlePlay}
          >
            Play
          </button>
          <button
            className="px-4 py-2 w-full md:w-auto bg-yellow-500 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-yellow-400/50 shadow-xl"
            onClick={handleRepeat}
          >
            Repeat
          </button>
          <button
            className="px-4 py-2 w-full md:w-auto bg-blue-500 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-blue-400/50 shadow-xl"
            onClick={handleNext}
            disabled={sortedAudioSamples.length === 0}
          >
            Next
          </button>
          <button
            className="px-4 py-2 w-full md:w-auto bg-green-500 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-green-400/50 shadow-xl"
            onClick={handlePlayAll}
          >
            {isAutoplay ? "Stop" : "Play All"}
          </button>
          <button
            className="px-4 py-2 w-full md:w-auto bg-red-500 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-red-400/50 shadow-xl"
            onClick={handleAnswerButtonClick}
          >
            Answer
          </button>
          <button
            className="px-4 py-2 w-full md:w-auto bg-orange-500 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-orange-400/50 shadow-xl"
            onClick={handleExportCSV}
          >
            Export CSV
          </button>
        </div>
      </div>
    </main>
  );
};

export default WriteFromDictation;
