import React, { useRef, useEffect, useState } from "react";
import parse from "html-react-parser";

interface SentenceProps {
  videoSource: string;
  sentence: string;
}

// Global state để lưu tốc độ phát
let globalPlaybackRate = 1.0;

const Sentence: React.FC<SentenceProps> = ({ videoSource, sentence }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackRate, setPlaybackRate] = useState(globalPlaybackRate);
  
  const speedOptions = [0.5, 0.8, 1.0, 1.2, 1.5];

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
      <div className="mt-5 d-flex flex-column h-100">
        <audio ref={audioRef} controls autoPlay loop key={videoSource}>
          <source src={videoSource} type="audio/mpeg" />
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
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 mb-5 text-2xl">{parse(sentence)}</p>
        <div className="flex flex-row pt-5 pb-5 space-x-5">
          <p className="p-3 border border-red-500 rounded-full ra-break">
            Pause
          </p>
          <p className="p-3 border border-orange-500 rounded-full ra-loss">
            Loss
          </p>
          <p className="p-3 border rounded-full border-cyan-400 ra-link">
            Linking
          </p>
          <p className="p-3 border border-gray-500 rounded-full ra-weak">
            Weak
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sentence;
