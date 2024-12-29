import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Question, WFDQuestion as WFDQuestionType, QuestionType } from '../types/placement-test';

interface QuestionResponse {
  readAloudQuestions: Question[];
  rwfibQuestions: Question[];
  rfibQuestions: Question[];
  wfdQuestions: Question[];
}

export async function fetchQuestions(): Promise<QuestionResponse> {
  try {
    // Fetch read aloud questions
    const questionsRef = collection(db, 'questions');
    const questionsSnapshot = await getDocs(questionsRef);
    const fetchedQuestions = questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Question[];

    // Fetch WFD questions
    const wfdRef = collection(db, 'writefromdictation');
    const wfdSnapshot = await getDocs(wfdRef);
    const wfdQuestions = wfdSnapshot.docs
      .filter(doc => {
        const data = doc.data() as WFDQuestionType;
        return !data.isHidden;
      })
      .map(doc => {
        const data = doc.data() as WFDQuestionType;
        return {
          id: doc.id,
          type: 'wfd' as QuestionType,
          content: data.text,
          answer: data.text,
          audio: data.audio
        };
      });

    return {
      readAloudQuestions: fetchedQuestions.filter(q => q.type === 'readAloud'),
      rwfibQuestions: fetchedQuestions.filter(q => q.type === 'rwfib'),
      rfibQuestions: fetchedQuestions.filter(q => q.type === 'rfib'),
      wfdQuestions
    };
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch questions');
  }
}
