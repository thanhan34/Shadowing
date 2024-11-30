import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { db, storage } from '../firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { PersonalInfo, Answer } from '../types/placement-test';

interface Submission {
  id: string;
  personalInfo: PersonalInfo;
  answers: Record<string, Answer>;
  notes?: string;
  timestamp: Timestamp;
  status: string;
}

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
  const [tempNotes, setTempNotes] = useState<string>('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<AudioUrls>({});
  const [loadingAudio, setLoadingAudio] = useState<Record<string, boolean>>({});
  const [audioErrors, setAudioErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

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
      setLoadingAudio(prev => ({ ...prev, [originalUrl]: true }));
      setAudioErrors(prev => ({ ...prev, [originalUrl]: '' }));

      const path = getStoragePath(originalUrl);
      if (path) {
        const audioRef = ref(storage, path);
        const url = await getDownloadURL(audioRef);
        setAudioUrls(prev => ({ ...prev, [originalUrl]: url }));
      }
    } catch (error) {
      console.error('Error retrying audio URL:', error);
      setAudioErrors(prev => ({ ...prev, [originalUrl]: 'Failed to load audio' }));
    } finally {
      setLoadingAudio(prev => ({ ...prev, [originalUrl]: false }));
    }
  };

  const renderAudioPlayer = (url: string) => {
    const audioUrl = getAudioUrl(url);
    const isLoading = loadingAudio[url];
    const error = audioErrors[url];

    return (
      <div className="mb-4 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#fc5d01]">Audio Response</span>
          {isLoading ? (
            <span className="text-sm text-[#fd7f33]">Loading...</span>
          ) : error ? (
            <button
              onClick={() => retryAudioUrl(url)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              {error} - Click to retry
            </button>
          ) : null}
        </div>
        {audioUrl && !error && (
          <audio 
            controls 
            src={audioUrl}
            className="w-full"
            preload="auto"
            onError={() => {
              console.error('Audio playback error:', url);
              setAudioErrors(prev => ({ ...prev, [url]: 'Failed to play audio' }));
            }}
          >
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
    );
  };

  const highlightAnswersInText = (text: string, answer: string, type: string) => {
    if (!text || !answer || (type !== 'RFIB' && type !== 'RWFIB')) {
      return text;
    }

    const answers = answer.split(',').map(a => a.trim());
    let highlightedText = text;

    answers.forEach(ans => {
      const regex = new RegExp(`(\\b${ans}\\b)`, 'gi');
      highlightedText = highlightedText.replace(regex, '<span class="bg-[#ffac7b] px-1 rounded">$1</span>');
    });

    return (
      <div dangerouslySetInnerHTML={{ __html: highlightedText }} />
    );
  };

  const renderAnswer = (questionId: string, answer: Answer) => {
    return (
      <div
        key={questionId}
        className="border border-gray-300 rounded-lg p-4 mb-4 bg-white shadow-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-[#fc5d01]">Question {questionId}</h4>
          <span className="text-sm text-white bg-orange-500 px-3 py-1 rounded-full">
            {answer.questionType}
          </span>
        </div>

        {answer.text && (
          <div className="mb-4">
            <p className="text-orange-600 font-semibold mb-2">Question Text:</p>
            <div className="p-3 text-black">
              {highlightAnswersInText(answer.text, answer.answer, answer.questionType)}
            </div>
          </div>
        )}

        {isFirebaseStorageUrl(answer.answer) ? (
          renderAudioPlayer(answer.answer)
        ) : (
          answer.answer && (
            <div className="mb-4">
              <p className="text-orange-600 font-semibold mb-2">Text Response:</p>
              <p className="p-3 text-black">
                {answer.answer}
              </p>
            </div>
          )
        )}
      </div>
    );
  };

  const saveNotes = async (submissionId: string) => {
    try {
      const submissionRef = doc(db, 'submissions', submissionId);
      await updateDoc(submissionRef, {
        notes: tempNotes
      });
      
      setSubmissions(submissions.map(sub => 
        sub.id === submissionId ? { ...sub, notes: tempNotes } : sub
      ));
      setSelectedSubmission(prev => 
        prev?.id === submissionId ? { ...prev, notes: tempNotes } : prev
      );
      setEditingNotes(null);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    }
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setError(null);
        
        const submissionsQuery = query(
          collection(db, 'submissions'),
          orderBy('timestamp', 'desc')
        );
        
        const submissionsSnapshot = await getDocs(submissionsQuery);
        
        const submissionsWithAnswers = await Promise.all(
          submissionsSnapshot.docs.map(async (submissionDoc) => {
            const submissionData = submissionDoc.data();
            
            const answersQuery = collection(doc(db, 'submissions', submissionDoc.id), 'answers');
            const answersSnapshot = await getDocs(answersQuery);
            
            const answers = answersSnapshot.docs.reduce((acc, answerDoc) => {
              const answerData = answerDoc.data() as Answer;
              acc[answerData.questionNumber.toString()] = answerData;
              return acc;
            }, {} as Record<string, Answer>);

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
                setAudioErrors(prev => ({ ...prev, [answer.answer]: 'Failed to load audio' }));
              }
            }
          }
        }

        setAudioUrls(urls);
        setSubmissions(submissionsWithAnswers);
        setFilteredSubmissions(submissionsWithAnswers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setError('Error loading submissions. Please try refreshing the page.');
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const deleteSubmission = async (submissionId: string) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    setDeleting(submissionId);
    try {
      const answersQuery = collection(doc(db, 'submissions', submissionId), 'answers');
      const answersSnapshot = await getDocs(answersQuery);
      await Promise.all(
        answersSnapshot.docs.map(answerDoc => 
          deleteDoc(doc(db, 'submissions', submissionId, 'answers', answerDoc.id))
        )
      );

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

  const formatDate = (timestamp: Timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp.toDate());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1e2e] flex flex-col items-center justify-center">
        <div className="mb-8">
          <Image src="/logo1.png" alt="Logo" width={150} height={150} priority />
        </div>
        <div className="text-[#fc5d01]">Loading submissions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1e1e2e] flex flex-col items-center justify-center">
        <div className="mb-8">
          <Image src="/logo1.png" alt="Logo" width={150} height={150} priority />
        </div>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const renderSubmissionsList = () => (
    <div className="w-full lg:w-1/6 pr-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search submissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded bg-[#1e1e2e] text-white border-[#fc5d01] focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
        />
      </div>
      <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {filteredSubmissions.map((submission) => (
          <div
            key={submission.id}
            onClick={() => setSelectedSubmission(submission)}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              selectedSubmission?.id === submission.id
                ? 'bg-[#fc5d01] text-white'
                : 'bg-[#2e2e4f] text-[#e0e0e0] hover:bg-[#3e3e5f]'
            }`}
          >
            <p className="font-semibold truncate">{submission.personalInfo.fullName}</p>
            <p className="text-sm opacity-75 truncate">{submission.personalInfo.email}</p>
            <p className="text-sm opacity-75">{formatDate(submission.timestamp)}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubmissionDetail = () => {
    if (!selectedSubmission) {
      return (
        <div className="w-full lg:w-5/6 p-4 bg-[#2e2e4f] rounded-lg text-[#e0e0e0]">
          Select a submission to view details
        </div>
      );
    }

    return (
      <div className="w-full lg:w-5/6 bg-[#2e2e4f] rounded-lg p-6 max-h-[calc(100vh-100px)] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#fc5d01]">Submission Details</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium text-[#e0e0e0]">Name: </span>
                <span className="text-[#e0e0e0]">{selectedSubmission.personalInfo.fullName}</span>
              </p>
              <p>
                <span className="font-medium text-[#e0e0e0]">Email: </span>
                <span className="text-[#e0e0e0]">{selectedSubmission.personalInfo.email}</span>
              </p>
              <p>
                <span className="font-medium text-[#e0e0e0]">Phone: </span>
                <span className="text-[#e0e0e0]">{selectedSubmission.personalInfo.phone}</span>
              </p>
              <p>
                <span className="font-medium text-[#e0e0e0]">Target Score: </span>
                <span className="text-[#e0e0e0]">{selectedSubmission.personalInfo.target}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[#fd7f33] mb-2">{formatDate(selectedSubmission.timestamp)}</p>
            <p className="text-sm text-[#fd7f33] mb-4">ID: {selectedSubmission.id}</p>
            <button
              onClick={() => deleteSubmission(selectedSubmission.id)}
              disabled={deleting === selectedSubmission.id}
              className={`px-4 py-2 rounded text-white ${
                deleting === selectedSubmission.id
                  ? 'bg-[#ffac7b] cursor-not-allowed'
                  : 'bg-[#fc5d01] hover:bg-[#fd7f33]'
              }`}
            >
              {deleting === selectedSubmission.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          {editingNotes === selectedSubmission.id ? (
            <div className="mt-4">
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                className="w-full p-2 border rounded bg-[#1e1e2e] text-white"
                rows={4}
                placeholder="Enter notes here..."
              />
              <div className="mt-2 space-x-2">
                <button
                  onClick={() => saveNotes(selectedSubmission.id)}
                  className="px-4 py-2 bg-[#fc5d01] text-white rounded hover:bg-[#fd7f33]"
                >
                  Save Notes
                </button>
                <button
                  onClick={() => {
                    setEditingNotes(null);
                    setTempNotes('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              {selectedSubmission.notes ? (
                <>
                  <p className="text-[#e0e0e0] mb-2">{selectedSubmission.notes}</p>
                  <button
                    onClick={() => {
                      setEditingNotes(selectedSubmission.id);
                      setTempNotes(selectedSubmission.notes || '');
                    }}
                    className="text-[#fc5d01] hover:text-[#fd7f33]"
                  >
                    Edit Notes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditingNotes(selectedSubmission.id);
                    setTempNotes('');
                  }}
                  className="text-[#fc5d01] hover:text-[#fd7f33]"
                >
                  Add Notes
                </button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[#fdbc94] pt-6">
          <h3 className="text-lg font-semibold mb-4 text-[#fc5d01]">Test Answers</h3>
          {Object.entries(selectedSubmission.answers).map(([questionId, answer]) => 
            renderAnswer(questionId, answer)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-[#1e1e2e] min-h-screen">
      <div className="flex justify-center mb-8">
        <Image src="/logo1.png" alt="Logo" width={150} height={150} priority />
      </div>
      <h1 className="text-2xl font-bold mb-6 text-[#fc5d01]">Student Submissions</h1>
      
      {submissions.length === 0 ? (
        <div className="text-[#fd7f33]">No submissions found.</div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {renderSubmissionsList()}
          {renderSubmissionDetail()}
        </div>
      )}
    </div>
  );
}
