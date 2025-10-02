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
    <div className="z-10 items-center justify-between w-full max-w-5xl font-mono text-sm lg:flex">
      <div className="mt-5 d-flex flex-col h-100 w-full">
        <audio 
          ref={audioRef} 
          controls 
          key={getAudioUrl()}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          className="w-full"
        >
          <source src={getAudioUrl()} type="audio/mpeg" />
        </audio>
        
        {/* Speed Control */}
        <div className="flex items-center gap-2 mt-3 mb-2">
          <span className="text-sm text-gray-600 font-medium">Tốc độ:</span>
          <div className="flex gap-1">
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                  playbackRate === speed
                    ? 'bg-[#fc5d01] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 mb-5 text-lg sm:text-xl text-center sm:text-left space-y-3">
          {sentences.map((sentence, index) => (
            <p 
              key={sentence.number} 
              className={`text-gray-700 ${index === currentSentenceIndex ? 'font-bold text-[#fc5d01]' : ''}`}
            >
              {sentence.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RetellParagraph;
