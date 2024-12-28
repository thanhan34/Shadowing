import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { Submission } from '../../types/placement-test';

interface SubmissionsListProps {
  submissions: Submission[];
  selectedSubmissionId: string | null;
  onSelectSubmission: (submission: Submission) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const SubmissionsList: React.FC<SubmissionsListProps> = ({
  submissions,
  selectedSubmissionId,
  onSelectSubmission,
  searchTerm,
  onSearchChange,
}) => {
  const formatDate = (timestamp: Timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp.toDate());
  };

  return (
    <div className="w-full lg:w-1/6 pr-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search submissions..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full p-2 border rounded bg-[#232323] text-white border-[#fc5d01] focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
        />
      </div>
      <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            onClick={() => onSelectSubmission(submission)}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              selectedSubmissionId === submission.id
                ? 'bg-[#fc5d01] text-white'
                : 'bg-[#2b2b2b] text-[#FFFFFF] hover:bg-[#3e3e5f]'
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
};

export default SubmissionsList;
