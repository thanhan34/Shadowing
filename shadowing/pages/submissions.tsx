import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import { db, storage } from '../firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { PersonalInfo, Answer, Question, Submission } from '../types/placement-test';
import SubmissionsList from '../components/submissions/SubmissionsList';
import SubmissionDetail from '../components/submissions/SubmissionDetail';

interface AudioUrls {
  [key: string]: string;
}

export default function Submissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<AudioUrls>({});
  const [loadingAudio, setLoadingAudio] = useState<Record<string, boolean>>({});
  const [audioErrors, setAudioErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [questions, setQuestions] = useState<Record<string, Question>>({});

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        console.log('Starting to fetch submissions...');
        setError(null);
        
        const submissionsQuery = query(
          collection(db, 'submissions'),
          orderBy('timestamp', 'desc')
        );
        
        console.log('Fetching submissions from Firebase...');
        const submissionsSnapshot = await getDocs(submissionsQuery);
        console.log('Submissions fetched:', submissionsSnapshot.size, 'documents');
        
        const submissionsWithAnswers = await Promise.all(
          submissionsSnapshot.docs.map(async (submissionDoc) => {
            console.log('Processing submission:', submissionDoc.id);
            const submissionData = submissionDoc.data();
            
            const answersQuery = collection(doc(db, 'submissions', submissionDoc.id), 'answers');
            const answersSnapshot = await getDocs(answersQuery);
            console.log('Answers fetched for submission:', submissionDoc.id, answersSnapshot.size, 'answers');
            
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

            return {
              id: submissionDoc.id,
              personalInfo: submissionData.personalInfo,
              answers,
              notes: submissionData.notes,
              timestamp: submissionData.timestamp,
              status: submissionData.status
            } as Submission;
          })
        );

        console.log('Fetching questions...');
        const questionsSnapshot = await getDocs(collection(db, 'questions'));
        console.log('Questions fetched:', questionsSnapshot.size, 'documents');
        
        const questionsData: Record<string, Question> = {};
        
        questionsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log('Question data from Firestore:', {
            docId: doc.id,
            data: data,
            questionNumber: data.questionNumber,
            type: data.type,
            content: data.content,
            text: data.text,
            options: data.options,
            correctAnswers: data.correctAnswers,
            allFields: Object.keys(data)
          });
          
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

            // For RWFIB questions, ensure we have the question text and options
            if (isRWFIB) {
              console.log('Processing RWFIB question:', {
                questionNumber,
                rawContent: data.content,
                rawText: data.text,
                rawQuestionText: data.questionText,
                finalContent: processedQuestion.content,
                rawOptions: data.options,
                finalOptions: processedQuestion.options
              });
            }

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

        console.log('Questions data:', questionsData);
        setQuestions(questionsData);

        const urls: AudioUrls = {};
        for (const submission of submissionsWithAnswers) {
          for (const answer of Object.values(submission.answers)) {
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
        }

        console.log('Setting submissions:', submissionsWithAnswers.length, 'total submissions');
        setAudioUrls(urls);
        setSubmissions(submissionsWithAnswers);
        setFilteredSubmissions(submissionsWithAnswers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        if (error instanceof Error) {
          setError(`Error loading submissions: ${error.message}`);
        } else {
          setError('Error loading submissions. Please try refreshing the page.');
        }
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  useEffect(() => {
    const filtered = submissions.filter(submission => {
      const searchLower = searchTerm.toLowerCase();
      return (
        submission.personalInfo.fullName?.toLowerCase().includes(searchLower) ||
        submission.personalInfo.email?.toLowerCase().includes(searchLower) ||
        submission.id.toLowerCase().includes(searchLower) ||
        submission.notes?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredSubmissions(filtered);
  }, [searchTerm, submissions]);

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

  const getAudioUrl = (url: string) => {
    if (!url) return '';
    const finalUrl = audioUrls[url] || url;
    return finalUrl;
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
      
      setSubmissions(submissions.map(sub => 
        sub.id === submissionId ? { ...sub, notes } : sub
      ));
      setSelectedSubmission(prev => 
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
      setSubmissions(submissions.filter(sub => sub.id !== submissionId));
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(null);
      }
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
        <div className="text-[#fc5d01]">Loading submissions...</div>
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
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#232323] min-h-screen">
      <Head>
        <title>PTE Intensive Placement Test Submissions</title>
      </Head>
      <div className="flex justify-center mb-8">
        <Image src="/logo1.png" alt="Logo" width={150} height={150} priority />
      </div>
      <h1 className="text-2xl font-bold mb-6 text-[#fc5d01]">Student Submissions</h1>
      
      {submissions.length === 0 ? (
        <div className="text-[#fd7f33]">No submissions found.</div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          <SubmissionsList
            submissions={filteredSubmissions}
            selectedSubmissionId={selectedSubmission?.id || null}
            onSelectSubmission={(submission: Submission) => setSelectedSubmission(submission)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          <SubmissionDetail
            submission={selectedSubmission}
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
