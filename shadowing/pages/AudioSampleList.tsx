import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
} from "firebase/firestore";

interface AudioSample {
  id: string;
  audio: {
    Brian: string;
    Olivia: string;
    Joanna: string;
  };
  text: string;
  occurrence: number;
  createdAt?: any;
  isHidden?: boolean;
}

const AudioSampleList: React.FC = () => {
  const [samples, setSamples] = useState<AudioSample[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const audioSamplesRef = collection(db, "writefromdictation");
    const q = query(audioSamplesRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedSamples = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AudioSample[];

      // Sort samples alphabetically by text
      fetchedSamples.sort((a, b) => a.text.localeCompare(b.text));

      setSamples(fetchedSamples);
      setIsLoading(false);
    }, (error) => {
      setMessage(`Error fetching samples: ${error.message}`);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleEdit = async (id: string, newText: string, newIsHidden: boolean) => {
    try {
      const sampleRef = doc(db, "writefromdictation", id);
      await updateDoc(sampleRef, { text: newText, isHidden: newIsHidden });
      setMessage(`Audio sample "${newText}" updated.`);
    } catch (error) {
      setMessage(`Error updating sample: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const sampleRef = doc(db, "writefromdictation", id);
      await deleteDoc(sampleRef);
      setMessage(`Audio sample removed.`);
    } catch (error) {
      setMessage(`Error deleting sample: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const hasEmptyAudioLink = (audio: { Brian: string; Olivia: string; Joanna: string }) => {
    return !audio.Brian || !audio.Olivia || !audio.Joanna;
  };

  return (
    <main className="flex mx-auto min-h-screen flex-col items-center min-w-screen p-24 space-y-5 w-full">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-600 dark:text-white">
        Audio Samples List
      </h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul className="w-full space-y-4">
          {samples.map((sample) => (
            <li key={sample.id} className="p-4 border border-gray-300 rounded">
              <div className="mb-2">
                <strong className="text-black">Text:</strong>{" "}
                <input
                  type="text"
                  value={sample.text}
                  onChange={(e) =>
                    setSamples((prevSamples) =>
                      prevSamples.map((s) =>
                        s.id === sample.id ? { ...s, text: e.target.value } : s
                      )
                    )
                  }
                  className="border border-gray-300 rounded p-1 w-full text-black"
                />
              </div>
              <div className="mb-2 text-white">
                <strong>Occurrence:</strong> {sample.occurrence}
              </div>
              <div className="mb-2 text-white">
                <strong>Is Hidden:</strong>{" "}
                <input
                  type="checkbox"
                  checked={sample.isHidden ?? false}
                  onChange={(e) =>
                    setSamples((prevSamples) =>
                      prevSamples.map((s) =>
                        s.id === sample.id ? { ...s, isHidden: e.target.checked } : s
                      )
                    )
                  }
                />
              </div>
              <div className={`mb-2 ${hasEmptyAudioLink(sample.audio) ? 'text-red-500' : 'text-white'}`}>
                <strong>Audio Links:</strong> {hasEmptyAudioLink(sample.audio) ? "Some links are empty" : "All links are filled"}
              </div>
              <button
                className="mr-2 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => handleEdit(sample.id, sample.text, sample.isHidden ?? false)}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded"
                onClick={() => handleDelete(sample.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="mt-4 text-black whitespace-pre-line">{message}</p>}
    </main>
  );
};

export default AudioSampleList;
