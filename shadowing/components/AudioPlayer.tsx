import React, { useRef, useEffect, useId, forwardRef, useImperativeHandle } from 'react';

interface CustomAudioRef {
  play: () => Promise<void>;
  stop: () => Promise<void>;
}

interface AudioPlayerProps {
  audio: string;
  text: string;
  occurrence: number;
  onEnded: () => void;
  showAnswer: boolean;
  playbackRate: number;
  onPlaybackRateChange: (newRate: number) => void;
  questionType: string;
  vietnameseTranslation?: string;
  variant?: 'default' | 'dictation';
}

const AudioPlayer = forwardRef<CustomAudioRef, AudioPlayerProps>(({
  audio,
  text,
  occurrence,
  onEnded,
  showAnswer,
  playbackRate,
  onPlaybackRateChange, 
  questionType,
  vietnameseTranslation,
  variant = 'default'
}, ref) => {
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const speedId = useId();

  useImperativeHandle(ref, () => ({
    play: async () => {
      if (audioElementRef.current) {
        audioElementRef.current.playbackRate = playbackRate;
        await audioElementRef.current.play();
      }
    },
    stop: async () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
      return Promise.resolve();
    }
  }), [playbackRate]);

  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.load();
      audioElementRef.current.play();
    }
  }, [audio]);

  const handlePlaybackRateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newRate = parseFloat(event.target.value);
    onPlaybackRateChange(newRate);
  };

  return (
    <div className={variant === 'dictation' ? 'wfd-audio-panel' : 'flex flex-col w-full max-w-2xl px-6 py-8 bg-white bg-opacity-30 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200'}>
      {variant === 'dictation' && <h2 className="mb-4 text-lg font-semibold">01 · Nghe câu mẫu</h2>}
      {questionType && (
        <div className="mb-4">
          <p className="text-lg font-medium text-gray-800">Số lần xuất hiện: {occurrence} | {questionType}</p>
        </div>
      )}
      <div className="flex flex-col items-center justify-center mb-4 w-full">
        <audio
          ref={audioElementRef}
          controls
          src={audio}
          onEnded={onEnded}
          className="w-full h-12"
        />
      </div>
      <details className={variant === 'dictation' ? 'wfd-settings-disclosure mb-4' : 'mb-4'} open={variant === 'dictation' ? undefined : true}>
        <summary className={variant === 'dictation' ? 'wfd-settings-summary' : 'sr-only'}>Tốc độ phát · {playbackRate}x</summary>
      <div className="flex flex-col md:flex-row justify-between items-center p-4 w-full">
        <div className="mb-4 md:mb-0 md:mr-4 w-full">
          <label htmlFor={speedId} className="block mb-1 font-medium text-gray-700">Playback Speed:</label>
          <select
            id={speedId}
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={handlePlaybackRateChange}
            value={playbackRate.toString()}
          >
            <option value="1.5">1.5x</option>
            <option value="1.2">1.2x</option>
            <option value="1">1.0x</option>
            <option value="0.8">0.8x</option>
            <option value="0.5">0.5x</option>
          </select>
        </div>
      </div>
      </details>
      {showAnswer && text && (
        <div className="mb-4 w-full">
          <p className={variant === 'dictation' ? 'wfd-reference-answer' : 'p-4 bg-blue-50 border border-blue-200 rounded text-gray-800 text-lg'}>{text}</p>
          {vietnameseTranslation && (
            <p className={variant === 'dictation' ? 'wfd-translation' : 'p-4 mt-2 bg-[#fedac2] border border-[#fc5d01] rounded text-gray-800 text-lg'}>
              <span className={variant === 'dictation' ? 'font-semibold text-lightBackground' : 'font-bold text-[#fc5d01]'}>Nghĩa tiếng Việt:</span> {vietnameseTranslation}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';
export default AudioPlayer;
