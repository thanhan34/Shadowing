export type WordMatchStatus = "correct" | "missing" | "incorrect";

const removePunctuation = (value: string) =>
  value.replace(/[^a-z0-9\s]/gi, "");

const normalizeWords = (value: string) =>
  removePunctuation(value.toLowerCase())
    .split(/\s+/)
    .filter(Boolean);

const countWords = (words: string[]) =>
  words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

export interface ScoringResult {
  score: number;
  maxScore: number;
  incorrectCount: number;
  matchedCorrectCounts: Record<string, number>;
  correctWordCounts: Record<string, number>;
  normalizedCorrectWords: string[];
  normalizedInputWords: string[];
}

export type AnswerTokenStatus = "correct" | "incorrect" | "missing";

export interface AnswerToken {
  word: string;
  status: AnswerTokenStatus;
}

export const evaluateWriteFromDictation = (
  correctSentence: string,
  userAnswer: string
): ScoringResult => {
  const normalizedCorrectWords = normalizeWords(correctSentence);
  const normalizedInputWords = normalizeWords(userAnswer);
  const correctWordCounts = countWords(normalizedCorrectWords);
  const matchedCorrectCounts: Record<string, number> = {};

  let score = 0;

  normalizedInputWords.forEach((word) => {
    const allowedCount = correctWordCounts[word] || 0;
    const currentCount = matchedCorrectCounts[word] || 0;
    if (currentCount < allowedCount) {
      matchedCorrectCounts[word] = currentCount + 1;
      score += 1;
    }
  });

  const maxScore = normalizedCorrectWords.length;
  const incorrectCount = Math.max(maxScore - score, 0);

  return {
    score,
    maxScore,
    incorrectCount,
    matchedCorrectCounts,
    correctWordCounts,
    normalizedCorrectWords,
    normalizedInputWords
  };
};

export const mapInputWordStatuses = (
  normalizedInputWords: string[],
  correctWordCounts: Record<string, number>
) => {
  const matchedCounts: Record<string, number> = {};

  return normalizedInputWords.map((word) => {
    const allowedCount = correctWordCounts[word] || 0;
    const currentCount = matchedCounts[word] || 0;

    if (currentCount < allowedCount) {
      matchedCounts[word] = currentCount + 1;
      return { word, status: "correct" as WordMatchStatus };
    }

    return { word, status: "incorrect" as WordMatchStatus };
  });
};

export const buildAnswerTokensForDisplay = (
  normalizedCorrectWords: string[],
  normalizedInputWords: string[]
) => {
  const indexQueues = normalizedCorrectWords.reduce((acc, word, index) => {
    if (!acc[word]) {
      acc[word] = [];
    }
    acc[word].push(index);
    return acc;
  }, {} as Record<string, number[]>);

  const inputMatches = normalizedInputWords.map((word) => {
    const queue = indexQueues[word];
    if (queue && queue.length > 0) {
      return { word, status: "correct" as WordMatchStatus, correctIndex: queue.shift() as number };
    }

    return { word, status: "incorrect" as WordMatchStatus, correctIndex: null as number | null };
  });

  const missingIndices = Object.values(indexQueues)
    .flat()
    .sort((a, b) => a - b);

  const insertMap = new Map<number, string[]>();

  missingIndices.forEach((missingIndex) => {
    let insertPosition = -1;
    inputMatches.forEach((item, index) => {
      if (item.correctIndex !== null && item.correctIndex < missingIndex) {
        insertPosition = index;
      }
    });

    const list = insertMap.get(insertPosition) || [];
    list.push(normalizedCorrectWords[missingIndex]);
    insertMap.set(insertPosition, list);
  });

  const tokens: AnswerToken[] = [];
  const addMissing = (position: number) => {
    const list = insertMap.get(position);
    if (!list) {
      return;
    }
    list.forEach((word) => tokens.push({ word, status: "missing" }));
  };

  addMissing(-1);
  inputMatches.forEach((item, index) => {
    tokens.push({ word: item.word, status: item.status });
    addMissing(index);
  });

  return tokens;
};