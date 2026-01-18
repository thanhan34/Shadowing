export type Essay = {
  id: string;
  title: string;
  content: string; // Paragraphs separated by \n\n
  keywords: {
    slot: string;
    value: string;
  }[];
};

// Empty array - all essays will be custom added by users
export const mockEssays: Essay[] = [];
