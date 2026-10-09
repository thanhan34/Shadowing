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
    <div className="wfd-score mt-4 flex flex-wrap items-center justify-between gap-3 text-white" aria-live="polite">
      <p className="font-semibold">03 · Kết quả luyện tập</p>
      <p>{showAnswer ? <>Đúng <strong className="text-lg">{score} / {maxScore}</strong> từ</> : 'Kiểm tra đáp án để xem kết quả'}</p>
    </div>
    {showAnswer && (
      <div className="wfd-answer-summary mt-4 mb-6 w-full p-4 text-white">
        <div className="flex flex-wrap items-center gap-3 text-base leading-8">
          <span className="font-semibold text-lightBackground">Bài làm của bạn:</span>
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
                    className={`wfd-word wfd-word-${item.status}`}
                    title={item.status === 'correct' ? 'Từ đúng' : item.status === 'missing' ? 'Từ thiếu' : 'Từ sai hoặc thừa'}
                  >
                    {outputWord}
                  </span>
                );
              })}
            </span>
          )}
        </div>
        <p className="mt-4 text-xs leading-6 text-white/80">Gạch chân: từ đúng · Gạch ngang: từ sai hoặc thừa · Trong ngoặc: từ còn thiếu</p>
      </div>
    )}
  </>
);

export default AnswerSummary;