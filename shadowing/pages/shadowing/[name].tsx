import { firebaseAdmin } from '../../lib/firebaseAdmin';
import ShadowingSentence from "../../components/ShadowingSentence";
import AppShellBackground from "../../components/ui/AppShellBackground";

export interface ShadowingData {
  id: string;
  text: string;
  url: string;
  name: string;
  practice: string;
}

const DynamicShadowingPage = ({ shadowingData }: { shadowingData: ShadowingData[] }) => {
  return (
    <AppShellBackground className="shadow-detail">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center px-4 py-8 sm:px-6 sm:py-12">
        <ShadowingSentence shadowingData={shadowingData} />
      </main>
    </AppShellBackground>
  );
};

export async function getServerSideProps(context: { params: { name: string } }) {
  const { params } = context;
  const { name } = params;

  try {
    const querySnapshot = await firebaseAdmin().db.collection('shadowing').where('name', '==', name).get();

    if (querySnapshot.empty) {
      return {
        notFound: true,
      };
    }

    const shadowingData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      text: doc.get("text"),
      url: doc.get("url"),
      name: doc.get("name"),
      practice: doc.get("practice"),
    }));

    return {
      props: {
        shadowingData,
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      notFound: true,
    };
  }
}

export default DynamicShadowingPage;
