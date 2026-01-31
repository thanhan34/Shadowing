import React from "react";

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  return (
    <div className="sticky top-0 z-20 w-full bg-white border-b border-[#fedac2]">
      <div className="max-w-5xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-[#fc5d01]">Progress</span>
          <span className="text-sm font-semibold text-[#fc5d01]">
            {Math.min(100, Math.max(0, Math.round(percentage)))}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#fedac2]">
          <div
            className="h-2 rounded-full bg-[#fc5d01] transition-all"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;