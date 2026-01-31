import React from "react";
import { PracticeMode, practiceModes } from "../../data/essayTemplates";

interface ModeSelectorProps {
  selectedMode: PracticeMode | null;
  onSelect: (mode: PracticeMode) => void;
}

const modeDescriptions: Record<PracticeMode, string> = {
  copy: "Hiển thị toàn bộ template để gõ theo.",
  missing: "Chỉ hiển thị 30–50% đầu mỗi câu.",
  blind: "Ẩn toàn bộ nội dung, chỉ hiện nhãn phần."
};

const ModeSelector: React.FC<ModeSelectorProps> = ({ selectedMode, onSelect }) => {
  return (
    <div className="w-full space-y-3">
      <h2 className="text-lg font-semibold text-[#fc5d01]">Chọn chế độ luyện tập</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {practiceModes.map(mode => {
          const isSelected = selectedMode === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onSelect(mode.value)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                isSelected
                  ? "border-[#fc5d01] bg-[#fedac2]"
                  : "border-[#fdbc94] bg-white"
              }`}
            >
              <p className="text-base font-semibold text-[#fc5d01]">
                {mode.label}
              </p>
              <p className="text-sm text-gray-700">{modeDescriptions[mode.value]}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;