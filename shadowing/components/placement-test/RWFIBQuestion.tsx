import React from "react";
import Timer from "./Timer";

interface RWFIBQuestionProps {
  content: string;
  timer: number;
  availableOptions: string[];
  userAnswers: Record<string, string>;
  onAnswerChange: (index: number, value: string) => void;
  onNext: () => void;
  isLastQuestion: boolean;
  questionId: string;
}

const RWFIBQuestion: React.FC<RWFIBQuestionProps> = ({
  content,
  timer,
  availableOptions,
  userAnswers,
  onAnswerChange,
  onNext,
  isLastQuestion,
  questionId,
}) => {
  // Get options for a specific blank index
  const getOptionsForBlank = (index: number): string[] => {
    if (!Array.isArray(availableOptions)) {
      return [];
    }
    // Get the 4 options for this blank (assuming they are sequential in availableOptions)
    const startIndex = index * 4;
    // Make sure we don't exceed array bounds
    if (startIndex >= availableOptions.length) {
      return [];
    }
    // Safely slice the array
    return availableOptions.slice(
      startIndex,
      Math.min(startIndex + 4, availableOptions.length)
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500 text-white text-2xl font-bold rounded-lg p-4">
              FIB
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Reading & Writing: Fill in the blanks
              </h2>
            </div>
          </div>
          <Timer time={timer} />
        </div>

        <div className="text-gray-600 mb-6">
          There are some words missing in the following text. Please select the
          correct word in the drop-down box.
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="text-lg text-gray-800 leading-relaxed">
            {content
              .split("_____")
              .map((part: string, index: number, array: string[]) => (
                <React.Fragment key={index}>
                  {part}
                  {index < array.length - 1 && (
                    <select
                      className="min-w-[120px] h-[36px] px-3 border-b-2 border-primary focus:outline-none focus:border-primaryHover mx-1 text-gray-700 font-medium bg-white transition-all duration-300"
                      value={userAnswers[`${questionId}_${index}`] || ""}
                      onChange={(e) => onAnswerChange(index, e.target.value)}
                    >
                      <option value="" className="text-gray-500">
                        Select answer
                      </option>
                      {getOptionsForBlank(index).map((option: string) => (
                        <option
                          key={option}
                          value={option}
                          className="text-gray-700"
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </React.Fragment>
              ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onNext}
            className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primaryHover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300"
          >
            {isLastQuestion ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RWFIBQuestion;
