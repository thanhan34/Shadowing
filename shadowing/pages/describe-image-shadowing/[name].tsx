import { loadAudioData } from '../../lib/describe-image-shadowing';
import AppShellBackground from '../../components/ui/AppShellBackground';
import DescribeImageShadowingComponent from '../../components/DescribeImageShadowingComponent';
import type { DescribeImageType } from '../../lib/describe-image-template';

interface PracticeContent {
  sentences: { number: number; text: string; voices: { ryan: string } }[];
  fullText: string;
}

export interface DescribeImageData extends PracticeContent {
  id: string;
  name: string;
  variants: Record<DescribeImageType, PracticeContent>;
  availableVoices: string[];
}

const DynamicDescribeImagePage = ({ describeImageData }: { describeImageData: DescribeImageData }) => {
  return (
    <AppShellBackground className="di-practice">
      <DescribeImageShadowingComponent describeImageData={describeImageData} />
    </AppShellBackground>
  );
};

export async function getServerSideProps() {
  try {
  const describeImageData = loadAudioData();

    return {
      props: {
        describeImageData,
      },
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      notFound: true,
    };
  }
}

export default DynamicDescribeImagePage;
