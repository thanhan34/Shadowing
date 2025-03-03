import React from 'react';
import Image from 'next/image';
import { Timestamp } from 'firebase/firestore';
import { Submission, Question } from '../../types/placement-test';
import NotesEditor from './NotesEditor';
import AnswerCard from './AnswerCard';
import { 
  calculateRWFIBScore, 
  calculateRFIBScore, 
  calculateWFDScore,
  ScoreSummary 
} from './ScoreCalculator';

interface SubmissionDetailProps {
  submission: Submission | null;
  questions: Record<string, Question>;
  editingNotes: string | null;
  deleting: string | null;
  audioUrls: Record<string, string>;
  loadingAudio: Record<string, boolean>;
  audioErrors: Record<string, string>;
  onSaveNotes: (submissionId: string, notes: string) => Promise<void>;
  onStartEditNotes: (submissionId: string, initialNotes: string) => void;
  onCancelEditNotes: () => void;
  onDeleteSubmission: (submissionId: string) => Promise<void>;
  onRetryAudio: (url: string) => Promise<void>;
}

const SubmissionDetail: React.FC<SubmissionDetailProps> = ({
  submission,
  questions,
  editingNotes,
  deleting,
  audioUrls,
  loadingAudio,
  audioErrors,
  onSaveNotes,
  onStartEditNotes,
  onCancelEditNotes,
  onDeleteSubmission,
  onRetryAudio,
}) => {
  if (!submission) {
    return (
      <div className="w-full lg:w-5/6 p-4 bg-[#2b2b2b] rounded-lg text-[#FFFFFF]">
        Select a submission to view details
      </div>
    );
  }

  const formatDate = (timestamp: any) => {
    try {
      // Check if it's a Firestore Timestamp object
      if (timestamp && typeof timestamp.toDate === 'function') {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(timestamp.toDate());
      }
      
      // Check if it's our serialized timestamp format
      if (timestamp && timestamp._isTimestamp) {
        const date = new Date(timestamp._seconds * 1000);
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      }
      
      // If it's a date object
      if (timestamp instanceof Date) {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(timestamp);
      }
      
      // Fallback
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-4 text-[#fc5d01]">Submission Details</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium text-[#FFFFFF]">Name: </span>
              <span className="text-[#FFFFFF] break-words">{submission.personalInfo.fullName}</span>
            </p>
            <p>
              <span className="font-medium text-[#FFFFFF]">Email: </span>
              <span className="text-[#FFFFFF] break-words">{submission.personalInfo.email}</span>
            </p>
            <p>
              <span className="font-medium text-[#FFFFFF]">Phone: </span>
              <span className="text-[#FFFFFF] break-words">{submission.personalInfo.phone}</span>
            </p>
            <p>
              <span className="font-medium text-[#FFFFFF]">Target Score: </span>
              <span className="text-[#FFFFFF]">{submission.personalInfo.target}</span>
            </p>
          </div>
        </div>
        <div className="md:text-right">
          <p className="text-[#fd7f33] mb-2">{formatDate(submission.timestamp)}</p>
          <p className="text-sm text-[#fd7f33] mb-4">ID: {submission.id}</p>
          <button
            onClick={() => onDeleteSubmission(submission.id)}
            disabled={deleting === submission.id}
            className={`px-4 py-2 rounded text-white ${
              deleting === submission.id
                ? 'bg-[#ffac7b] cursor-not-allowed'
                : 'bg-[#fc5d01] hover:bg-[#fd7f33]'
            }`}
          >
            {deleting === submission.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <NotesEditor
          submissionId={submission.id}
          initialNotes={submission.notes || ''}
          isEditing={editingNotes === submission.id}
          onSave={onSaveNotes}
          onStartEdit={() => onStartEditNotes(submission.id, submission.notes || '')}
          onCancelEdit={onCancelEditNotes}
        />
      </div>

      <div className="pt-4 sm:pt-6">
        <div className="bg-[#242424] p-4 sm:p-6 rounded mb-6">
          <h3 className="text-xl font-semibold mb-4 text-[#fc5d01]">Summary</h3>
          <div className="space-y-2">
            <div className="text-[#FFFFFF] space-y-2">
              <ScoreSummary 
                label="Reading Writing Fill In The Blank" 
                score={calculateRWFIBScore(submission, questions)} 
              />
              <ScoreSummary 
                label="Reading Fill In The Blank" 
                score={calculateRFIBScore(submission, questions)} 
              />
              <ScoreSummary 
                label="Write From Dictation" 
                score={calculateWFDScore(submission, questions)} 
              />
              {(() => {
                const rwfibScore = calculateRWFIBScore(submission, questions);
                const rfibScore = calculateRFIBScore(submission, questions);
                const wfdScore = calculateWFDScore(submission, questions);
                return (
                  <ScoreSummary 
                    label="Total" 
                    score={{
                      correct: rwfibScore.correct + rfibScore.correct + wfdScore.correct,
                      total: rwfibScore.total + rfibScore.total + wfdScore.total
                    }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-semibold mb-6 text-[#fc5d01]">Test Answers</h3>
        {Object.entries(submission.answers).map(([questionId, answer]) => (
          <AnswerCard
            key={questionId}
            questionId={questionId}
            answer={answer}
            question={questions[questionId]}
            audioUrl={audioUrls[answer.answer]}
            isLoadingAudio={loadingAudio[answer.answer]}
            audioError={audioErrors[answer.answer]}
            onRetryAudio={onRetryAudio}
          />
        ))}
      </div>
    </div>
  );
};

export default SubmissionDetail;
