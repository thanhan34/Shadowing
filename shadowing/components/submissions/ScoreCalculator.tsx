import React from 'react';
import { Submission, Question } from '../../types/placement-test';

interface QuestionScore {
  correct: number;
  total: number;
}

export const calculateRWFIBScore = (
  submission: Submission,
  questions: Record<string, Question>
): QuestionScore => {
  let totalCorrect = 0;
  let total = 0;

  Object.entries(submission.answers).forEach(([questionId, answer]) => {
    const questionNum = parseInt(questionId);
    if (questionNum >= 4 && questionNum <= 6) {
      const userAnswers = answer.answer.split(',').map(a => a.trim());
      const correctAnswers = answer.correctAnswers || [];
      
      userAnswers.forEach((userAnswer, index) => {
        if (userAnswer === correctAnswers[index]) {
          totalCorrect++;
        }
      });
      
      total += correctAnswers.length || answer.content.split('_____').length - 1;
    }
  });

  return { correct: totalCorrect, total };
};

export const calculateRFIBScore = (
  submission: Submission,
  questions: Record<string, Question>
): QuestionScore => {
  let totalCorrect = 0;
  let total = 0;

  Object.entries(submission.answers).forEach(([questionId, answer]) => {
    const questionNum = parseInt(questionId);
    if (questionNum >= 7 && questionNum <= 9) {
      const userAnswers = answer.answer.split(',').map(a => a.trim());
      const correctAnswers = answer.correctAnswers || [];

      userAnswers.forEach((userAnswer, index) => {
        if (userAnswer === correctAnswers[index]) {
          totalCorrect++;
        }
      });

      total += correctAnswers.length || answer.content.split('_____').length - 1;
    }
  });

  return { correct: totalCorrect, total };
};

export const calculateWFDScore = (
  submission: Submission,
  questions: Record<string, Question>
): QuestionScore => {
  let totalCorrect = 0;
  let total = 0;

  const cleanText = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[.,!?;:'"]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  };

  Object.entries(submission.answers).forEach(([questionId, answer]) => {
    const questionNum = parseInt(questionId);
    if (questionNum >= 10 && questionNum <= 12) {
      const correctText = questions[questionId]?.text || answer.text || answer.content || '';
      const correctWordsLower = cleanText(correctText);
      const userWordsLower = cleanText(answer.answer);

      // Track used words
      const usedCorrect = new Set<number>();
      const usedUser = new Set<number>();

      // Find exact matches
      userWordsLower.forEach((userWord, userIdx) => {
        correctWordsLower.forEach((correctWord, correctIdx) => {
          if (!usedUser.has(userIdx) && !usedCorrect.has(correctIdx) && userWord === correctWord) {
            totalCorrect++;
            usedCorrect.add(correctIdx);
            usedUser.add(userIdx);
          }
        });
      });

      total += correctWordsLower.length;
    }
  });

  return { correct: totalCorrect, total };
};

interface ScoreSummaryProps {
  score: QuestionScore;
  label: string;
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({ score, label }) => {
  return (
    <p className="text-sm sm:text-base">
      <span className="text-[#FFFFFF]">{label}: </span>
      <span className="text-[#fd7f33] font-bold">{score.correct}/{score.total}</span>
    </p>
  );
};
