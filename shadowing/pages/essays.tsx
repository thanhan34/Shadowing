import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '../components/Navigation';
import { getNextImage } from '../utils/background';
import { mockEssays, Essay } from '../data/mockEssays';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const EssaysListPage: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState('');
  const [allEssays, setAllEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBackgroundImage(getNextImage());
    loadEssays();
  }, []);

  const loadEssays = async () => {
    try {
      const essaysCollection = collection(db, 'essays');
      const essaysSnapshot = await getDocs(essaysCollection);
      const essaysList = essaysSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Essay[];
      
      setAllEssays(essaysList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading essays:', error);
      setLoading(false);
    }
  };

  return (
    <main
      className="bg-cover bg-center bg-fixed flex mx-auto min-h-screen flex-col items-center w-full p-4 sm:p-6 space-y-5 backdrop-blur-lg"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Head>
        <title>Essay Library - PTE Writing Practice</title>
        <meta
          name="description"
          content="Browse our collection of PTE essay samples with keyword highlighting for effective writing practice."
        />
        <meta name="keywords" content="PTE essays, writing practice, essay library, PTE training" />
        <meta name="author" content="PTE Intensive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <Link href="/" className="flex justify-center">
        <Image
          src="/logo1.png"
          alt="Logo"
          width={150}
          height={150}
          className="sm:w-40 sm:h-40 lg:w-48 lg:h-48"
        />
      </Link>

      <h1 className="mb-2 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-600 dark:text-white">
        ESSAY LIBRARY
      </h1>

      <p className="text-center text-gray-600 dark:text-white mb-4 max-w-2xl">
        Explore model essays with automatic keyword highlighting. Each essay includes a keyword reference table to help you learn effective vocabulary and structure.
      </p>

      {loading ? (
        <div className="text-center text-gray-600 dark:text-white">
          <p className="text-lg">Đang tải essays...</p>
        </div>
      ) : allEssays.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-white max-w-md mx-auto">
          <p className="text-lg mb-4">Chưa có essay nào.</p>
        </div>
      ) : (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allEssays.map((essay) => (
            <Link
              key={essay.id}
              href={`/essays/${essay.id}`}
              className="block p-6 bg-white bg-opacity-30 backdrop-blur-lg border border-gray-200 rounded-lg shadow-lg hover:bg-opacity-40 hover:border-[#fc5d01] transition-all duration-200 dark:bg-gray-800 dark:bg-opacity-30 dark:border-gray-700 dark:hover:bg-opacity-40"
            >
              <div className="flex flex-col h-full">
                <h5 className="mb-3 text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  {essay.title}
                </h5>
                
                <div className="mt-auto">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {essay.keywords.length} keywords • Click to read
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
        <p>💡 Tip: Keywords in each essay are automatically highlighted in bold for easy learning.</p>
      </div>
    </main>
  );
};

export default EssaysListPage;
