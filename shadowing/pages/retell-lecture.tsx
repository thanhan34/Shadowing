import { GetServerSideProps } from 'next';
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getNextImage } from "../utils/background";
import Head from 'next/head';

interface RetellLectureData {
  id: string;
  name: string;
  fullText: string;
  availableVoices: string[];
}

interface RetellLectureProps {
  initialData: RetellLectureData;
}

const RetellLecture: React.FC<RetellLectureProps> = ({ initialData }) => {
  const [backgroundImage, setBackgroundImage] = useState("");

  useEffect(() => {
    setBackgroundImage(getNextImage());
  }, []);

  return (
    <main
      className="bg-cover bg-center bg-fixed flex mx-auto min-h-screen flex-col items-center w-full p-4 sm:p-6 space-y-5 backdrop-blur-lg"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Head>
        <title>Retell Lecture Shadowing - Bộ Công Cụ Luyện Tập PTE</title>
        <meta
          name="description"
          content="Luyện tập Retell Lecture với công cụ shadowing hiệu quả. Chọn giọng đọc phù hợp và luyện tập từng câu hoặc cả đoạn."
        />
        <meta
          name="keywords"
          content="retell lecture, PTE, shadowing, luyện tập PTE, speaking PTE"
        />
        <meta name="author" content="PTE Intensive" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>      <Link href="/" className="flex justify-center">
        <Image src="/logo1.png" alt="Logo" width={150} height={150} className="sm:w-40 sm:h-40 lg:w-48 lg:h-48" />
      </Link>
      <h1 className="mb-2 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-600 dark:text-white">
        RETELL LECTURE SHADOWING
      </h1>
      <p className="text-center text-gray-600 dark:text-white mb-4">
        Luyện tập với 3 giọng đọc: Brian, Joanna, Olivia
      </p>

      <Link
        href="/retell-lecture/practice"
        className="block w-full sm:w-1/2 p-4 sm:p-6 bg-white bg-opacity-30 backdrop-blur-lg border border-gray-200 rounded-lg shadow-lg hover:bg-opacity-40 dark:bg-gray-800 dark:bg-opacity-30 dark:border-gray-700 dark:hover:bg-opacity-40 dark:hover:bg-gray-700"
      >
        <h5 className="mb-2 text-lg sm:text-2xl font-bold tracking-tight text-gray-600 dark:text-white">
          {initialData.name}
        </h5>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          6 câu - 3 giọng đọc khác nhau
        </p>
      </Link>
    </main>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_BASE_URL || 'localhost:3000';
  const res = await fetch(`${protocol}://${host}/api/retell-lecture`);
  const data = await res.json();
  return {
    props: {
      initialData: data,
    },
  };
};

export default RetellLecture;
