import { loadAudioData } from '../../lib/retell-lecture';
import AppShellBackground from '../../components/ui/AppShellBackground';
import RetellLectureShadowing from '../../components/RetellLectureShadowing';

export interface RetellLectureData {
  id: string;
  name: string;
  sentences: {
    number: number;
    text: string;
    voices: {
      ryan: string;
    };
  }[];
  fullText: string;
  availableVoices: string[];
}

const DynamicRetellLecturePage = ({ retellData }: { retellData: RetellLectureData }) => {
  return (
    <AppShellBackground className="di-practice rl-practice">
      <RetellLectureShadowing retellData={retellData} />
    </AppShellBackground>
  );
};

export async function getServerSideProps() {
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
