import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, startAfter, Timestamp, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Submission, Question } from '../types/placement-test';
import SubmissionsList from '../components/submissions/SubmissionsList';

// Number of submissions to load per page
const SUBMISSIONS_PER_PAGE = 20;

// Interface for props
interface SubmissionsIndexProps {
  initialSubmissions: Submission[];
  hasMore: boolean;
}

export default function SubmissionsIndex({ initialSubmissions, hasMore: initialHasMore }: SubmissionsIndexProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>(initialSubmissions);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(initialHasMore);

  // Set last visible document for pagination
  useEffect(() => {
    if (initialSubmissions.length > 0) {
      const fetchLastVisible = async () => {
        try {
          const submissionsQuery = query(
            collection(db, 'submissions'),
            orderBy('timestamp', 'desc'),
            limit(SUBMISSIONS_PER_PAGE)
          );
          
          const snapshot = await getDocs(submissionsQuery);
          if (!snapshot.empty) {
            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          }
        } catch (error) {
          console.error('Error fetching last visible document:', error);
        }
      };
      
      fetchLastVisible();
    }
  }, [initialSubmissions]);

  // Load more submissions when needed
  const loadMoreSubmissions = async () => {
    if (!lastVisible || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      const submissionsQuery = query(
        collection(db, 'submissions'),
        orderBy('timestamp', 'desc'),
        startAfter(lastVisible),
        limit(SUBMISSIONS_PER_PAGE)
      );
      
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      if (submissionsSnapshot.empty) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      // Update the last visible document
      setLastVisible(submissionsSnapshot.docs[submissionsSnapshot.docs.length - 1]);
      
      const newSubmissionsData = submissionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          personalInfo: data.personalInfo,
          timestamp: data.timestamp,
          notes: data.notes,
          status: data.status
        } as Submission;
      });
      
      // Append new submissions to existing ones
      setSubmissions(prev => [...prev, ...newSubmissionsData]);
      
      setLoadingMore(false);
    } catch (error) {
      console.error('Error loading more submissions:', error);
      setLoadingMore(false);
    }
  };

  // Filter submissions based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSubmissions(submissions);
      return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const filtered = submissions.filter(submission => {
      return (
        submission.personalInfo.fullName?.toLowerCase().includes(searchLower) ||
        submission.personalInfo.email?.toLowerCase().includes(searchLower) ||
        submission.id.toLowerCase().includes(searchLower) ||
        submission.notes?.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredSubmissions(filtered);
  }, [searchTerm, submissions]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#232323] flex flex-col items-center justify-center p-4">
        <div className="mb-6 sm:mb-8">
          <Image src="/logo1.png" alt="Logo" width={120} height={120} className="w-[100px] h-[100px] sm:w-[150px] sm:h-[150px]" priority />
        </div>
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 bg-[#232323] min-h-screen">
      <Head>
        <title>PTE Intensive Placement Test Submissions</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </Head>
      <div className="flex justify-center mb-6 sm:mb-8">
        <Image src="/logo1.png" alt="Logo" width={120} height={120} className="w-[100px] h-[100px] sm:w-[150px] sm:h-[150px]" priority />
      </div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[#fc5d01]">Student Submissions</h1>
      
      {submissions.length === 0 ? (
        <div className="text-[#fd7f33] text-center">No submissions found.</div>
      ) : (
        <div className="w-full max-w-6xl mx-auto">
          <SubmissionsList
            submissions={filteredSubmissions}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          
          {hasMore && filteredSubmissions.length === submissions.length && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMoreSubmissions}
                disabled={loadingMore}
                className={`px-4 py-2 rounded text-white ${
                  loadingMore
                    ? 'bg-[#ffac7b] cursor-not-allowed'
                    : 'bg-[#fc5d01] hover:bg-[#fd7f33]'
                }`}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to handle undefined values for serialization
const serializeData = (obj: any): any => {
  if (obj === undefined) {
    return null;
  }
  
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeData(item));
  }
  
  const result: any = {};
  Object.keys(obj).forEach(key => {
    result[key] = serializeData(obj[key]);
  });
  
  return result;
};

// Server-side rendering
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Initialize Firebase on the server
    const { db } = await import('../firebase');
    
    // Fetch initial submissions
    const submissionsQuery = query(
      collection(db, 'submissions'),
      orderBy('timestamp', 'desc'),
      limit(SUBMISSIONS_PER_PAGE)
    );
    
    const submissionsSnapshot = await getDocs(submissionsQuery);
    
    // Convert Firestore data to plain objects
    const initialSubmissions = submissionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        personalInfo: data.personalInfo || {},
        timestamp: {
          seconds: data.timestamp?.seconds || 0,
          nanoseconds: data.timestamp?.nanoseconds || 0
        },
        notes: data.notes || null,
        status: data.status || 'pending'
      };
    });
    
    // Check if there are more submissions
    const hasMore = submissionsSnapshot.size >= SUBMISSIONS_PER_PAGE;
    
    // Serialize the data to ensure it's JSON-compatible
    const serializedSubmissions = serializeData(initialSubmissions);
    
    return {
      props: {
        initialSubmissions: serializedSubmissions,
        hasMore
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialSubmissions: [],
        hasMore: false
      }
    };
  }
};
