import React, { useState, useEffect, useRef } from "react";
import Timer from "./Timer";

interface AudioSources {
  Brian?: string;
  Joanna?: string;
  Olivia?: string;
}

interface WFDQuestionProps {
  audio: AudioSources;
  timer: number;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  onNext: () => void;
  isLastQuestion: boolean;
  questionKey: string; // Add this to force reset on question change
}

const WFDQuestion: React.FC<WFDQuestionProps> = ({
  audio,
  timer,
  userAnswer,
  onAnswerChange,
  onNext,
  isLastQuestion,
  questionKey,
}) => {
  const [prepTimer, setPrepTimer] = useState<number>(3);
  const [isPrepping, setIsPrepping] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrl = audio.Brian || audio.Joanna || audio.Olivia;

  // Reset state when question changes
  useEffect(() => {
    setPrepTimer(3);
    setIsPrepping(true);
  }, [questionKey]);

  // Handle preparation countdown and auto-play
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPrepping && prepTimer > 0) {
      interval = setInterval(() => {
        setPrepTimer((prev) => prev - 1);
      }, 1000);
    } else if (isPrepping && prepTimer === 0) {
      setIsPrepping(false);
      // Play audio automatically
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
    }

    return () => clearInterval(interval);
  }, [isPrepping, prepTimer]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-500 text-white text-2xl font-bold rounded-lg p-4">
              WFD
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Write From Dictation
              </h2>
            </div>
          </div>
          <Timer time={timer} />
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          {isPrepping && (
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-800 mb-2">
                Get Ready
              </div>
              <div className="text-4xl font-bold text-yellow-500">
                {prepTimer}
              </div>
              <p className="text-gray-600 mt-2">
                Audio will play automatically
              </p>
            </div>
          )}

          <div className="space-y-4">
            <audio
              ref={audioRef}
              src={audioUrl}
              className="hidden"
              controls={false}
            />
            <textarea
              className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 font-medium"
              placeholder="Type what you hear..."
              value={userAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onNext}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryHover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300"
          >
            {isLastQuestion ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WFDQuestion;
