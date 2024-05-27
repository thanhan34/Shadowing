import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { db, storage } from '../firebase'; // Adjust the path according to your setup
import { collection, doc, updateDoc, CollectionReference, query, orderBy, Query, DocumentData, Timestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AudioSample {
  id: string;
  audio: { [key: string]: string };
  text: string;
  occurrence: number;
  createdAt: Timestamp;
}

const EditAudioSamplePage: React.FC = () => {
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<AudioSample[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [currentSample, setCurrentSample] = useState<AudioSample | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  useEffect(() => {
    const collectionRef: CollectionReference<DocumentData> = collection(db, 'writefromdictation');
    const q: Query<DocumentData> = query(collectionRef, orderBy('occurrence', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AudioSample));
      const sortedData = data.sort((a, b) => a.text.localeCompare(b.text)); // Sort by text alphabetically
      setAudioSamples(sortedData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching data:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered = audioSamples.filter(sample =>
      !sample.audio.Brian || !sample.audio.Joanna || !sample.audio.Olivia
    );
    setFilteredSamples(filtered);
    if (filtered.length > 0) {
      setCurrentSample(filtered[currentIndex]);
    } else {
      setCurrentSample(null);
    }
  }, [audioSamples, currentIndex]);

  const handleSelectChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(event.target.value, 10);
    setCurrentIndex(index);
    setCurrentSample(filteredSamples[index]);
  }, [filteredSamples]);

  const handleEditClick = useCallback(() => {
    setEditing(true);
  }, []);

  const handleSaveClick = useCallback(async () => {
    if (currentSample) {
      try {
        setSaving(true);
        const docRef = doc(db, 'writefromdictation', currentSample.id);
        const { id, ...data } = currentSample; // Ensure 'id' is not included in the update data
        await updateDoc(docRef, data);
        setEditing(false);
        setSaving(false);
      } catch (error) {
        console.error('Error saving data:', error);
        setSaving(false);
      }
    }
  }, [currentSample]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof AudioSample) => {
    if (currentSample) {
      setCurrentSample({ ...currentSample, [field]: e.target.value });
    }
  }, [currentSample]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentSample && uploadingFor) {
      setUploading(true);
      const file = e.target.files[0];
      const storageRef = ref(storage, `audio/${currentSample.id}/${uploadingFor}/${file.name}`);
      try {
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        const updatedSample: AudioSample = {
          ...currentSample,
          audio: { ...currentSample.audio, [uploadingFor]: url }
        };
        setCurrentSample(updatedSample);
        setUploading(false);
        setUploadingFor(null);

        // Update Firestore document with new audio URL
        const docRef = doc(db, 'writefromdictation', currentSample.id);
        await updateDoc(docRef, { audio: updatedSample.audio });
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploading(false);
      }
    }
  }, [currentSample, uploadingFor]);

  const handleUploadClick = useCallback((voice: string) => {
    setUploadingFor(voice);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const renderAudioField = (voice: string) => (
    <div key={`audio-${voice}`} className="mb-2">
      <label htmlFor={`audio-${voice}`} className="block mb-1">{voice}</label>
      <input
        id={`audio-${voice}`}
        type="text"
        className="w-full p-2 border border-gray-300 rounded text-black"
        value={currentSample?.audio[voice] || ''}
        onChange={(e) => setCurrentSample({
          ...currentSample!,
          audio: { ...currentSample!.audio, [voice]: e.target.value }
        })}
      />
      <button
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => handleUploadClick(voice)}
      >
        Upload {voice} Audio
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-4 text-2xl font-bold">Edit Audio Sample</h1>
      <h2>{filteredSamples.length}</h2>
      {currentSample && (
        <div className="w-full max-w-md space-y-4">
          {editing ? (
            <div>
              <label htmlFor="text" className="block mb-2">Text</label>
              <textarea
                id="text"
                className="w-full p-2 border border-gray-300 rounded text-black"
                value={currentSample.text}
                onChange={(e) => handleChange(e, 'text')}
              ></textarea>
              <label htmlFor="occurrence" className="block mb-2">Occurrence</label>
              <input
                id="occurrence"
                type="number"
                className="w-full p-2 border border-gray-300 rounded text-black"
                value={currentSample.occurrence}
                onChange={(e) => handleChange(e, 'occurrence')}
              />
              <label htmlFor="audio" className="block mb-2">Audio URLs</label>
              {['Brian', 'Olivia', 'Joanna'].map(renderAudioField)}
              {uploadingFor && (
                <input
                  type="file"
                  accept="audio/mp3"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />
              )}
              <button
                className={`px-4 py-2 text-white rounded ${saving ? 'bg-gray-500' : 'bg-green-500'}`}
                onClick={handleSaveClick}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <div>
              <p className='text-black'><strong>Text:</strong> {currentSample.text}</p>
              <p className='text-black'><strong>Occurrence:</strong> {currentSample.occurrence}</p>
              <div>
                <strong>Audio URLs:</strong>
                {Object.entries(currentSample.audio).map(([voice, url]) => (
                  <div key={voice}>
                    <p className='text-black'>{voice}: <a href={url} target="_blank" rel="noopener noreferrer">{url}</a></p>
                  </div>
                ))}
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleEditClick}>Edit</button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => setCurrentIndex(currentIndex + 1)}>Next</button>
            </div>
          )}
        </div>
      )}
      <div className="mt-4 w-full max-w-md">
        <label htmlFor="audio-select" className="block mb-2">Select Audio Sample</label>
        <select
          id="audio-select"
          value={currentIndex}
          onChange={handleSelectChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          {filteredSamples.map((sample, index) => (
            <option className='text-black' key={sample.id} value={index}>
              {sample.text}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default EditAudioSamplePage;
