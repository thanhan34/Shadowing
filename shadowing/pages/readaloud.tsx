import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';

const Home = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('');
  const [ipa, setIpa] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ffmpeg, setFfmpeg] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');

  useEffect(() => {
    const loadFfmpeg = async () => {
      try {
        const { FFmpeg } = await import('@ffmpeg/ffmpeg');
        setFfmpeg(new FFmpeg());
      } catch (error) {
        console.error('Error loading FFmpeg:', error);
      }
    };

    loadFfmpeg();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !ffmpeg) {
      alert('Please select an MP3 file and wait for FFmpeg to load.');
      return;
    }

    setIsLoading(true);
    try {
      // Load ffmpeg
      await ffmpeg.load();

      // Convert MP3 to WAV
      const fileData = await file.arrayBuffer();
      await ffmpeg.writeFile(file.name, new Uint8Array(fileData));
      await ffmpeg.exec(['-i', file.name, 'output.wav']);
      const data = await ffmpeg.readFile('output.wav');
      const audioBlob = new Blob([data], { type: 'audio/wav' });
      const audioURL = URL.createObjectURL(audioBlob);

      // Upload original MP3 to Firebase Storage
      const timestamp = Date.now();
      const storageRef = ref(storage, `readaloud/${timestamp}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setAudioUrl(downloadUrl);

      // Speech recognition using Web Speech API
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        const ipaText = convertTextToIPA(transcript);
        setIpa(ipaText);

        // Store results in Firestore
        try {
          await addDoc(collection(db, 'readaloud'), {
            timestamp: new Date(),
            audioUrl: downloadUrl,
            text: transcript,
            ipa: ipaText
          });
        } catch (error) {
          console.error('Error saving to Firestore:', error);
        }

        setIsLoading(false);
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setIsLoading(false);
      };
      recognition.onend = () => {
        setIsLoading(false);
      };

      // Audio playback (optional)
      const audio = new Audio(audioURL);
      audio.play();
      recognition.start();
    } catch (error) {
      console.error('Error during audio processing:', error);
      setIsLoading(false);
    }
  };

  const convertTextToIPA = (text: string) => {
    const ipaMapping: { [key: string]: string } = {
      a: 'ɑ',
      e: 'ɛ',
      i: 'i',
      o: 'oʊ',
      u: 'u',
      // Add more mappings for a complete conversion
    };
    const converted = text
      .split('')
      .map((char) => ipaMapping[char.toLowerCase()] || char)
      .join('');
    return converted;
  };

  return (
    <div className="flex flex-col items-center p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">MP3 to IPA Converter (Free Solution)</h1>
      <input type="file" accept=".mp3" onChange={handleFileChange} className="mb-4" />
      <button
        onClick={handleUpload}
        disabled={isLoading || !ffmpeg}
        className={`px-6 py-2 ${isLoading || !ffmpeg ? 'bg-gray-400' : 'bg-blue-600'} text-white font-semibold rounded-md shadow hover:bg-blue-700 transition`}
      >
        {isLoading ? 'Processing...' : ffmpeg ? 'Upload and Convert' : 'Loading FFmpeg...'}
      </button>
      {audioUrl && (
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Recording:</h2>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
      {text && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Recognized Text:</h2>
          <p className="mt-3">{text}</p>
        </div>
      )}
      {ipa && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Generated IPA:</h2>
          <p className="mt-3">{ipa}</p>
        </div>
      )}
    </div>
  );
};

export default Home;
