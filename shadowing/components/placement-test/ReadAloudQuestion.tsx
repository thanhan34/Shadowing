import React, { useState } from "react";
import Timer from "./Timer";

interface ReadAloudQuestionProps {
  content: string;
  timer: number;
  isPrepping: boolean;
  prepTimer: number | null;
  isRecordingPhase: boolean;
  recordTimer: number | null;
  isRecording: boolean;
  userAnswer?: string;
  onNext: () => void;
  isLastQuestion: boolean;
}

const ReadAloudQuestion: React.FC<ReadAloudQuestionProps> = ({
  content,
  timer,
  isPrepping,
  prepTimer,
  isRecordingPhase,
  recordTimer,
  isRecording,
  userAnswer,
  onNext,
  isLastQuestion,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="bg-red-500 text-white text-2xl font-bold rounded-lg p-4">
              RA
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Read Aloud</h2>
              <div className="text-gray-600 mb-6">
                Look at the text below. In 40 seconds, you must read this text
                aloud as naturally and clearly as possible.
              </div>
            </div>
          </div>
          {/* <Timer time={timer} /> */}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-lg text-gray-800 leading-relaxed">{content}</p>
        </div>

        <div className="mt-6">
          {isPrepping && (
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 mb-2">
                Preparation Time
              </div>
              <div className="text-4xl font-bold text-yellow-500">
                {prepTimer} seconds
              </div>
              <p className="text-gray-600 mt-2">
                Recording will start automatically after preparation time
              </p>
            </div>
          )}

          {isRecordingPhase && (
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 mb-2">
                Recording Phase
              </div>
                {recordTimer} seconds
                <div className="text-4xl font-bold text-red-500">
                {recordTimer} seconds
              </div>
              <div className="animate-pulse text-red-500 mt-2">
                ● Recording in progress
              </div>
            </div>
          )}

          {userAnswer && (
            <div className="mt-6">
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="text-gray-800 font-medium mb-2">
                  Your Recording:
                </h3>
                <audio controls src={userAnswer} className="w-full" />
              </div>
            </div>
          )}
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

export default ReadAloudQuestion;
