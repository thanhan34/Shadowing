import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navigation from "../components/Navigation";
import { getNextImage } from "../utils/background";
import { useRouter } from 'next/router';
import { collection, getDocs, query, orderBy, startAfter, where } from "firebase/firestore";
import { db } from "../firebase";
import Head from 'next/head';

interface Paragraph {
  id: string;
  text: string;
  url: string;
  name: string;
}

interface ShadowProps {
  initialData: Paragraph[];
}

const Shadow: React.FC<ShadowProps> = ({ initialData }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [arrayParagraph, setArrayParagraph] = useState<Paragraph[]>(initialData);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const router = useRouter();

  useEffect(() => {
    setBackgroundImage(getNextImage());
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    const fetchFilteredData = async () => {
      const res = await fetch(`/api/shadowing`);
      const data: Paragraph[] = await res.json();
      // Filter data locally based on search query
      const filteredData = debouncedSearchQuery
        ? data.filter(item => item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
        : data;
      setArrayParagraph(filteredData);
    };

    fetchFilteredData();
  }, [debouncedSearchQuery]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchQuery = e.target.value;
    setSearchQuery(newSearchQuery);
  };

  return (
    <main
      className="bg-cover bg-center bg-fixed flex mx-auto min-h-screen flex-col items-center w-full p-4 sm:p-6 space-y-5 backdrop-blur-lg"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Head>
        <title>Shadowing - Bộ Công Cụ Luyện Tập PTE - Nâng Cao Kỹ Năng, Đạt Điểm Số Mơ Ước</title>
        <meta
          name="description"
          content="Sử dụng bộ công cụ luyện tập PTE hiệu quả nhất, với các bài tập đa dạng, tài liệu cập nhật và lộ trình cá nhân hóa. Nâng cao kỹ năng nghe, nói, đọc, viết và đạt điểm số mơ ước với PTE Intensive."
        />
        <meta
          name="keywords"
          content="bộ công cụ PTE, luyện tập PTE, công cụ PTE, luyện thi PTE, bài tập PTE, tài liệu PTE, luyện PTE hiệu quả, nâng cao kỹ năng PTE, thi PTE đạt điểm cao"
        />
        <meta name="author" content="PTE Intensive" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Navigation />
      <Link href="/" className="flex justify-center">
        <Image src="/logo1.png" alt="Logo" width={150} height={150} className="sm:w-40 sm:h-40 lg:w-48 lg:h-48" />
      </Link>
      <h1 className="mb-2 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-600 dark:text-white">
        SHADOWING
      </h1>
      <Link href="/shadowing-methods" className="mb-4 px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-300">
        Xem Phương Pháp Học Shadowing
      </Link>
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchInputChange}
        placeholder="Search..."
        className="mb-4 p-2 w-full sm:w-1/2 border border-gray-300 rounded-lg text-white bg-blue-500 bg-opacity-20 backdrop-blur-lg placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {arrayParagraph.length > 0 ? (
        arrayParagraph.map((data) => (
          <Link
            href={`/shadowing/${data.name}`}
            key={data.id}
            className="block w-full sm:w-1/2 p-4 sm:p-6 bg-white bg-opacity-30 backdrop-blur-lg border border-gray-200 rounded-lg shadow-lg hover:bg-opacity-40 dark:bg-gray-800 dark:bg-opacity-30 dark:border-gray-700 dark:hover:bg-opacity-40 dark:hover:bg-gray-700"
          >
            <h5 className="mb-2 text-lg sm:text-2xl font-bold tracking-tight text-gray-600 dark:text-white">
              {data.name}
            </h5>
          </Link>
        ))
      ) : (
        <p className="text-gray-600 dark:text-white">No results found</p>
      )}

    </main>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_BASE_URL || 'localhost:3000';
  const res = await fetch(`${protocol}://${host}/api/shadowing`);
  const data: Paragraph[] = await res.json();
  return {
    props: {
      initialData: data,
    },
  };
};

export default Shadow;
