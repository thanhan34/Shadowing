export type Essay = {
  id: string;
  title: string;
  question?: string; // Essay question/prompt
  questionLink?: string; // Link to the question source
  sampleEssayLink?: string; // Link to sample essay
  content: string; // Paragraphs separated by \n\n
  keywords: {
    slot: string;
    value: string;
  }[];
};

// Empty array - all essays will be custom added by users
export const mockEssays: Essay[] = [];
