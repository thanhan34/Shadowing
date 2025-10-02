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
              <p 
                className={`text-lg md:text-xl leading-relaxed ${
                  index === currentSentenceIndex 
                    ? 'font-extrabold text-[#fc5d01]' 
                    : 'font-medium text-gray-800'
                }`}
              >
                {sentence.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RetellParagraph;
