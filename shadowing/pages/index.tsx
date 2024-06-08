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
        <title>PTE Intensive</title>
        <meta
          name="description"
          content="A 3D portfolio website created with Next.js and Three.js"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative z-10 text-white flex flex-col items-center justify-center h-screen">
        <section
          id="home"
          className="flex flex-col items-center justify-center h-screen text-center"
        >
          <Link href="/" className="flex justify-center">
            <Image src="/logo1.png" alt="Logo" width={300} height={200} />
          </Link>
          <div className="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-lg shadow-lg">
          <h1 className="text-6xl font-bold">SBS PTE INTENSIVE</h1>
          <p className="mt-4 text-xl tracking-wide">
            CREATIVE | TECHNOLOGIST | DEVELOPER
          </p>
          </div>
          
        </section>
        <section className="absolute bottom-4 w-full text-center">
          <div className="flex justify-center space-x-4 text-sm">
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
            <Link href="https://www.youtube.com/channel/UCG-3Z9RIe330EbUBNb8weZw?sub_confirmation=1" legacyBehavior>
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
