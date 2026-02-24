import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
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
    <AppShellBackground>
      <main className="mx-auto flex min-h-screen w-full flex-col items-center justify-between p-4 sm:p-6 md:p-8 lg:p-12 xl:p-24">
        <ShadowingSentence shadowingData={shadowingData} />
      </main>
    </AppShellBackground>
  );
};

export async function getServerSideProps(context: { params: { name: string } }) {
  const { params } = context;
  const { name } = params;

  try {
    const querySnapshot = await getDocs(
      query(collection(db, "shadowing"), where("name", "==", name))
    );

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
