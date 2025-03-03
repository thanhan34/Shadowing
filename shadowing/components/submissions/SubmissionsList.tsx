import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { Submission } from '../../types/placement-test';
import Link from 'next/link';

interface SubmissionsListProps {
  submissions: Submission[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const SubmissionsList: React.FC<SubmissionsListProps> = ({
  submissions,
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
    <div className="w-full">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search submissions..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full p-2 border rounded bg-[#232323] text-white border-[#fc5d01] focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {submissions.map((submission) => (
          <Link 
            key={submission.id} 
            href={`/submissions/${submission.id}`}
            className="block p-4 rounded-lg cursor-pointer transition-colors bg-[#2b2b2b] text-[#FFFFFF] hover:bg-[#3e3e5f]"
          >
            <p className="font-semibold truncate">{submission.personalInfo.fullName}</p>
            <p className="text-sm opacity-75 truncate">{submission.personalInfo.email}</p>
            <p className="text-sm opacity-75">{formatDate(submission.timestamp)}</p>
            {submission.notes && (
              <p className="mt-2 text-sm text-[#fd7f33] truncate">
                Notes: {submission.notes}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SubmissionsList;
