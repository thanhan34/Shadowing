import React from 'react';
import Timer from './Timer';

interface RFIBQuestionProps {
  content: string;
  timer: number;
  availableOptions: string[];
  userAnswers: Record<number, string>;
  onDrop: (index: number, value: string) => void;
  onNext: () => void;
  isLastQuestion: boolean;
}

const RFIBQuestion: React.FC<RFIBQuestionProps> = ({
  content,
  timer,
  availableOptions,
  userAnswers,
  onDrop,
  onNext,
  isLastQuestion,
}) => {
  const handleDragStart = (e: React.DragEvent, option: string) => {
    e.dataTransfer.setData('text/plain', option);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const option = e.dataTransfer.getData('text/plain');
    if (option) {
      onDrop(index, option);
    }
  };

  const getAvailableOptionsWithoutUsed = () => {
    const usedOptions = Object.values(userAnswers);
    return availableOptions.filter(option => !usedOptions.includes(option));
  };

  const contentParts = content.split('_____');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500 text-white text-2xl font-bold rounded-lg p-4">
              FIB
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Reading: Fill in the Blanks</h2>
              <div className="text-gray-600 mb-6">
          In the text below some words are missing. Drag words from the box below to the appropriate place in the text.
        </div>
            </div>
          </div>
          {/* <Timer time={timer} /> */}
        </div>

       

        <div className="bg-white p-4 rounded-lg mb-6">
  <div className="text-lg text-gray-800 leading-relaxed">
    {contentParts.map((part: string, index: number) => (
      <React.Fragment key={index}>
        {part}
        {index < contentParts.length - 1 && (
          <div
            className={`inline-flex items-center justify-center min-w-[120px] h-[36px] px-3 mx-1 border-2 align-middle
              ${
                userAnswers[index]
                  ? "border-primary bg-primary/10"
                  : "border-dashed border-gray-400 bg-white"
              }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <span className="text-gray-900 font-medium">
              {userAnswers[index] || ""}
            </span>
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
</div>

        <div className="bg-lightBackground p-4 rounded-lg">
  <div className="flex flex-wrap gap-2">
    {getAvailableOptionsWithoutUsed().map((option: string, index: number) => (
      <div
        key={index}
        draggable
        onDragStart={(e) => handleDragStart(e, option)}
        onDragEnd={handleDragEnd}
        className="px-3 py-1.5 bg-white border border-gray-300 rounded cursor-move 
                   hover:bg-primary hover:border-primary hover:text-white 
                   text-gray-900 font-medium select-none transition-all duration-300"
      >
        {option}
      </div>
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

export default RFIBQuestion;
