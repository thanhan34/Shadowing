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

interface RetellSentenceProps {
  sentence: Sentence;
  selectedVoice: 'brian' | 'joanna' | 'olivia';
}

// Global state để lưu tốc độ phát
let globalPlaybackRate = 1.0;

const RetellSentence: React.FC<RetellSentenceProps> = ({ sentence, selectedVoice }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackRate, setPlaybackRate] = useState(globalPlaybackRate);
  
  const speedOptions = [0.5, 0.8, 1.0, 1.2, 1.5];

  const getAudioUrl = () => {
    return sentence.voices[selectedVoice];
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
      audio.load();
    }
  }, [selectedVoice, sentence]);

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

  return (
    <div className="z-10 items-center justify-between w-full max-w-5xl font-mono text-sm lg:flex">
      <div className="mt-5 d-flex flex-column h-100 w-full">
        <audio 
          ref={audioRef} 
          controls 
          autoPlay 
          loop 
          key={getAudioUrl()}
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

        <p className="mt-5 mb-5 text-xl sm:text-2xl text-center text-gray-700">
          {sentence.text}
        </p>
      </div>
    </div>
  );
};

export default RetellSentence;
