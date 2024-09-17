import Head from "next/head";
import { getNextImage } from "../utils/background";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";

const Home: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState("");
  useEffect(() => {
    setBackgroundImage(getNextImage());
  }, []);

  return (
    <div
      className="relative min-h-screen bg-black bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Head>
        <title>Bộ Công Cụ Luyện Tập PTE - Nâng Cao Kỹ Năng, Đạt Điểm Số Mơ Ước</title>
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
      </Head>
      <main className="relative z-10 text-white flex flex-col items-center justify-center min-h-screen">
        <section
          id="home"
          className="flex flex-col items-center justify-center min-h-screen text-center px-4"
        >
          <Link href="/" className="flex justify-center">
            <Image src="/logo1.png" alt="Logo" width={150} height={150} className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64" />
          </Link>
          <div className="bg-white bg-opacity-10 backdrop-blur-md p-4 sm:p-6 rounded-lg shadow-lg max-w-xs sm:max-w-md lg:max-w-lg">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-wide">
              PTE INTENSIVE
            </h1>
            <p className="mt-2 sm:mt-4 text-base sm:text-lg md:text-xl tracking-wide">
              DẠY THỰC TÂM | HỌC THỰC CHẤT | THI THỰC TẾ
            </p>
          </div>
        </section>

        <section className="absolute bottom-4 w-full text-center px-4">
          <div className="flex flex-wrap justify-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
            <Link href="/" legacyBehavior>
              <a className="hover:text-gray-400">HOME</a>
            </Link>

            <a
              href="https://www.facebook.com/groups/pteintensive"
              target="_blank"
              className="hover:text-gray-400"
            >
              COMMUNITY
            </a>
            <Link href="https://www.facebook.com/pteintensive" legacyBehavior>
              <a target="_blank" className="hover:text-gray-400">
                FACEBOOK
              </a>
            </Link>
            <Link
              href="https://www.youtube.com/channel/UCG-3Z9RIe330EbUBNb8weZw?sub_confirmation=1"
              legacyBehavior
            >
              <a target="_blank" className="hover:text-gray-400">
                YOUTUBE
              </a>
            </Link>
            <Link href="/shadow" legacyBehavior>
              <a className="hover:text-gray-400">SHADOWING</a>
            </Link>
            <Link href="/writefromdictation" legacyBehavior>
              <a className="hover:text-gray-400">WRITE FROM DICTATION</a>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
