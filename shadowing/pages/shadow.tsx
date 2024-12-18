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
  pageCount: number;
}

const Shadow: React.FC<ShadowProps> = ({ initialData, pageCount }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [arrayParagraph, setArrayParagraph] = useState<Paragraph[]>(initialData);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [page, setPage] = useState(1);
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
      const res = await fetch(`/api/shadowing?page=${page}&search=${debouncedSearchQuery}`);
      const data: Paragraph[] = await res.json();
      setArrayParagraph(data);
    };

    fetchFilteredData();
  }, [debouncedSearchQuery, page]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchQuery = e.target.value;
    setSearchQuery(newSearchQuery);
    setPage(1); // Reset to the first page on new search
  };

  const handlePageChange = async (newPage: number) => {
    setSearchQuery("");
    setPage(newPage);
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

      <div className="flex flex-wrap justify-center space-x-2">
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => handlePageChange(pageNumber)}
            className={`px-4 py-2 m-2 ${pageNumber === page ? 'bg-blue-500 text-white hover:shadow-yellow-400/50 bg-yellow-400 shadow-xl' : 'bg-gray-200 text-gray-700 hover:shadow-yellow-400/50 shadow-xl'} rounded-lg`}
          >
            {pageNumber}
          </button>
        ))}
      </div>
    </main>
  );
};

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  const { page = '1', search = '' } = context.query;

  const normalizedPage = Array.isArray(page) ? page[0] : page;
  const normalizedSearch = Array.isArray(search) ? search[0] : search;

  const itemsPerPage = 10;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${baseUrl}/api/shadowing?page=${normalizedPage}&search=${normalizedSearch}`);
  const data: Paragraph[] = await res.json();

  const totalItems = await getTotalItems(normalizedSearch);
  const pageCount = Math.ceil(totalItems / itemsPerPage);

  return {
    props: {
      initialData: data,
      pageCount,
    },
  };
};

async function getTotalItems(search: string) {
  let querySnapshot;
  if (search) {
    const q = query(collection(db, "shadowing"), where("name", ">=", search), where("name", "<=", search + '\uf8ff'), orderBy("name"));
    querySnapshot = await getDocs(q);
  } else {
    querySnapshot = await getDocs(collection(db, "shadowing"));
  }
  return querySnapshot.size;
}

export default Shadow;
