export type QuestionType = 'readAloud' | 'rwfib' | 'rfib' | 'wfd';

export interface AudioSources {
  Brian?: string;
  Joanna?: string;
  Olivia?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  answer?: string;
  options?: string[] | Record<string, string[]>;
  correctAnswers?: string[];
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  taskNumber?: string;
  audio?: AudioSources;
  questionNumber?: number;
  text?: string;
  timer?: number;
  allOptions?: string[];
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  target: string;
}

export interface WFDQuestion {
  audio: AudioSources;
  createdAt: string;
  isHidden: boolean;
  occurrence: number;
  questionType: string;
  text: string;
}

import { Timestamp } from 'firebase/firestore';

export interface Answer {
  questionNumber: number;
  questionId: string;
  questionType: QuestionType;
  content: string;
  answer: string;
  text?: string;
  timer?: number;
  options?: string[] | Record<string, string[]>;
  allOptions?: string[];
  correctAnswers?: string[];
  timestamp: Timestamp;
}

export interface Submission {
  id: string;
  personalInfo: PersonalInfo;
  answers: Record<string, Answer>;
  notes?: string;
  timestamp: Timestamp;
  status: string;
}
