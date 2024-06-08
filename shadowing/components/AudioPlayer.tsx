import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CustomAudioRef } from '@/types';

interface AudioPlayerProps {
  audio: string;
  text: string;
  occurrence: number;
  onEnded: () => void;
  showAnswer: boolean;
  playbackRate: number;
  onPlaybackRateChange: (newRate: number) => void;
}

const AudioPlayer = forwardRef<CustomAudioRef, AudioPlayerProps>(({
  audio,
  text,
  occurrence,
  onEnded,
  showAnswer,
  playbackRate,
  onPlaybackRateChange
}, ref) => {
  const audioElementRef = useRef<HTMLAudioElement>(null);

  useImperativeHandle(ref, () => ({
    play: async () => {
      if (audioElementRef.current) {
        audioElementRef.current.playbackRate = playbackRate; // Ensure playbackRate is set before playing
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
  }), [audio, playbackRate]);

  useEffect(() => {
    if (audioElementRef.current) {
      console.log("Setting playback rate to:", playbackRate); // Debug log
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
    console.log("Selected playback rate:", newRate); // Debug log
    onPlaybackRateChange(newRate);
  };

  return (
    <div className="flex flex-col w-full max-w-2xl px-6 py-8 bg-white bg-opacity-30 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200">
      <div className="mb-4">
        <p className="text-xl font-semibold text-black">Số lần xuất hiện: {occurrence}</p>
      </div>
      <div className="flex flex-col items-center justify-center mb-4 w-full">
        <audio
          ref={audioElementRef}
          controls
          src={audio}
          onEnded={onEnded}
          className="w-full h-12"
        />
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 w-full">
        <div className="mb-4 md:mb-0 md:mr-4 w-full">
          <label className="block mb-1 font-medium text-black">Playback Speed:</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={handlePlaybackRateChange}
            value={playbackRate.toString()} // Ensure this is binding correctly
          >
            <option value="1.5">1.5</option>
            <option value="1.2">1.2</option>
            <option value="1">1</option>
            <option value="0.8">0.8</option>
            <option value="0.5">0.5</option>
          </select>
        </div>
      </div>
      {showAnswer && (
        <div className="mb-4 w-full">
          <p className="p-4 bg-blue-100 bg-opacity-50 border border-blue-300 rounded text-black text-lg">{text}</p>
        </div>
      )}
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';
export default AudioPlayer;
