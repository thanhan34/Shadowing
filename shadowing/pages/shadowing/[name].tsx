// pages/[name].js
import { useRouter } from 'next/router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import ShadowingSentence from '../../components/ShadowingSentence';
import { useState, useEffect } from 'react';

export interface ShadowingData {
    id: string;
    text: string;
    url: string;
    name: string;
    practice: string;
  }

const DynamicShadowingPage = ({ shadowingData }: { shadowingData: ShadowingData[] }) => {
  const router = useRouter();
  const { name } = router.query;
  const [backgroundImage, setBackgroundImage] = useState("");

  return (
    <div className={`bg-cover bg-center flex mx-auto min-h-screen flex-col items-center justify-between p-4 sm:p-6 md:p-8 lg:p-12 xl:p-24`} style={{ backgroundImage: `url(${backgroundImage})` }}>          
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
      practice: doc.get('practice'),
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
