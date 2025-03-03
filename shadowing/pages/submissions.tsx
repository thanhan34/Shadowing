import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { Submission, Question } from '../types/placement-test';
import SubmissionsList from '../components/submissions/SubmissionsList';

export default function SubmissionsIndex() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        console.log('Starting to fetch submissions...');
        setError(null);
        
        const submissionsQuery = query(
          collection(db, 'submissions'),
          orderBy('timestamp', 'desc')
        );
        
        const submissionsSnapshot = await getDocs(submissionsQuery);
        console.log('Submissions fetched:', submissionsSnapshot.size, 'documents');
        
        const submissionsData = submissionsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            personalInfo: data.personalInfo,
            timestamp: data.timestamp,
            notes: data.notes,
            status: data.status
          } as Submission;
        });

        setSubmissions(submissionsData);
        setFilteredSubmissions(submissionsData);
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
        <div className="w-full max-w-6xl mx-auto">
          <SubmissionsList
            submissions={filteredSubmissions}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
      )}
    </div>
  );
}
