import { GetServerSideProps } from 'next';
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navigation from "../components/Navigation";
import { getNextImage } from "../utils/background";
import Head from 'next/head';

interface Template {
  id: string;
  type: 'picture' | 'line_chart' | 'bar_chart' | 'pie_chart';
  name: string;
}

const templates: Template[] = [
  { id: '1', type: 'picture', name: 'Describe a Picture' },
  { id: '2', type: 'line_chart', name: 'Line Chart Analysis' },
  { id: '3', type: 'bar_chart', name: 'Bar Chart Analysis' },
  { id: '4', type: 'pie_chart', name: 'Pie Chart Analysis' },
];

const DescribeImage: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTemplates, setFilteredTemplates] = useState(templates);

  useEffect(() => {
    setBackgroundImage(getNextImage());
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = templates.filter(template => 
      template.name.toLowerCase().includes(query)
    );
    setFilteredTemplates(filtered);
  };

  return (
    <main
      className="bg-cover bg-center bg-fixed flex mx-auto min-h-screen flex-col items-center w-full p-4 sm:p-6 space-y-5 backdrop-blur-lg"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Head>
        <title>Describe Image - Bộ Công Cụ Luyện Tập PTE</title>
        <meta
          name="description"
          content="Luyện tập kỹ năng mô tả hình ảnh và biểu đồ trong PTE với các mẫu và hướng dẫn chi tiết."
        />
        <meta
          name="keywords"
          content="PTE describe image, mô tả hình ảnh PTE, describe charts PTE, luyện tập PTE"
        />
        <meta name="author" content="PTE Intensive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />
      
      <Link href="/" className="flex justify-center">
        <Image src="/logo1.png" alt="Logo" width={150} height={150} className="sm:w-40 sm:h-40 lg:w-48 lg:h-48" />
      </Link>

      <h1 className="mb-2 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: '#fc5d01' }}>
        DESCRIBE IMAGE
      </h1>

      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchInputChange}
        placeholder="Tìm kiếm mẫu..."
        className="mb-4 p-2 w-full sm:w-1/2 border rounded-lg text-white placeholder-white focus:outline-none focus:ring-2"
        style={{ 
          backgroundColor: 'rgba(252, 93, 1, 0.2)',
          borderColor: '#fedac2',
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:w-3/4">
        {filteredTemplates.map((template) => (
          <Link
            href={`/describe-image/${template.type}`}
            key={template.id}
            className="block p-4 sm:p-6 rounded-lg shadow-lg transition-all duration-300 hover:transform hover:scale-105"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #fedac2',
            }}
          >
            <h5 className="mb-2 text-lg sm:text-xl font-bold tracking-tight" style={{ color: '#fc5d01' }}>
              {template.name}
            </h5>
            <p className="text-sm text-gray-600">
              Click để xem mẫu và thực hành
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default DescribeImage;
