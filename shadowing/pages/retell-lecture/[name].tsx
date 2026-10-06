import { loadAudioData } from '../../lib/retell-lecture';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import RetellLectureShadowing from '../../components/RetellLectureShadowing';

export interface RetellLectureData {
  id: string;
  name: string;
  sentences: {
    number: number;
    text: string;
    voices: {
      brian: string;
      joanna: string;
      olivia: string;
    };
  }[];
  fullText: string;
  availableVoices: string[];
}

const DynamicRetellLecturePage = ({ retellData }: { retellData: RetellLectureData }) => {
  const router = useRouter();
  const { name } = router.query;
  const [backgroundImage, setBackgroundImage] = useState("");

  return (
    <div 
      className="bg-cover bg-center flex mx-auto min-h-screen flex-col items-center justify-between p-4 sm:p-6 md:p-8 lg:p-12 xl:p-24" 
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >          
      <RetellLectureShadowing retellData={retellData} />
    </div>
  );
};

export async function getServerSideProps(context: { params: { name: string } }) {
  const { params } = context;
  const { name } = params;

  try {
  const retellData = loadAudioData();

    return {
      props: {
        retellData,
      },
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      notFound: true,
    };
  }
}

export default DynamicRetellLecturePage;
