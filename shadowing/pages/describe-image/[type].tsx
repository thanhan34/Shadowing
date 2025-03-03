import React from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import DescribeImageTemplate from '../../components/DescribeImageTemplate';
import { getNextImage } from '../../utils/background';

interface Props {
  type: 'picture' | 'line_chart' | 'bar_chart' | 'pie_chart';
  backgroundImage: string;
}

const DescribeImageType: React.FC<Props> = ({ type, backgroundImage }) => {
  const router = useRouter();
  
  const getTitle = () => {
    switch (type) {
      case 'picture':
        return 'Describe a Picture';
      case 'line_chart':
        return 'Line Chart Analysis';
      case 'bar_chart':
        return 'Bar Chart Analysis';
      case 'pie_chart':
        return 'Pie Chart Analysis';
      default:
        return 'Describe Image';
    }
  };

  return (
    <main
      className="bg-cover bg-center bg-fixed flex mx-auto min-h-screen flex-col items-center w-full p-4 sm:p-6 space-y-5 backdrop-blur-lg"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Head>
        <title>{getTitle()} - PTE Practice Tool</title>
        <meta
          name="description"
          content={`Practice ${getTitle()} for PTE exam with interactive templates and guidance.`}
        />
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

      <div className="flex items-center space-x-4">
        <Link
          href="/describe-image"
          className="text-sm px-3 py-1 rounded-lg"
          style={{
            backgroundColor: '#fedac2',
            color: '#fc5d01',
          }}
        >
          ← Back
        </Link>
        <h1
          className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight"
          style={{ color: '#fc5d01' }}
        >
          {getTitle()}
        </h1>
      </div>

      <div className="w-full max-w-4xl bg-white bg-opacity-95 rounded-lg shadow-lg p-6">
        <DescribeImageTemplate type={type} />
      </div>
    </main>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const validTypes = ['picture', 'line_chart', 'bar_chart', 'pie_chart'];
  const type = params?.type as string;

  if (!validTypes.includes(type)) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      type,
      backgroundImage: getNextImage(),
    },
  };
};

export default DescribeImageType;
