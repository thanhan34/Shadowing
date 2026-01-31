import React, { useRef, useEffect, useState } from "react";

interface Sentence {
  number: number;
  text: string;
  voices: {
    brian: string;
    joanna: string;
    olivia: string;
  };
}

interface RetellParagraphProps {
  sentences: Sentence[];
  fullText: string;
  selectedVoice: 'brian' | 'joanna' | 'olivia';
}

// Global state để lưu tốc độ phát
let globalPlaybackRate = 1.0;

const RetellParagraph: React.FC<RetellParagraphProps> = ({ sentences, fullText, selectedVoice }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackRate, setPlaybackRate] = useState(globalPlaybackRate);
  const [currentTime, setCurrentTime] = useState(0);
  
  const speedOptions = [0.5, 0.8, 1.0, 1.2, 1.5];

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [hideMode, setHideMode] = useState<'none' | 'random30' | 'random50' | 'random70' | 'firstLetter'>('none');
  const [hiddenWordsMap, setHiddenWordsMap] = useState<{[key: number]: number[]}>({});
  const [hiddenSentences, setHiddenSentences] = useState<{[key: number]: boolean}>({});

  // Get audio URL for current sentence
  const getAudioUrl = () => {
    if (sentences[currentSentenceIndex]) {
      return sentences[currentSentenceIndex].voices[selectedVoice];
    }
    return sentences[0].voices[selectedVoice];
  };

  // Handle when audio ends - play next sentence
  const handleAudioEnded = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    } else {
      // Reset to beginning
      setCurrentSentenceIndex(0);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
      audio.load();
      // Auto play next sentence
      audio.play().catch(e => console.log('Auto-play prevented:', e));
    }
  }, [selectedVoice, currentSentenceIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    globalPlaybackRate = speed;
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Function to hide random words by percentage
  const hideRandomWords = (text: string, percentage: number, sentenceIndex: number): JSX.Element => {
    const words = text.split(/(\s+)/); // Split by spaces but keep the spaces
    const actualWords = words.filter(w => w.trim().length > 0);
    const numWordsToHide = Math.floor(actualWords.length * (percentage / 100));
    
    // Get or create hidden indices for this sentence
    if (!hiddenWordsMap[sentenceIndex]) {
      const wordIndices: number[] = [];
      words.forEach((word, idx) => {
        if (word.trim().length > 0) wordIndices.push(idx);
      });
      
      // Shuffle and select random indices
      const shuffled = [...wordIndices].sort(() => Math.random() - 0.5);
      const selectedIndices = shuffled.slice(0, numWordsToHide);
      setHiddenWordsMap(prev => ({...prev, [sentenceIndex]: selectedIndices}));
    }

    const hiddenIndices = hiddenWordsMap[sentenceIndex] || [];

    return (
      <>
        {words.map((word, idx) => {
          if (word.trim().length === 0) return <span key={idx}>{word}</span>;
          if (hiddenIndices.includes(idx)) {
            return <span key={idx} className="text-[#fc5d01] font-bold">{"_".repeat(word.length)}</span>;
          }
          return <span key={idx}>{word}</span>;
        })}
      </>
    );
  };

  // Function to show only first word of each sentence
  const showFirstWordOnly = (text: string): JSX.Element => {
    const words = text.split(/\s+/);
    
    if (words.length === 0) return <>{text}</>;
    
    const firstWord = words[0];
    const restWords = words.slice(1);
    const totalRestLength = restWords.reduce((sum, word) => sum + word.length, 0) + restWords.length - 1;
    
    return (
      <>
        <span className="text-gray-800">{firstWord}</span>
        {totalRestLength > 0 && (
          <>
            <span> </span>
            <span className="text-[#fc5d01] font-bold">{"_".repeat(totalRestLength)}</span>
          </>
        )}
      </>
    );
  };

  // Function to render text based on hide mode
  const renderText = (text: string, sentenceIndex: number) => {
    // Check if this sentence is individually hidden
    if (hiddenSentences[sentenceIndex]) {
      return showFirstWordOnly(text);
    }
    
    if (hideMode === 'none') {
      return text;
    } else if (hideMode === 'random30') {
      return hideRandomWords(text, 30, sentenceIndex);
    } else if (hideMode === 'random50') {
      return hideRandomWords(text, 50, sentenceIndex);
    } else if (hideMode === 'random70') {
      return hideRandomWords(text, 70, sentenceIndex);
    } else if (hideMode === 'firstLetter') {
      return showFirstWordOnly(text);
    }
    return text;
  };

  // Reset hidden words map when hide mode changes
  useEffect(() => {
    setHiddenWordsMap({});
  }, [hideMode]);

  const handleHideModeChange = (mode: 'none' | 'random30' | 'random50' | 'random70' | 'firstLetter') => {
    setHideMode(mode);
    // Khi chọn "Hiện tất cả", cũng hiện tất cả các câu bị ẩn riêng lẻ
    if (mode === 'none') {
      setHiddenSentences({});
    }
  };

  const toggleSentenceVisibility = (sentenceIndex: number) => {
    setHiddenSentences(prev => ({
      ...prev,
      [sentenceIndex]: !prev[sentenceIndex]
    }));
  };

  return (
    <div className="w-full">
      <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8">
        {/* Audio Player */}
        <audio 
          ref={audioRef} 
          controls 
          key={getAudioUrl()}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          className="w-full mb-6 rounded-xl shadow-lg"
        >
          <source src={getAudioUrl()} type="audio/mpeg" />
        </audio>
        
        {/* Speed Control */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <span className="text-lg font-bold text-gray-800">⚡ Tốc độ:</span>
          <div className="flex gap-2">
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-5 py-2 text-base font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                  playbackRate === speed
                    ? 'bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Hide Mode Controls */}
        <div className="mb-8 border-t-2 border-gray-200 pt-6">
          <div className="flex flex-col items-center gap-4">
            <span className="text-lg font-bold text-gray-800">🎯 Chế độ luyện tập:</span>
            
            {/* Random Hide Buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleHideModeChange('none')}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                  hideMode === 'none'
                    ? 'bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                }`}
              >
                📖 Hiện tất cả
              </button>
              <button
                onClick={() => handleHideModeChange('random30')}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                  hideMode === 'random30'
                    ? 'bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                }`}
              >
                🔸 Ẩn 30%
              </button>
              <button
                onClick={() => handleHideModeChange('random50')}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                  hideMode === 'random50'
                    ? 'bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                }`}
              >
                🔶 Ẩn 50%
              </button>
              <button
                onClick={() => handleHideModeChange('random70')}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                  hideMode === 'random70'
                    ? 'bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                }`}
              >
                🔴 Ẩn 70%
              </button>
              <button
                onClick={() => handleHideModeChange('firstLetter')}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                  hideMode === 'firstLetter'
                    ? 'bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                }`}
              >
                🅰️ Chỉ từ đầu
              </button>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          {sentences.map((sentence, index) => (
            <div
              key={sentence.number}
              className={`p-4 rounded-xl transition-all duration-300 ${
                index === currentSentenceIndex
                  ? 'bg-gradient-to-r from-[#fedac2] to-[#ffac7b] shadow-lg transform scale-105'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleSentenceVisibility(index)}
                  className={`flex-shrink-0 px-3 py-1 text-xs font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                    hiddenSentences[index]
                      ? 'bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                  }`}
                  title={hiddenSentences[index] ? "Hiện câu" : "Ẩn câu"}
                >
                  {hiddenSentences[index] ? '👁️' : '🔒'}
                </button>
                <p 
                  className={`flex-1 text-lg md:text-xl leading-relaxed ${
                    index === currentSentenceIndex 
                      ? 'font-extrabold text-[#fc5d01]' 
                      : 'font-medium text-gray-800'
                  }`}
                >
                  {renderText(sentence.text, index)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RetellParagraph;
