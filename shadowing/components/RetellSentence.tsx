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
    <div className="w-full">
      <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8">
        {/* Audio Player */}
        <audio 
          ref={audioRef} 
          controls 
          autoPlay 
          loop 
          key={getAudioUrl()}
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

        {/* Sentence Text with highlight */}
        <div className="bg-gradient-to-r from-[#fedac2] to-[#ffac7b] rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center justify-center mb-3">
            <span className="text-2xl">🔊</span>
          </div>
          <p className="text-xl md:text-2xl lg:text-3xl text-center font-extrabold text-[#fc5d01] leading-relaxed">
            {sentence.text}
          </p>
        </div>

        {/* Loop indicator */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 font-medium">
            🔁 Audio đang loop - Luyện tập cho đến khi thành thạo!
          </p>
        </div>
      </div>
    </div>
  );
};

export default RetellSentence;
