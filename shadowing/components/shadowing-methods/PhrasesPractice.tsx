import React, { useState, useRef, useEffect } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";

interface AudioSample {
  id: string;
  text: string;
  url: string;
  audio?: { [key: string]: string };
}

interface Phrase {
  text: string;
  userInput: string;
  isCorrect: boolean | null;
}

const PhrasesPractice: React.FC = () => {
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([]);
  const [currentSample, setCurrentSample] = useState<AudioSample | null>(null);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allCorrect, setAllCorrect] = useState<boolean | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
          createPhrases(samples[0].text);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching audio samples:", error);
        setLoading(false);
      }
    };
    
    fetchAudioSamples();
  }, []);

  const createPhrases = (text: string) => {
    // Remove HTML tags if present
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    // Split text into phrases based on punctuation and natural breaks
    const rawPhrases = cleanText
      .replace(/([.!?])\s*/g, "$1|") // Split at sentence endings
      .replace(/([,;:])\s*/g, "$1|") // Split at commas, semicolons, colons
      .split("|")
      .filter(phrase => phrase.trim().length > 0);
    
    // If there are too few phrases, split further by word count
    let finalPhrases = rawPhrases;
    if (rawPhrases.length < 3) {
      finalPhrases = [];
      rawPhrases.forEach(phrase => {
        const words = phrase.split(/\s+/);
        // Split into chunks of 3-5 words
        for (let i = 0; i < words.length; i += 4) {
          const chunk = words.slice(i, i + 4).join(" ");
          if (chunk.trim().length > 0) {
            finalPhrases.push(chunk);
          }
        }
      });
    }
    
    // Create phrase objects
    const phraseObjects = finalPhrases.map(phrase => ({
      text: phrase.trim(),
      userInput: "",
      isCorrect: null
    }));
    
    setPhrases(phraseObjects);
    setCurrentPhraseIndex(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPhrases = [...phrases];
    newPhrases[currentPhraseIndex].userInput = e.target.value;
    setPhrases(newPhrases);
  };

  const handleCheck = () => {
    if (phrases.length === 0) return;
    
    const newPhrases = [...phrases];
    const currentPhrase = newPhrases[currentPhraseIndex];
    
    // Simple comparison - could be enhanced with more sophisticated matching
    const normalizedInput = currentPhrase.userInput.trim().toLowerCase();
    const normalizedAnswer = currentPhrase.text.trim().toLowerCase();
    
    currentPhrase.isCorrect = normalizedInput === normalizedAnswer;
    newPhrases[currentPhraseIndex] = currentPhrase;
    
    setPhrases(newPhrases);
    
    // Check if all phrases have been attempted
    const allAttempted = newPhrases.every(phrase => phrase.isCorrect !== null);
    if (allAttempted) {
      const allCorrect = newPhrases.every(phrase => phrase.isCorrect === true);
      setAllCorrect(allCorrect);
      setShowAnswer(true);
    }
  };

  const handleNextPhrase = () => {
    if (currentPhraseIndex < phrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1);
      
      // Focus the input field
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      // Check if all phrases have been attempted
      const allAttempted = phrases.every(phrase => phrase.isCorrect !== null);
      if (allAttempted) {
        const allCorrect = phrases.every(phrase => phrase.isCorrect === true);
        setAllCorrect(allCorrect);
        setShowAnswer(true);
      }
    }
  };

  const handlePrevPhrase = () => {
    if (currentPhraseIndex > 0) {
      setCurrentPhraseIndex(currentPhraseIndex - 1);
      
      // Focus the input field
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleNext = () => {
    if (!audioSamples.length) return;
    
    const currentIndex = currentSample 
      ? audioSamples.findIndex(sample => sample.id === currentSample.id)
      : -1;
    
    const nextIndex = (currentIndex + 1) % audioSamples.length;
    const nextSample = audioSamples[nextIndex];
    
    setCurrentSample(nextSample);
    createPhrases(nextSample.text);
    setShowAnswer(false);
    setAllCorrect(null);
    
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

  const handleRestart = () => {
    if (!currentSample) return;
    
    createPhrases(currentSample.text);
    setShowAnswer(false);
    setAllCorrect(null);
    setCurrentPhraseIndex(0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fc5d01]"></div>
      </div>
    );
  }

  if (!currentSample || phrases.length === 0) {
    return (
      <div className="p-6 bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-lg">
        <p className="text-lg text-gray-700">Không tìm thấy mẫu âm thanh nào.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-[#fc5d01] mb-4">Học theo cụm từ (Phrase Practice)</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Nghe audio và gõ lại từng cụm từ:</p>
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
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-700">Cụm từ: <span className="font-bold">{currentPhraseIndex + 1}/{phrases.length}</span></p>
        </div>
        
        <div className="p-4 bg-[#fedac2] rounded-lg mb-4">
          <p className="font-medium text-[#fc5d01]">Cụm từ hiện tại:</p>
          <p className="text-lg font-bold">{phrases[currentPhraseIndex].text}</p>
        </div>
        
        <textarea
          ref={inputRef}
          value={phrases[currentPhraseIndex].userInput}
          onChange={handleInputChange}
          placeholder="Gõ lại cụm từ..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fc5d01] min-h-[80px] text-black font-medium"
          disabled={showAnswer}
        />
        
        {phrases[currentPhraseIndex].isCorrect !== null && (
          <div className={`mt-2 p-2 rounded-lg ${phrases[currentPhraseIndex].isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {phrases[currentPhraseIndex].isCorrect ? 'Chính xác!' : 'Chưa chính xác'}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handlePrevPhrase}
          className="px-4 py-2 bg-[#fdbc94] text-white rounded-lg hover:bg-[#ffac7b] transition-colors duration-300"
          disabled={currentPhraseIndex === 0 || showAnswer}
        >
          Cụm Trước
        </button>
        
        <button
          onClick={handleCheck}
          className="px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-300"
          disabled={showAnswer}
        >
          Kiểm Tra
        </button>
        
        <button
          onClick={handleNextPhrase}
          className="px-4 py-2 bg-[#fd7f33] text-white rounded-lg hover:bg-[#fdbc94] transition-colors duration-300"
          disabled={currentPhraseIndex === phrases.length - 1 || showAnswer}
        >
          Cụm Tiếp
        </button>
        
        <button
          onClick={handleRestart}
          className="px-4 py-2 bg-[#ffac7b] text-white rounded-lg hover:bg-[#fedac2] transition-colors duration-300"
        >
          Bắt Đầu Lại
        </button>
        
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-300"
        >
          Câu Tiếp Theo
        </button>
      </div>
      
      {showAnswer && (
        <div className={`p-4 rounded-lg ${allCorrect ? 'bg-green-100 border border-green-500' : 'bg-red-100 border border-red-500'}`}>
          <h3 className="font-bold mb-2 text-black">{allCorrect ? 'Tất cả đều chính xác!' : 'Có một số cụm từ chưa chính xác'}</h3>
          
          <p className="font-medium text-black">Kết quả chi tiết:</p>
          <div className="mt-2 space-y-2">
            {phrases.map((phrase, index) => (
              <div 
                key={index}
                className={`p-2 rounded ${phrase.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
              >
                <p className="font-medium text-black">Cụm {index + 1}:</p>
                <p className="text-black">Đáp án: {phrase.text}</p>
                <p className="text-black">Bạn gõ: {phrase.userInput}</p>
              </div>
            ))}
          </div>
          
          <p className="mt-4 text-sm text-black italic">
            Phương pháp Chunking + Story Linking: Chia câu thành cụm nhỏ để dễ nhớ, sau đó ghép lại thành câu hoàn chỉnh.
          </p>
        </div>
      )}
    </div>
  );
};

export default PhrasesPractice;
