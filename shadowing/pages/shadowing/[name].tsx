// pages/[name].js
import { useRouter } from 'next/router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import ShadowingSentence from '@/components/ShadowingSentence';
export interface ShadowingData {
    id: string;
    text: string;
    url: string;
    name: string;
  }
const DynamicShadowingPage = ({ shadowingData }: { shadowingData: ShadowingData[] }) => {
  const router = useRouter();
  const { name } = router.query;
  // console.log(shadowingData)
  return (
    <div className={`flex mx-auto min-h-screen flex-col items-center justify-between p-24 `}>          
      <ShadowingSentence shadowingData={shadowingData}/>
    </div>
  );
};

export async function getServerSideProps(context: { params: { name: string } }) {
  const { params } = context;
  const { name } = params;

  try {
    const querySnapshot = await getDocs(query(collection(db, 'shadowing'), where('name', '==', name)));
    const shadowingData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      text: doc.get('text'),
      url: doc.get('url'),
      name: doc.get('name'),
    }));

    return {
      props: {
        shadowingData,
      },
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      notFound: true, // Return a 404 page
    };
  }
}

export default DynamicShadowingPage;
