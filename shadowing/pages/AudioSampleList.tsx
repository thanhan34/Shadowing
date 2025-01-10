import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { db, storage } from "../firebase";
import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type VoiceType = 'Brian' | 'Joanna' | 'Olivia';

interface AudioSample {
  id: string;
  audio: {
    [K in VoiceType]: string;
  };
  text: string;
  occurrence: number;
  createdAt?: any;
  isHidden?: boolean;
}

const AudioSampleList: React.FC = () => {
  const router = useRouter();
  const [samples, setSamples] = useState<AudioSample[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingFor, setUploadingFor] = useState<{id: string, voice: VoiceType} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleEdit = async (id: string, newText: string, newIsHidden: boolean, newAudio?: { [K in VoiceType]: string }) => {
    try {
      const sampleRef = doc(db, "writefromdictation", id);
      const updateData: any = { text: newText, isHidden: newIsHidden };
      if (newAudio) {
        updateData.audio = newAudio;
      }
      await updateDoc(sampleRef, updateData);
      setMessage(`Audio sample "${newText}" updated.`);
    } catch (error) {
      setMessage(`Error updating sample: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !uploadingFor) return;

    try {
      const file = e.target.files[0];
      const { id, voice } = uploadingFor;
      const storageRef = ref(storage, `audio/${id}/${voice}/${file.name}`);
      
      const metadata = {
        contentType: 'audio/mp3',
        cacheControl: 'public, max-age=31536000',
        customMetadata: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        }
      };

      const snapshot = await uploadBytes(storageRef, file, metadata);
      const url = await getDownloadURL(snapshot.ref);

      const sample = samples.find(s => s.id === id);
      if (sample) {
        const updatedAudio = {
          ...sample.audio,
          [voice]: url
        };
        await handleEdit(id, sample.text, sample.isHidden ?? false, updatedAudio);
      }

      setUploadingFor(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setMessage(`Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadingFor(null);
    }
  };

  const handleUploadClick = (id: string, voice: VoiceType) => {
    setUploadingFor({ id, voice });
    if (fileInputRef.current) {
      fileInputRef.current.click();
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

  const hasEmptyAudioLink = (audio: { [K in VoiceType]: string }) => {
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
              <div className="mb-4 space-y-2">
                <strong className="text-white">Audio Links:</strong>
                {(['Brian', 'Joanna', 'Olivia'] as const).map((voice) => (
                  <div key={voice} className="flex items-center space-x-2">
                    <span className="text-white w-16">{voice}:</span>
                    <input
                      type="text"
                      value={sample.audio[voice] || ''}
                      onChange={(e) => {
                        const updatedAudio = {
                          ...sample.audio,
                          [voice]: e.target.value
                        };
                        setSamples((prevSamples) =>
                          prevSamples.map((s) =>
                            s.id === sample.id ? { ...s, audio: updatedAudio } : s
                          )
                        );
                      }}
                      className="flex-1 border border-gray-300 rounded p-1 text-black"
                    />
                    <button
                      onClick={() => handleUploadClick(sample.id, voice)}
                      className="px-3 py-1 bg-[#fc5d01] text-white rounded hover:bg-[#fd7f33]"
                    >
                      Upload
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="mr-2 px-4 py-2 bg-[#fc5d01] text-white rounded hover:bg-[#fd7f33]"
                onClick={() => handleEdit(sample.id, sample.text, sample.isHidden ?? false)}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => handleDelete(sample.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="mt-4 text-black whitespace-pre-line">{message}</p>}
      {uploadingFor && (
        <input
          type="file"
          accept="audio/mp3"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
        />
      )}
    </main>
  );
};

export default AudioSampleList;
