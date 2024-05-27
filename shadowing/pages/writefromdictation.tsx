import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";
import { CustomAudioRef } from "@/types";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  CollectionReference,
  query,
  where,
  Query,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import Navigation from "@/components/Navigation";

interface AudioSample {
  audio: { [key: string]: string };
  text: string;
  occurrence: number;
  createdAt: Timestamp;
  isHidden: boolean;
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
  const [playbackRate, setPlaybackRate] = useState<number>(1); // Initialize playback rate to 1
  const [loading, setLoading] = useState(true);
  const [alwaysShowAnswer, setAlwaysShowAnswer] = useState(false); // Track the state of the checkbox

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const collectionRef: CollectionReference<DocumentData> = collection(db, "writefromdictation");
        const q: Query<DocumentData> = query(collectionRef, where("isHidden", "==", false));
        
        const querySnapshot = await getDocs(q);
        let data: AudioSample[] = querySnapshot.docs.map((doc) => doc.data() as AudioSample);

        // Sort the data based on the selected sorting option
        data = data.sort((a, b) => {
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

        setAudioSamples(data);
        setCurrentIndex(0); // Reset the currentIndex to 0
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [sortingOption]);

  useEffect(() => {
    if (audioSamples.length > 0 && audioRef.current) {
      audioRef.current.play();
    }
  }, [audioSamples, currentIndex]);

  const handleNext = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.stop();
    }
    setInputText("");
    setCurrentIndex((prevIndex) => (prevIndex + 1) % audioSamples.length);
    setShowAnswer(alwaysShowAnswer); // Set the answer visibility based on the checkbox state
  }, [audioSamples.length, alwaysShowAnswer]);

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
    if (isAutoplay && audioRef.current) {
      audioRef.current.play();
    }
  }, [currentIndex, isAutoplay]);

  const handleSelectChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newIndex = parseInt(event.target.value, 10);
    if (audioRef.current) {
      await audioRef.current.stop();
    }
    setCurrentIndex(newIndex);
    if (audioRef.current) {
      await audioRef.current.play();
    }
    setShowAnswer(alwaysShowAnswer); // Set the answer visibility based on the checkbox state
    setInputText(""); // Clear the textarea
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAlwaysShowAnswer(event.target.checked);
    setShowAnswer(event.target.checked); // Update the answer visibility immediately
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
    console.log("Changing playback rate to:", newRate); // Debug log
    setPlaybackRate(newRate);
  };

  const countIncorrect = () => {
    if (audioSamples.length === 0) return;

    const correctText = audioSamples[currentIndex]?.text.trim();
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
    setShowAnswer(true); // Show the answer when the button is clicked
    countIncorrect();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="flex mx-auto min-h-screen flex-col items-center min-w-screen p-6 space-y-5 w-full bg-gradient-to-r from-green-200 via-pink-300 to-yellow-200 backdrop-blur-lg">
      <Navigation />
      <Link href="/" className="flex justify-center mb-4">
        <Image src="/logo1.png" alt="Logo" width={300} height={200} />
      </Link>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
        Write From Dictation
      </h1>
      <div className="w-full max-w-2xl mx-auto">
        {audioSamples.length > 0 && (
          <AudioPlayer
            ref={audioRef}
            occurrence={audioSamples[currentIndex]?.occurrence}
            audio={audioSamples[currentIndex]?.audio[selectedVoice]}
            text={audioSamples[currentIndex]?.text}
            onEnded={handleAudioEnd}
            showAnswer={showAnswer}
            playbackRate={playbackRate} // Pass the playbackRate state here
            onPlaybackRateChange={handlePlaybackRateChange}
          />
        )}
        <div className="mt-4 w-full">
          <textarea
            id="txtInput"
            rows={5}
            className="w-full p-4 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-90 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="Your notes here..."
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
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-90 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              disabled={audioSamples.length === 0}
            >
              {audioSamples.map((sample, index) => (
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
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-90 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              {audioSamples.length > 0 &&
                Object.keys(audioSamples[currentIndex]?.audio).map((voice, index) => (
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
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-90 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="occurrence">Occurrence (Highest to Lowest)</option>
              <option value="newest">Newest</option>
              <option value="easyToDifficult">Easy to Difficult (Shortest to Longest Text)</option>
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
          <label htmlFor="showAnswer" className="text-gray-700">
            Always show answer
          </label>
        </div>
        <p className="mt-4 text-gray-700">Incorrect: {numberOfIncorrect}</p>
        <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-2">
          <button
            className="px-4 py-2 w-full md:w-auto bg-blue-500 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            onClick={handleNext}
            disabled={audioSamples.length === 0}
          >
            Next
          </button>
          <button
            className="px-4 py-2 w-full md:w-auto bg-green-500 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            onClick={handlePlayAll}
          >
            {isAutoplay ? "Stop" : "Play All"}
          </button>
          <button
            className="px-4 py-2 w-full md:w-auto bg-red-500 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            onClick={handleAnswerButtonClick}
          >
            Answer
          </button>
        </div>
       
      </div>
    </main>
  );
};

export default WriteFromDictation;
