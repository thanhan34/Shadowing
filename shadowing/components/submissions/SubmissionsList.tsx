import React, { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Submission } from '../../types/placement-test';
import Link from 'next/link';

interface SubmissionsListProps {
  submissions: Submission[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

// Debounce function to limit how often a function is called
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SubmissionsList: React.FC<SubmissionsListProps> = ({
  submissions,
  searchTerm,
  onSearchChange,
}) => {
  const [inputValue, setInputValue] = useState(searchTerm);
  const debouncedSearchTerm = useDebounce(inputValue, 300);

  // Update the search term when the debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearchChange]);

  const formatDate = (timestamp: Timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp.toDate());
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search submissions..."
          value={inputValue}
          onChange={handleSearchChange}
          className="w-full p-2 border rounded bg-[#232323] text-white border-[#fc5d01] focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
        />
      </div>
      
      {submissions.length === 0 && (
        <div className="text-center text-[#fd7f33] py-4">
          No submissions found matching your search.
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {submissions.map((submission) => (
          <Link 
            key={submission.id} 
            href={`/submissions/${submission.id}`}
            className="block p-3 sm:p-4 rounded-lg cursor-pointer transition-colors bg-[#2b2b2b] text-[#FFFFFF] hover:bg-[#3e3e5f]"
          >
            <p className="font-semibold truncate text-sm sm:text-base">{submission.personalInfo.fullName}</p>
            <p className="text-xs sm:text-sm opacity-75 truncate">{submission.personalInfo.email}</p>
            <p className="text-xs sm:text-sm opacity-75">{formatDate(submission.timestamp)}</p>
            {submission.notes && (
              <p className="mt-2 text-xs sm:text-sm text-[#fd7f33] truncate">
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
