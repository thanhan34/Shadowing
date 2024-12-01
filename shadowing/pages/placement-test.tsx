import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Question, PersonalInfo, WFDQuestion as WFDQuestionType, Answer } from '../types/placement-test';
import PersonalInfoForm from '../components/placement-test/PersonalInfo';
import QuestionProgress from '../components/placement-test/QuestionProgress';
import ReadAloudQuestion from '../components/placement-test/ReadAloudQuestion';
import RWFIBQuestion from '../components/placement-test/RWFIBQuestion';
import RFIBQuestion from '../components/placement-test/RFIBQuestion';
import WFDQuestion from '../components/placement-test/WFDQuestion';
import { getRandomItems } from '../utils/questionUtils';
import Head from "next/head"

const QUESTIONS_PER_TYPE = 3;

const PlacementTest: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prepTimer, setPrepTimer] = useState<number | null>(null);
  const [recordTimer, setRecordTimer] = useState<number | null>(null);
  const [isPrepping, setIsPrepping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPhase, setIsRecordingPhase] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const [availableOptions, setAvailableOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '',
    email: '',
    phone: '',
    target: '',
  });
  const router = useRouter();
  const mounted = useRef(true);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const processingRecordingRef = useRef<Promise<void> | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    let isMounted = true;

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        const questionsRef = collection(db, 'questions');
        const questionsSnapshot = await getDocs(questionsRef);
        if (!isMounted) return;
        
        const fetchedQuestions = questionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Question[];

        const wfdRef = collection(db, 'writefromdictation');
        const wfdSnapshot = await getDocs(wfdRef);
        if (!isMounted) return;
        
        const wfdQuestions = wfdSnapshot.docs
          .filter(doc => {
            const data = doc.data() as WFDQuestionType;
            return !data.isHidden;
          })
          .map(doc => {
            const data = doc.data() as WFDQuestionType;
            return {
              id: doc.id,
              type: 'wfd' as const,
              content: data.text,
              answer: data.text,
              audio: data.audio
            };
          });

        const readAloudQuestions = getRandomItems(
          fetchedQuestions.filter(q => q.type === 'readAloud'),
          QUESTIONS_PER_TYPE
        ).map((q, index) => ({ ...q, questionNumber: index + 1, text: q.content }));

        const rwfibQuestions = getRandomItems(
          fetchedQuestions.filter(q => q.type === 'rwfib'),
          QUESTIONS_PER_TYPE
        ).map((q, index) => ({ ...q, questionNumber: index + 4 }));

        const rfibQuestions = getRandomItems(
          fetchedQuestions.filter(q => q.type === 'rfib'),
          QUESTIONS_PER_TYPE
        ).map((q, index) => ({ ...q, questionNumber: index + 7 }));

        const randomWfdQuestions = getRandomItems(wfdQuestions, QUESTIONS_PER_TYPE)
          .map((q, index) => ({ ...q, questionNumber: index + 10 }));

        if (!isMounted) return;

        const sortedQuestions = [
          ...readAloudQuestions,
          ...rwfibQuestions,
          ...rfibQuestions,
          ...randomWfdQuestions
        ];

        setQuestions(sortedQuestions);
        setLoading(false);
      } catch (error) {
        console.error('Error in fetchQuestions:', error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to fetch questions');
          setLoading(false);
        }
      }
    };

    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (currentQuestion) {
      if (currentQuestion.type === 'rwfib' || currentQuestion.type === 'rfib') {
        const options = currentQuestion.options;
        if (Array.isArray(options)) {
          setAvailableOptions(options);
        } else if (options && typeof options === 'object') {
          setAvailableOptions(Object.values(options).flat());
        } else {
          setAvailableOptions([]);
        }
      }

      if (currentQuestion.type === 'readAloud') {
        setPrepTimer(35);
        setIsPrepping(true);
      }
    }
  }, [currentQuestion]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPrepping && prepTimer !== null && prepTimer > 0) {
      interval = setInterval(() => {
        setPrepTimer(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (isPrepping && prepTimer === 0) {
      startRecordingPhase();
    }

    if (isRecordingPhase && recordTimer !== null && recordTimer > 0) {
      interval = setInterval(() => {
        setRecordTimer(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (isRecordingPhase && recordTimer === 0) {
      stopRecording();
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPrepping, prepTimer, isRecordingPhase, recordTimer]);

  const handlePersonalInfoChange = (field: keyof PersonalInfo) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setPersonalInfo((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const resetTest = () => {
    setCurrentQuestionIndex(-1);
    setUserAnswers({});
    setTimer(0);
    setIsRecording(false);
    setIsRecordingPhase(false);
    setIsPrepping(false);
    setPrepTimer(null);
    setRecordTimer(null);
    setIsSubmitting(false);
    audioChunksRef.current = [];
    processingRecordingRef.current = null;
  };

  const handleStartTest = () => {
    if (!personalInfo.fullName || !personalInfo.email || !personalInfo.phone || !personalInfo.target) {
      alert('Please fill in all personal information fields');
      return;
    }
    resetTest();
    setCurrentQuestionIndex(0);
  };

  const handleAnswerChange = (answer: string) => {
    if (currentQuestion) {
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answer,
      }));
    }
  };

  const handleRFIBAnswerChange = (index: number, value: string) => {
    if (!currentQuestion) return;

    setUserAnswers(prev => {
      const newAnswers = { ...prev };
      Object.entries(newAnswers).forEach(([key, existingValue]) => {
        const [questionId, position] = key.split('_');
        if (questionId === currentQuestion.id && existingValue === value) {
          delete newAnswers[key];
        }
      });
      const answerKey = `${currentQuestion.id}_${index}`;
      return {
        ...newAnswers,
        [answerKey]: value
      };
    });
  };

  const getCurrentQuestionAnswers = () => {
    if (!currentQuestion) return {};

    const answers: Record<number, string> = {};
    Object.entries(userAnswers).forEach(([key, value]) => {
      const [questionId, indexStr] = key.split('_');
      if (questionId === currentQuestion.id) {
        answers[parseInt(indexStr)] = value;
      }
    });
    return answers;
  };

  const formatRFIBAnswers = (questionId: string): string => {
    const maxBlanks = 10;
    const answers: string[] = new Array(maxBlanks).fill('');
    
    Object.entries(userAnswers).forEach(([key, value]) => {
      const [qId, indexStr] = key.split('_');
      if (qId === questionId) {
        const index = parseInt(indexStr);
        if (!isNaN(index) && index < maxBlanks) {
          answers[index] = value;
        }
      }
    });
    
    while (answers.length > 0 && answers[answers.length - 1] === '') {
      answers.pop();
    }
    
    return answers.join(',');
  };

  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);

      const submissionRef = await addDoc(collection(db, 'submissions'), {
        personalInfo,
        timestamp: new Date(),
        status: 'completed'
      });

      const answersCollection = collection(doc(db, 'submissions', submissionRef.id), 'answers');

      for (const question of questions) {
        if (!question.questionNumber) continue;

        let formattedAnswer: string | undefined;
        let text: string | undefined;

        if (question.type === 'rwfib') {
          const questionAnswers: { index: number; value: string }[] = [];
          Object.entries(userAnswers).forEach(([key, value]) => {
            const [questionId, indexStr] = key.split('_');
            if (questionId === question.id && !key.startsWith('preview_')) {
              questionAnswers.push({
                index: parseInt(indexStr),
                value: value
              });
            }
          });

          formattedAnswer = questionAnswers
            .sort((a, b) => a.index - b.index)
            .map(answer => answer.value)
            .join(',');
          
          text = question.content;
        } else if (question.type === 'readAloud') {
          formattedAnswer = userAnswers[question.id];
          text = question.content;
        } else if (question.type === 'rfib') {
          formattedAnswer = formatRFIBAnswers(question.id);
          text = question.content;
        } else if (question.type === 'wfd') {
          formattedAnswer = userAnswers[question.id];
          text = question.content || question.answer;
        }

        if (!formattedAnswer) continue;
        if (!text) {
          text = question.content || question.answer || '';
        }

        const baseAnswerData = {
          questionNumber: question.questionNumber,
          questionId: question.id,
          questionType: question.type,
          content: question.content || '',
          answer: formattedAnswer,
          text: text,
          timer: question.type === 'readAloud' ? 40 : timer,
        };

        let answerData: Omit<Answer, 'timestamp'>;
        if (question.type === 'rwfib' || question.type === 'rfib') {
          answerData = {
            ...baseAnswerData,
            options: question.options || [],
            allOptions: question.type === 'rwfib' && typeof question.options === 'object' && !Array.isArray(question.options)
              ? Object.values(question.options).flat()
              : (question.options as string[]) || []
          };
        } else {
          answerData = baseAnswerData;
        }

        await addDoc(answersCollection, {
          ...answerData,
          timestamp: new Date()
        });
      }
      
      router.push('/test-complete');
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Error submitting test. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive' && currentQuestion?.type === 'readAloud') {
        // Create a promise that resolves when the recording is processed
        processingRecordingRef.current = new Promise<void>((resolve, reject) => {
          const currentMediaRecorder = mediaRecorder;
          const originalOnStop = currentMediaRecorder.onstop;
          
          currentMediaRecorder.onstop = async (event) => {
            try {
              if (originalOnStop) {
                await originalOnStop.call(currentMediaRecorder, event);
              }
              resolve();
            } catch (error) {
              reject(error);
            }
          };
        });

        stopRecording();
        
        // Wait for the recording to be processed
        await processingRecordingRef.current;
      }

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTimer(0);
        setIsRecording(false);
        setIsRecordingPhase(false);
        setIsPrepping(false);
        setPrepTimer(null);
        setRecordTimer(null);
        audioChunksRef.current = [];
        processingRecordingRef.current = null;
      } else {
        if (!isSubmitting) {
          handleSubmitTest();
        }
      }
    } catch (error) {
      console.error('Error in handleNextQuestion:', error);
      alert('Error processing recording. Please try again.');
    }
  };

  const startRecordingPhase = () => {
    setIsPrepping(false);
    setPrepTimer(null);
    setRecordTimer(40);
    setIsRecordingPhase(true);
    startRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ].find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
      
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        bitsPerSecond: 128000
      });

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          if (audioChunksRef.current.length === 0) {
            console.error('No audio data collected');
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          const previewUrl = URL.createObjectURL(audioBlob);
          if (currentQuestion) {
            const previewKey = `preview_${currentQuestion.id}`;
            setUserAnswers(prev => ({
              ...prev,
              [previewKey]: previewUrl,
            }));
          }

          if (!currentQuestion) {
            console.error('No current question found');
            return;
          }

          const timestamp = Date.now();
          const filename = `placement_test_ra_${currentQuestion.questionNumber}_${timestamp}${mimeType.includes('webm') ? '.webm' : mimeType.includes('mp4') ? '.mp4' : '.ogg'}`;
          const storageRef = ref(storage, `placement_test_recordings/${filename}`);
          
          const uploadTask = await uploadBytes(storageRef, audioBlob);
          const downloadUrl = await getDownloadURL(storageRef);

          setUserAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: downloadUrl
          }));
          
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error('Error in recorder.onstop:', error);
          alert('Error saving recording. Please try again.');
        }
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error in startRecording:', error);
      alert('Error accessing microphone. Please ensure microphone permissions are granted and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsRecordingPhase(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#232323] flex flex-col items-center justify-center">
        <div className="text-[#fc5d01] text-xl mb-4">Loading questions...</div>
        <div className="w-16 h-16 border-t-4 border-[#fc5d01] border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#232323] flex flex-col items-center justify-center">
        <div className="text-[#fc5d01] text-xl mb-4">Error loading questions:</div>
        <div className="text-[#fd7f33]">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#fc5d01] text-white rounded hover:bg-[#fd7f33]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#232323] flex items-center justify-center">
        <div className="text-[#fc5d01] text-xl">No questions available. Please add questions in the manage questions page.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#232323] py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>PTE Intensive Placement Test</title>
      </Head>
      <div className="max-w-8xl mx-auto">
        {currentQuestionIndex === -1 ? (
          <PersonalInfoForm
            personalInfo={personalInfo}
            onInfoChange={handlePersonalInfoChange}
            onStartTest={handleStartTest}
          />
        ) : (
          <div className="bg-red rounded-lg shadow-lg p-6">
            <QuestionProgress
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
            />

            {currentQuestion && (
              <>
                {currentQuestion.type === 'readAloud' && (
                  <ReadAloudQuestion
                    content={currentQuestion.content}
                    timer={timer}
                    isPrepping={isPrepping}
                    prepTimer={prepTimer}
                    isRecordingPhase={isRecordingPhase}
                    recordTimer={recordTimer}
                    isRecording={isRecording}
                    userAnswer={userAnswers[`preview_${currentQuestion.id}`]}
                    onNext={handleNextQuestion}
                    isLastQuestion={currentQuestionIndex === questions.length - 1}
                  />
                )}

                {currentQuestion.type === 'rwfib' && (
                  <RWFIBQuestion
                    content={currentQuestion.content}
                    timer={timer}
                    availableOptions={availableOptions}
                    userAnswers={userAnswers}
                    onAnswerChange={handleRFIBAnswerChange}
                    onNext={handleNextQuestion}
                    isLastQuestion={currentQuestionIndex === questions.length - 1}
                    questionId={currentQuestion.id}
                  />
                )}

                {currentQuestion.type === 'rfib' && (
                  <RFIBQuestion
                    content={currentQuestion.content}
                    timer={timer}
                    availableOptions={availableOptions}
                    userAnswers={getCurrentQuestionAnswers()}
                    onDrop={handleRFIBAnswerChange}
                    onNext={handleNextQuestion}
                    isLastQuestion={currentQuestionIndex === questions.length - 1}
                  />
                )}

                {currentQuestion.type === 'wfd' && currentQuestion.audio && (
                  <WFDQuestion
                    audio={currentQuestion.audio}
                    timer={timer}
                    userAnswer={userAnswers[currentQuestion.id] || ''}
                    onAnswerChange={handleAnswerChange}
                    onNext={handleNextQuestion}
                    isLastQuestion={currentQuestionIndex === questions.length - 1}
                    questionKey={currentQuestion.id}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlacementTest;
