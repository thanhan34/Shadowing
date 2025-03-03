import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { db, storage } from '../../firebase';
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { PersonalInfo, Answer, Question, Submission } from '../../types/placement-test';
import SubmissionDetail from '../../components/submissions/SubmissionDetail';
import Link from 'next/link';

interface AudioUrls {
  [key: string]: string;
}

export default function SubmissionPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<AudioUrls>({});
  const [loadingAudio, setLoadingAudio] = useState<Record<string, boolean>>({});
  const [audioErrors, setAudioErrors] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<Record<string, Question>>({});

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!id) return;
      
      try {
        console.log('Starting to fetch submission:', id);
        setError(null);
        
        // Get the submission document
        const submissionDoc = await getDoc(doc(db, 'submissions', id as string));
        
        if (!submissionDoc.exists()) {
          setError('Submission not found');
          setLoading(false);
          return;
        }
        
        const submissionData = submissionDoc.data();
        
        // Get the answers subcollection
        const answersQuery = collection(doc(db, 'submissions', id as string), 'answers');
        const answersSnapshot = await getDocs(answersQuery);
        
        // Initialize answers object with empty answers for all question numbers
        const answers: Record<string, Answer> = {};
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
          const answerData = answerDoc.data() as Answer;
          answers[answerData.questionNumber.toString()] = answerData;
        });

        const submissionWithAnswers = {
          id: submissionDoc.id,
          personalInfo: submissionData.personalInfo,
          answers,
          notes: submissionData.notes,
          timestamp: submissionData.timestamp,
          status: submissionData.status
        } as Submission;

        // Fetch questions
        const questionsSnapshot = await getDocs(collection(db, 'questions'));
        
        const questionsData: Record<string, Question> = {};
        
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
            } as Question;

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
            } as Question;
          }
        }

        setQuestions(questionsData);

        // Get audio URLs
        const urls: AudioUrls = {};
        for (const answer of Object.values(submissionWithAnswers.answers)) {
          if (answer.answer && isFirebaseStorageUrl(answer.answer)) {
            try {
              const path = getStoragePath(answer.answer);
              if (path) {
                const audioRef = ref(storage, path);
                const url = await getDownloadURL(audioRef);
                urls[answer.answer] = url;
              }
            } catch (error) {
              console.error('Error getting download URL for answer:', error);
              setAudioErrors((prev: Record<string, string>) => ({ ...prev, [answer.answer]: 'Failed to load audio' }));
            }
          }
        }

        setAudioUrls(urls);
        setSubmission(submissionWithAnswers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching submission:', error);
        if (error instanceof Error) {
          setError(`Error loading submission: ${error.message}`);
        } else {
          setError('Error loading submission. Please try refreshing the page.');
        }
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id]);

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
      <div className="min-h-screen bg-[#232323] flex flex-col items-center justify-center">
        <div className="mb-8">
          <Image src="/logo1.png" alt="Logo" width={150} height={150} priority />
        </div>
        <div className="text-[#fc5d01]">Loading submission...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#232323] flex flex-col items-center justify-center">
        <div className="mb-8">
          <Image src="/logo1.png" alt="Logo" width={150} height={150} priority />
        </div>
        <div className="text-red-600">{error}</div>
        <Link href="/submissions" className="mt-4 text-[#fc5d01] hover:text-[#fd7f33]">
          Back to Submissions
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#232323] min-h-screen">
      <Head>
        <title>Submission Details - PTE Intensive</title>
      </Head>
      <div className="flex justify-center mb-8">
        <Image src="/logo1.png" alt="Logo" width={150} height={150} priority />
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#fc5d01]">Submission Details</h1>
        <Link href="/submissions" className="text-[#fc5d01] hover:text-[#fd7f33]">
          Back to All Submissions
        </Link>
      </div>
      
      {submission && (
        <div className="w-full">
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
