import React from "react";

interface WordStatusItem {
  word: string;
  status: "correct" | "incorrect" | "missing";
}

interface AnswerSummaryProps {
  score: number;
  maxScore: number;
  showAnswer: boolean;
  wordStatuses: WordStatusItem[];
}

const AnswerSummary: React.FC<AnswerSummaryProps> = ({
  score,
  maxScore,
  showAnswer,
  wordStatuses
}) => (
  <>
    <div className="mt-4 space-y-2 text-white">
      <p>Score: {score}/{maxScore}</p>
    </div>
    {showAnswer && (
      <div className="mt-4 mb-6 w-full rounded-lg border border-[#fc5d01] bg-white bg-opacity-10 p-4 text-white">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <span className="text-[#fc5d01]">Your answer:</span>
          {wordStatuses.length === 0 ? (
            <span className="text-[#ffffff]">(no answer)</span>
          ) : (
            <span className="flex flex-wrap gap-2">
              {wordStatuses.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === wordStatuses.length - 1;
                const displayWord = item.status === "missing" ? `(${item.word})` : item.word;
                const formattedWord = isFirst
                  ? `${displayWord.charAt(0).toUpperCase()}${displayWord.slice(1)}`
                  : displayWord;
                const outputWord = isLast ? `${formattedWord}.` : formattedWord;

                return (
                  <span
                    key={`${item.word}-${index}`}
                    className={item.status === "incorrect" ? "text-[#ffffff] line-through" : "text-[#ffffff]"}
                  >
                    {outputWord}
                  </span>
                );
              })}
            </span>
          )}
        </div>
      </div>
    )}
  </>
);

export default AnswerSummary;