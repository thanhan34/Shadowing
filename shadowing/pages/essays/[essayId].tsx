import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import { getNextImage } from '../../utils/background';
import { mockEssays, Essay } from '../../data/mockEssays';
import { highlightKeywords } from '../../utils/highlightKeywords';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

interface EssayDetailPageProps {
  essay: Essay;
}

const EssayDetailPage: React.FC<EssayDetailPageProps> = () => {
  const [backgroundImage, setBackgroundImage] = useState('');
  const [essay, setEssay] = useState<Essay | null>(null);
  const [allEssays, setAllEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { essayId } = router.query;

  useEffect(() => {
    setBackgroundImage(getNextImage());
    
    if (essayId && typeof essayId === 'string') {
      loadEssay(essayId);
      loadAllEssays();
    }
  }, [essayId]);

  const loadEssay = async (id: string) => {
    try {
      const essayDoc = await getDoc(doc(db, 'essays', id));
      if (essayDoc.exists()) {
        setEssay({ id: essayDoc.id, ...essayDoc.data() } as Essay);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading essay:', error);
      setLoading(false);
    }
  };

  const loadAllEssays = async () => {
    try {
      const essaysSnapshot = await getDocs(collection(db, 'essays'));
      const essaysList = essaysSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Essay[];
      setAllEssays(essaysList);
    } catch (error) {
      console.error('Error loading all essays:', error);
    }
  };

  if (loading || !essay) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Extract keyword values for highlighting
  const keywordValues = essay.keywords.map(k => k.value);

  return (
    <main
      className="bg-cover bg-center bg-fixed flex mx-auto min-h-screen flex-col items-center w-full p-4 sm:p-6 space-y-5"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Head>
        <title>{essay.title} - Essay Library</title>
        <meta name="description" content={`Read model essay: ${essay.title}`} />
        <meta name="keywords" content="PTE essay, writing practice" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <Link href="/" className="flex justify-center">
        <Image
          src="/logo1.png"
          alt="Logo"
          width={150}
          height={150}
          className="sm:w-32 sm:h-32 lg:w-40 lg:h-40"
        />
      </Link>

      {/* Back to Essays Link */}
      <div className="w-full max-w-7xl">
        <Link
          href="/essays"
          className="inline-flex items-center text-[#fc5d01] hover:text-[#fd7f33] font-medium transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Essay Library
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
          {/* Left Column - Essay Content */}
          <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-lg shadow-lg p-6 sm:p-8 dark:bg-gray-800 dark:bg-opacity-90">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {essay.title}
            </h1>

            <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 leading-relaxed text-justify">
              {highlightKeywords(essay.content, keywordValues)}
            </div>
          </div>

          {/* Right Column - Keywords Table */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:bg-opacity-90">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-[#fc5d01]">
                Keywords Reference
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#fdbc94] bg-opacity-50">
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white rounded-tl-lg">
                        Slot
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white rounded-tr-lg">
                        Keyword
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {essay.keywords.map((keyword, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-200 dark:border-gray-700 ${
                          index % 2 === 0 ? 'bg-[#fedac2] bg-opacity-20' : ''
                        } hover:bg-[#ffac7b] hover:bg-opacity-30 transition-colors`}
                      >
                        <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {keyword.slot}
                        </td>
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-200 font-semibold">
                          {keyword.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-[#fedac2] bg-opacity-30 rounded-lg">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  💡 <strong>Note:</strong> All keywords are automatically highlighted in bold within the essay text.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation to other essays */}
      <div className="w-full max-w-7xl mt-8">
        <div className="bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:bg-opacity-30">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Explore More Essays
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {allEssays
              .filter(e => e.id !== essay.id)
              .slice(0, 3)
              .map(otherEssay => (
                <Link
                  key={otherEssay.id}
                  href={`/essays/${otherEssay.id}`}
                  className="block p-4 bg-white bg-opacity-50 backdrop-blur-lg rounded-lg hover:bg-opacity-70 hover:border-[#fc5d01] border-2 border-transparent transition-all dark:bg-gray-700 dark:bg-opacity-50"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {otherEssay.title}
                  </h4>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
};

// Using client-side data fetching only (no SSG/SSR)

export default EssayDetailPage;
