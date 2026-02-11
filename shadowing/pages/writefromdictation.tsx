import Image from "next/image";
import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";
import Head from "next/head";
import { DEFAULT_TOPICS } from "../types/writefromdictation";
import AnswerSummary from "../components/writefromdictation/AnswerSummary";
import { useWriteFromDictation } from "../hooks/useWriteFromDictation";
import { useAnswerInputGuards } from "../hooks/useAnswerInputGuards";

const WriteFromDictation: React.FC = () => {
  const {
    audioRef,
    backgroundImage,
    sortedAudioSamples,
    currentAudioSample,
    currentIndex,
    isAutoplay,
    isRepeatMode,
    showAnswer,
    alwaysShowAnswer,
    inputText,
    score,
    maxScore,
    wordStatuses,
    selectedVoice,
    sortingOption,
    playbackRate,
    loading,
    filterOption,
    topicFilter,
    handleNext,
    handleBack,
    handlePlayAll,
    handleAudioEnd,
    handleSelectIndexChange,
    handleAlwaysShowAnswerChange,
    handleInputTextChange,
    handleVoiceChange,
    handleSortingChange,
    handleFilterChange,
    handleTopicFilterChange,
    handlePlaybackRateChange,
    handleAnswerButtonClick,
    handlePlay,
    handleRepeat,
    toggleRepeatMode,
    handleExportCSV
  } = useWriteFromDictation();
  const {
    handlePreventCopyPaste,
    handlePreventContextMenu,
    handlePreventDragDrop
  } = useAnswerInputGuards();

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
      </Head>      <Link href="/" className="flex justify-center mb-4">
        <Image src="/logo1.png" alt="Logo" width={200} height={200} />
      </Link>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
        Write From Dictation
      </h1>
      <div className="w-full max-w-2xl mx-auto">
        {sortedAudioSamples.length > 0 && currentAudioSample && (
          <AudioPlayer
            ref={audioRef}
            occurrence={currentAudioSample.occurrence}
            questionType={currentAudioSample.questionType}
            audio={currentAudioSample.audio[selectedVoice]}
            text={currentAudioSample.text}
            vietnameseTranslation={currentAudioSample.vietnameseTranslation}
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
            onChange={(event) => handleInputTextChange(event.target.value)}
            onCopy={handlePreventCopyPaste}
            onCut={handlePreventCopyPaste}
            onPaste={handlePreventCopyPaste}
            onContextMenu={handlePreventContextMenu}
            onDrop={handlePreventDragDrop}
            onDragOver={handlePreventDragDrop}
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
              onChange={(event) => handleSelectIndexChange(parseInt(event.target.value, 10))}
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
              onChange={(event) => handleVoiceChange(event.target.value)}
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
              onChange={(event) => handleSortingChange(event.target.value)}
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
              onChange={(event) => handleFilterChange(event.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="All">All</option>
              <option value="New">New</option>
              <option value="Still Important">Still Important</option>
            </select>
          </div>
          <div className="mb-4 md:mb-0 md:mr-4 w-full">
            <label htmlFor="topic-filter" className="block mb-1 font-medium text-gray-700">
              Topic:
            </label>
            <select
              id="topic-filter"
              value={topicFilter}
              onChange={(event) => handleTopicFilterChange(event.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              {DEFAULT_TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="showAnswer"
            checked={alwaysShowAnswer}
            onChange={(event) => handleAlwaysShowAnswerChange(event.target.checked)}
            className="mr-2"
          />
          <label htmlFor="showAnswer" className="text-white">
            Always show answer
          </label>
        </div>
        <AnswerSummary
          score={score}
          maxScore={maxScore}
          showAnswer={showAnswer}
          wordStatuses={wordStatuses}
        />
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <button
            className="w-full rounded-lg bg-[#fd7f33] px-4 py-2 text-white shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-[#fdbc94]/50 shadow-xl"
            onClick={handleBack}
            disabled={sortedAudioSamples.length === 0}
          >
            Back
          </button>
          <button
            className="w-full rounded-lg bg-purple-500 px-4 py-2 text-white shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-purple-400/50 shadow-xl"
            onClick={handlePlay}
          >
            Play
          </button>
          <button
            className="w-full rounded-lg bg-yellow-500 px-4 py-2 text-white shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-yellow-400/50 shadow-xl"
            onClick={handleRepeat}
          >
            Repeat
          </button>
          <button
            className={`w-full rounded-lg px-4 py-2 text-white shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-[#fdbc94]/50 shadow-xl ${isRepeatMode ? 'bg-[#fc5d01]' : 'bg-[#fd7f33]'}`}
            onClick={toggleRepeatMode}
          >
            {isRepeatMode ? 'Stop Looping' : 'Loop Current'}
          </button>
          <button
            className="w-full rounded-lg bg-blue-500 px-4 py-2 text-white shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-blue-400/50 shadow-xl"
            onClick={handleNext}
            disabled={sortedAudioSamples.length === 0}
          >
            Next
          </button>
          <button
            className="w-full rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-green-400/50 shadow-xl"
            onClick={handlePlayAll}
          >
            {isAutoplay ? "Stop" : "Play All"}
          </button>
          <button
            className="w-full rounded-lg bg-red-500 px-4 py-2 text-white shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-red-400/50 shadow-xl"
            onClick={handleAnswerButtonClick}
          >
            Answer
          </button>
          <button
            className="w-full rounded-lg bg-orange-500 px-4 py-2 text-white shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-orange-400/50 shadow-xl"
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
