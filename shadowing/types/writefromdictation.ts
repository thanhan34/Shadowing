import { Timestamp } from "firebase/firestore";

export interface AudioSample {
  audio: { [key: string]: string };
  text: string;
  occurrence: number;
  createdAt: Timestamp;
  isHidden: boolean;
  questionType: string;
  vietnameseTranslation?: string;
  topic?: string;
}

export const DEFAULT_TOPICS = [
  "All",
  "Business & Work",
  "Education & Learning",
  "Technology & Science",
  "Daily Life & Routine",
  "Health & Medicine",
  "Travel & Tourism",
  "Food & Cooking",
  "Sports & Recreation",
  "Environment & Nature",
  "Arts & Humanities",
  "General"
];