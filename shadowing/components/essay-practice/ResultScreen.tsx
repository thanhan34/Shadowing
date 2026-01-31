import React from "react";

interface ResultScreenProps {
  timeSeconds: number;
  totalCharacters: number;
  errorCount: number;
  wpm: number;
  onReset: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({
  timeSeconds,
  totalCharacters,
  errorCount,
  wpm,
  onReset
}) => {
  return (
    <div className="w-full max-w-3xl bg-white border border-[#fedac2] rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-[#fc5d01] mb-4">Hoàn thành!</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
        <div className="p-3 rounded-lg bg-[#fedac2]">
          <p className="font-semibold text-[#fc5d01]">Time to completion</p>
          <p>{timeSeconds}s</p>
        </div>
        <div className="p-3 rounded-lg bg-[#fedac2]">
          <p className="font-semibold text-[#fc5d01]">Total characters</p>
          <p>{totalCharacters}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#fedac2]">
          <p className="font-semibold text-[#fc5d01]">Error count</p>
          <p>{errorCount}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#fedac2]">
          <p className="font-semibold text-[#fc5d01]">Words per minute</p>
          <p>{wpm}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 w-full rounded-lg bg-[#fc5d01] text-white font-semibold py-3 hover:bg-[#fd7f33] transition-colors"
      >
        Luyện lại
      </button>
    </div>
  );
};

export default ResultScreen;