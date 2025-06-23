import React, { useState, useRef, useEffect } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";

interface AudioSample {
  id: string;
  text: string;
  url: string;
  audio?: { [key: string]: string };
}

const BasicDictation: React.FC = () => {
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([]);
  const [currentSample, setCurrentSample] = useState<AudioSample | null>(null);
  const [userInput, setUserInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [chunks, setChunks] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchAudioSamples = async () => {
      try {
        setLoading(true);
        // Try to get samples from writefromdictation collection first
        let samplesQuery = query(
          collection(db, "writefromdictation"), 
          where("isHidden", "==", false),
          limit(10)
        );
        
        let querySnapshot = await getDocs(samplesQuery);
        let samples: AudioSample[] = [];
        
        if (!querySnapshot.empty) {
          samples = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              text: data.text,
              url: data.audio?.Brian || Object.values(data.audio)[0],
              audio: data.audio
            };
          });
        } else {
          // If no samples in writefromdictation, try shadowing collection
          samplesQuery = query(
            collection(db, "shadowing"),
            orderBy("name"),
            limit(10)
          );
          
          querySnapshot = await getDocs(samplesQuery);
          
          if (!querySnapshot.empty) {
            // For each shadowing document, get its sentences
            for (const doc of querySnapshot.docs) {
              const sentenceRef = collection(db, "shadowing", doc.id, "sentence");
              const sentenceSnapshot = await getDocs(query(sentenceRef, orderBy("timestamp")));
              
              sentenceSnapshot.docs.forEach(sentenceDoc => {
                samples.push({
                  id: sentenceDoc.id,
                  text: sentenceDoc.get("text"),
                  url: sentenceDoc.get("url")
                });
              });
            }
          }
        }
        
        setAudioSamples(samples);
        if (samples.length > 0) {
          setCurrentSample(samples[0]);
          createChunks(samples[0].text);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching audio samples:", error);
        setLoading(false);
      }
    };
    
    fetchAudioSamples();
  }, []);

  const createChunks = (text: string) => {
    // Split text into chunks based on natural breaks (punctuation, phrases)
    // This is a simple implementation - could be enhanced with NLP
    const rawChunks = text
      .replace(/([.!?])\s*/g, "$1|") // Split at sentence endings
      .replace(/([,;:])\s*/g, "$1|") // Split at commas, semicolons, colons
      .split("|")
      .filter(chunk => chunk.trim().length > 0);
    
    setChunks(rawChunks);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
  };

  const handleCheck = () => {
    if (!currentSample) return;
    
    // Simple comparison - could be enhanced with more sophisticated matching
    const normalizedInput = userInput.trim().toLowerCase();
    const normalizedAnswer = currentSample.text.trim().toLowerCase();
    
    setIsCorrect(normalizedInput === normalizedAnswer);
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (!audioSamples.length) return;
    
    const currentIndex = currentSample 
      ? audioSamples.findIndex(sample => sample.id === currentSample.id)
      : -1;
    
    const nextIndex = (currentIndex + 1) % audioSamples.length;
    const nextSample = audioSamples[nextIndex];
    
    setCurrentSample(nextSample);
    createChunks(nextSample.text);
    setUserInput("");
    setShowAnswer(false);
    setIsCorrect(null);
    
    // Reset audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fc5d01]"></div>
      </div>
    );
  }

  if (!currentSample) {
    return (
      <div className="p-6 bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-lg">
        <p className="text-lg text-gray-700">Không tìm thấy mẫu âm thanh nào.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-[#fc5d01] mb-4">Nghe – Chép (Basic Dictation)</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Nghe audio và gõ lại nội dung bạn nghe được:</p>
        <audio 
          ref={audioRef}
          controls 
          src={currentSample.url} 
          className="w-full mb-4"
        />
        
        <button
          onClick={handlePlayAudio}
          className="px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-300 mb-4"
        >
          Phát Audio
        </button>
      </div>
      
      {/* Chunking visualization */}
      {showAnswer && (
        <div className="mb-6 p-4 bg-[#fedac2] rounded-lg">
          <h3 className="font-bold text-[#fc5d01] mb-2">Chunking (chia cụm):</h3>
          <div className="flex flex-wrap gap-2">
            {chunks.map((chunk, index) => (
              <span 
                key={index} 
                className="inline-block px-2 py-1 bg-[#ffac7b] text-gray-800 rounded"
              >
                {chunk}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <textarea
          value={userInput}
          onChange={handleInputChange}
          placeholder="Gõ nội dung bạn nghe được..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fc5d01] min-h-[120px] text-black font-medium"
        />
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handleCheck}
          className="px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-300"
          disabled={showAnswer}
        >
          Kiểm Tra
        </button>
        
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-[#fd7f33] text-white rounded-lg hover:bg-[#fdbc94] transition-colors duration-300"
        >
          Câu Tiếp Theo
        </button>
      </div>
      
      {showAnswer && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100 border border-green-500' : 'bg-red-100 border border-red-500'}`}>
          <h3 className="font-bold mb-2 text-black">{isCorrect ? 'Chính xác!' : 'Chưa chính xác'}</h3>
          <p className="font-medium text-black">Đáp án đúng:</p>
          <p className="p-2 bg-white rounded text-black">{currentSample.text}</p>
        </div>
      )}
    </div>
  );
};

export default BasicDictation;
