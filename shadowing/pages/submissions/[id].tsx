import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { db, storage } from '../../firebase';
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { PersonalInfo, Answer, Question, Submission } from '../../types/placement-test';
import SubmissionDetail from '../../components/submissions/SubmissionDetail';
import Link from 'next/link';

interface AudioUrls {
  [key: string]: string;
}

interface SubmissionPageProps {
  initialSubmission: Submission | null;
  initialQuestions: Record<string, Question>;
  error: string | null;
}

export default function SubmissionPage({ initialSubmission, initialQuestions, error: initialError }: SubmissionPageProps) {
  const router = useRouter();
  const { id } = router.query;
  
  // Reconstruct Timestamp objects from serialized data
  const [submission, setSubmission] = useState<Submission | null>(() => 
    initialSubmission ? reconstructTimestamps(initialSubmission) as Submission : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<AudioUrls>({});
  const [loadingAudio, setLoadingAudio] = useState<Record<string, boolean>>({});
  const [audioErrors, setAudioErrors] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<Record<string, Question>>(() => 
    reconstructTimestamps(initialQuestions) as Record<string, Question>
  );

  // Fetch audio URLs
  useEffect(() => {
    const fetchAudioUrls = async () => {
      if (!submission) return;
      
      try {
        const urls: AudioUrls = {};
        const audioFetchPromises = [];
        
        // Prepare all audio fetch promises
        for (const answer of Object.values(submission.answers)) {
          if (answer.answer && isFirebaseStorageUrl(answer.answer)) {
            const path = getStoragePath(answer.answer);
            if (path) {
              const audioRef = ref(storage, path);
              audioFetchPromises.push(
                getDownloadURL(audioRef)
                  .then(url => {
                    urls[answer.answer] = url;
                  })
                  .catch(error => {
                    console.error('Error getting download URL for answer:', error);
                    setAudioErrors((prev: Record<string, string>) => ({ 
                      ...prev, 
                      [answer.answer]: 'Failed to load audio' 
                    }));
                  })
              );
            }
          }
        }
        
        // Execute all promises in parallel
        await Promise.allSettled(audioFetchPromises);
        setAudioUrls(urls);
      } catch (error) {
        console.error('Error fetching audio URLs:', error);
      }
    };

    fetchAudioUrls();
  }, [submission]);

  const isFirebaseStorageUrl = (str: string) => {
    if (!str) return false;
    try {
      const url = new URL(str);
      return url.hostname === 'firebasestorage.googleapis.com';
    } catch {
      return false;
    }
  };

  const getStoragePath = (url: string) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'firebasestorage.googleapis.com') {
        const pathMatch = url.match(/\/o\/(.*?)\?/);
        if (pathMatch && pathMatch[1]) {
          const path = decodeURIComponent(pathMatch[1]);
          return path;
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing URL:', url, error);
      return null;
    }
  };

  const retryAudioUrl = async (originalUrl: string) => {
    try {
      setLoadingAudio((prev: Record<string, boolean>) => ({ ...prev, [originalUrl]: true }));
      setAudioErrors((prev: Record<string, string>) => ({ ...prev, [originalUrl]: '' }));

      const path = getStoragePath(originalUrl);
      if (path) {
        const audioRef = ref(storage, path);
        const url = await getDownloadURL(audioRef);
        setAudioUrls((prev: AudioUrls) => ({ ...prev, [originalUrl]: url }));
      }
    } catch (error) {
      console.error('Error retrying audio URL:', error);
      setAudioErrors((prev: Record<string, string>) => ({ ...prev, [originalUrl]: 'Failed to load audio' }));
    } finally {
      setLoadingAudio((prev: Record<string, boolean>) => ({ ...prev, [originalUrl]: false }));
    }
  };

  const saveNotes = async (submissionId: string, notes: string) => {
    try {
      const submissionRef = doc(db, 'submissions', submissionId);
      await updateDoc(submissionRef, {
        notes: notes
      });
      
      setSubmission(prev => 
        prev?.id === submissionId ? { ...prev, notes } : prev
      );
      setEditingNotes(null);
      setTempNotes('');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    setDeleting(submissionId);
    try {
      await deleteDoc(doc(db, 'submissions', submissionId));
      router.push('/submissions');
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#232323] flex flex-col items-center justify-center p-4">
        <div className="mb-6 sm:mb-8">
          <Image src="/logo1.png" alt="Logo" width={120} height={120} className="w-[100px] h-[100px] sm:w-[150px] sm:h-[150px]" priority />
        </div>
        <div className="text-[#fc5d01] text-center">Loading submission...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#232323] flex flex-col items-center justify-center p-4">
        <div className="mb-6 sm:mb-8">
          <Image src="/logo1.png" alt="Logo" width={120} height={120} className="w-[100px] h-[100px] sm:w-[150px] sm:h-[150px]" priority />
        </div>
        <div className="text-red-600 text-center mb-4">{error}</div>
        <Link href="/submissions" className="mt-2 text-[#fc5d01] hover:text-[#fd7f33] text-sm sm:text-base">
          <span>←</span> Back to Submissions
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 bg-[#232323] min-h-screen">
      <Head>
        <title>Submission Details - PTE Intensive</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </Head>
      <div className="flex justify-center mb-6 sm:mb-8">
        <Image src="/logo1.png" alt="Logo" width={120} height={120} className="w-[100px] h-[100px] sm:w-[150px] sm:h-[150px]" priority />
      </div>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link href="/submissions" className="text-[#fc5d01] hover:text-[#fd7f33] text-sm sm:text-base mr-2">
            <span>←</span> Back
          </Link>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#fc5d01]">Submission Details</h1>
      </div>
      
      {submission && (
        <div className="w-full max-w-full">
          <SubmissionDetail
            submission={submission}
            questions={questions}
            editingNotes={editingNotes}
            deleting={deleting}
            audioUrls={audioUrls}
            loadingAudio={loadingAudio}
            audioErrors={audioErrors}
            onSaveNotes={saveNotes}
            onStartEditNotes={(id, notes) => {
              setEditingNotes(id);
              setTempNotes(notes);
            }}
            onCancelEditNotes={() => {
              setEditingNotes(null);
              setTempNotes('');
            }}
            onDeleteSubmission={deleteSubmission}
            onRetryAudio={retryAudioUrl}
          />
        </div>
      )}
    </div>
  );
}

// Helper function to convert Firestore timestamps to serializable objects and handle undefined values
const convertTimestamps = (obj: any): any => {
  if (obj === undefined) {
    return null;
  }
  
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Timestamp) {
    return {
      _seconds: obj.seconds,
      _nanoseconds: obj.nanoseconds,
      _isTimestamp: true
    };
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestamps(item));
  }

  const result: any = {};
  Object.keys(obj).forEach(key => {
    result[key] = convertTimestamps(obj[key]);
  });

  return result;
};

// Helper function to reconstruct Timestamps on the client
export const reconstructTimestamps = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (obj._isTimestamp) {
    return new Timestamp(obj._seconds, obj._nanoseconds);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => reconstructTimestamps(item));
  }

  const result: any = {};
  Object.keys(obj).forEach(key => {
    result[key] = reconstructTimestamps(obj[key]);
  });

  return result;
};

// Server-side rendering
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  
  try {
    // Initialize Firebase on the server
    const { db } = await import('../../firebase');
    
    // Get the submission document
    const submissionDoc = await getDoc(doc(db, 'submissions', id));
    
    if (!submissionDoc.exists()) {
      return {
        props: {
          initialSubmission: null,
          initialQuestions: {},
          error: 'Submission not found'
        }
      };
    }
    
    const submissionData = submissionDoc.data();
    
    // Get the answers subcollection
    const answersQuery = collection(doc(db, 'submissions', id), 'answers');
    const answersSnapshot = await getDocs(answersQuery);
    
    // Initialize answers object with empty answers for all question numbers
    const answers: Record<string, any> = {};
    for (let i = 1; i <= 12; i++) {
      answers[i.toString()] = {
        questionNumber: i,
        questionId: i.toString(),
        questionType: i <= 3 ? 'readAloud' : 
                    i <= 6 ? 'rwfib' :
                    i <= 9 ? 'rfib' : 'wfd',
        content: '',
        answer: '',
        timestamp: Timestamp.now()
      };
    }

    // Merge in any actual answers we have
    answersSnapshot.docs.forEach(answerDoc => {
      const answerData = answerDoc.data();
      answers[answerData.questionNumber.toString()] = answerData;
    });

    const submissionWithAnswers = {
      id: submissionDoc.id,
      personalInfo: submissionData.personalInfo || {},
      answers,
      notes: submissionData.notes || null,
      timestamp: submissionData.timestamp || Timestamp.now(),
      status: submissionData.status || 'pending'
    };

    // Fetch questions
    const questionsSnapshot = await getDocs(collection(db, 'questions'));
    
    const questionsData: Record<string, any> = {};
    
    questionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // First try to get question number from the data
      let questionNumber = data.questionNumber?.toString();
      
      // If no question number in data, try to parse it from the document ID
      if (!questionNumber && /^\d+$/.test(doc.id)) {
        questionNumber = doc.id;
      }
      
      // If we have a valid question number, process the question
      if (questionNumber) {
        const isRWFIB = data.type === 'rwfib';
        const processedQuestion = {
          ...data,
          id: doc.id,
          type: data.type,
          content: data.content || data.text || data.questionText || '',
          options: isRWFIB ? data.options || [] : data.options || {},
          correctAnswers: data.correctAnswers || [],
          questionNumber: parseInt(questionNumber)
        };

        questionsData[questionNumber] = processedQuestion;
      }
    });

    // Ensure we have entries for questions 1-12
    for (let i = 1; i <= 12; i++) {
      const questionNum = i.toString();
      if (!questionsData[questionNum]) {
        questionsData[questionNum] = {
          id: questionNum,
          type: i <= 3 ? 'readAloud' : 
                i <= 6 ? 'rwfib' :
                i <= 9 ? 'rfib' : 'wfd',
          content: '',
          options: {},
          correctAnswers: [],
          questionNumber: i
        };
      }
    }
    
    // Convert Firestore timestamps to serializable objects
    const serializedSubmission = convertTimestamps(submissionWithAnswers);
    const serializedQuestions = convertTimestamps(questionsData);
    
    return {
      props: {
        initialSubmission: serializedSubmission,
        initialQuestions: serializedQuestions,
        error: null
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialSubmission: null,
        initialQuestions: {},
        error: 'Error loading submission. Please try refreshing the page.'
      }
    };
  }
};
