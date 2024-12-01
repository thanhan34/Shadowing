import React from "react";

interface QuestionProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
}

const QuestionProgress: React.FC<QuestionProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
}) => {
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="mb-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Placement Test</h1>
        <span className="text-white">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-300 rounded-full h-3 mt-4">
        <div
          className="bg-primary h-3 rounded-full transition-all duration-300"
          style={{
            width: `${progressPercentage}%`,
          }}
        ></div>
      </div>

      {/* Percentage Display */}
      <div className="mt-2 text-sm text-white text-right">
        {Math.round(progressPercentage)}%
      </div>
    </div>
  );
};

export default QuestionProgress;
