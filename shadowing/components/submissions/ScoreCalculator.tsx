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
  let totalPossible = 0;

  console.log('RWFIB Calculation:', {
    answers: submission.answers,
    questions
  });
  Object.entries(submission.answers).forEach(([questionId, answer]) => {
    const questionNum = parseInt(questionId);
    if (questionNum >= 4 && questionNum <= 6) {
      if (!answer?.answer || answer.answer.trim() === '') {
        const options = questions[questionId]?.options;
        totalPossible += options ? 
          (Array.isArray(options) ? options.length : Object.keys(options).length) : 0;
        return;
      }
      console.log('RWFIB Question Processing:', {
        questionId,
        questionFromMap: questions[questionId],
        allQuestionIds: Object.keys(questions),
        hasOptions: questions[questionId]?.options
      });
      const question = questions[questionId];
      if (!question?.options) {
        console.log('Skipping RWFIB question - no options:', questionId);
        return;
      }
      
      const options = question.options;
      const totalBlanks = Array.isArray(options) ? options.length : Object.keys(options).length;
      const userAnswers = answer.answer.split(',').map(a => a.trim());
      const correctAnswers = question.correctAnswers || [];
      
      for (let i = 0; i < totalBlanks; i++) {
        if (userAnswers[i] === correctAnswers[i]) {
          totalCorrect++;
        }
      }
      totalPossible += totalBlanks;
    }
  });

  return { correct: totalCorrect, total: totalPossible };
};

export const calculateRFIBScore = (
  submission: Submission,
  questions: Record<string, Question>
): QuestionScore => {
  let totalCorrect = 0;
  let totalPossible = 0;

  console.log('RFIB Calculation:', {
    answers: submission.answers,
    questions
  });
  Object.entries(submission.answers).forEach(([questionId, answer]) => {
    const questionNum = parseInt(questionId);
    if (questionNum >= 7 && questionNum <= 9) {
      if (!answer?.answer || answer.answer.trim() === '') {
        totalPossible += questions[questionId]?.correctAnswers?.length || 0;
        return;
      }
      console.log('RFIB Question Processing:', {
        questionId,
        questionFromMap: questions[questionId],
        allQuestionIds: Object.keys(questions),
        hasCorrectAnswers: questions[questionId]?.correctAnswers
      });
      const question = questions[questionId];
      if (!question) {
        console.log('Skipping RFIB question - no question:', questionId);
        return;
      }
      
      const userAnswers = answer.answer.split(',').map(a => a.trim());
      const correctAnswers = question.correctAnswers || [];
      
      for (let i = 0; i < correctAnswers.length; i++) {
        if (userAnswers[i] === correctAnswers[i]) {
          totalCorrect++;
        }
      }
      totalPossible += correctAnswers.length;
    }
  });

  return { correct: totalCorrect, total: totalPossible };
};

export const calculateWFDScore = (
  submission: Submission,
  questions: Record<string, Question>
): QuestionScore => {
  let totalCorrect = 0;
  let totalPossible = 0;

  const cleanText = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.trim());
  };

  console.log('WFD Calculation:', {
    answers: submission.answers,
    questions
  });
  Object.entries(submission.answers).forEach(([questionId, answer]) => {
    const questionNum = parseInt(questionId);
    if (questionNum >= 10 && questionNum <= 12) {
      if (!answer?.answer || answer.answer.trim() === '') {
        const correctText = questions[questionId]?.content || '';
        const correctWords = cleanText(correctText);
        totalPossible += correctWords.length;
        return;
      }
      console.log('WFD Question Processing:', {
        questionId,
        questionFromMap: questions[questionId],
        allQuestionIds: Object.keys(questions),
        hasContent: questions[questionId]?.content
      });
      const question = questions[questionId];
      if (!question) {
        console.log('Skipping WFD question - no question:', questionId);
        return;
      }

      const correctText = question.content || '';
      const correctWords = cleanText(correctText);
      const userWords = cleanText(answer.answer);

      userWords.forEach(word => {
        if (correctWords.includes(word)) {
          totalCorrect++;
        }
      });
      totalPossible += correctWords.length;
    }
  });

  return { correct: totalCorrect, total: totalPossible };
};

interface ScoreSummaryProps {
  score: QuestionScore;
  label: string;
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({ score, label }) => {
  return (
    <p>
      <span className="text-[#FFFFFF]">{label}:</span>
      <span className="text-[#fd7f33]">{score.correct}/{score.total}</span>
    </p>
  );
};
