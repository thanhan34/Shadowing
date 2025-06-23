import React, { useState, useRef, useEffect } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";

interface AudioSample {
  id: string;
  text: string;
  url: string;
  audio?: { [key: string]: string };
}

interface GapWord {
  word: string;
  isHidden: boolean;
  userInput: string;
}

const GapFill: React.FC = () => {
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([]);
  const [currentSample, setCurrentSample] = useState<AudioSample | null>(null);
  const [gapWords, setGapWords] = useState<GapWord[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(true);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
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
          createGapWords(samples[0].text);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching audio samples:", error);
        setLoading(false);
      }
    };
    
    fetchAudioSamples();
  }, []);

  useEffect(() => {
    if (currentSample) {
      createGapWords(currentSample.text);
    }
  }, [currentSample, difficulty]);

  const createGapWords = (text: string) => {
    // Remove HTML tags if present
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    // Split text into words
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    
    // Determine how many words to hide based on difficulty
    let hidePercentage: number;
    switch (difficulty) {
      case "easy":
        hidePercentage = 0.2; // 20% of words hidden
        break;
      case "medium":
        hidePercentage = 0.4; // 40% of words hidden
        break;
      case "hard":
        hidePercentage = 0.6; // 60% of words hidden
        break;
      default:
        hidePercentage = 0.4;
    }
    
    // Create array of indices to hide
    const totalWords = words.length;
    const wordsToHide = Math.floor(totalWords * hidePercentage);
    
    // Randomly select indices to hide
    const hideIndices = new Set<number>();
    while (hideIndices.size < wordsToHide) {
      const randomIndex = Math.floor(Math.random() * totalWords);
      // Don't hide very short words (less than 3 characters)
      if (words[randomIndex].replace(/[.,!?;:]/g, '').length >= 3) {
        hideIndices.add(randomIndex);
      }
    }
    
    // Create gap words array
    const newGapWords = words.map((word, index) => ({
      word,
      isHidden: hideIndices.has(index),
      userInput: ""
    }));
    
    setGapWords(newGapWords);
  };

  const handleInputChange = (index: number, value: string) => {
    const updatedGapWords = [...gapWords];
    updatedGapWords[index].userInput = value;
    setGapWords(updatedGapWords);
  };

  const handleCheck = () => {
    if (!gapWords.length) return;
    
    // Check if all hidden words are filled correctly
    const allCorrect = gapWords.every(word => 
      !word.isHidden || 
      word.userInput.trim().toLowerCase() === word.word.trim().toLowerCase().replace(/[.,!?;:]/g, '')
    );
    
    setIsCorrect(allCorrect);
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

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDifficulty(e.target.value as "easy" | "medium" | "hard");
  };

  const handleRevealOneWord = () => {
    // Find a hidden word that hasn't been correctly filled
    const hiddenWordIndex = gapWords.findIndex(
      word => word.isHidden && word.userInput.trim().toLowerCase() !== word.word.trim().toLowerCase().replace(/[.,!?;:]/g, '')
    );
    
    if (hiddenWordIndex !== -1) {
      const updatedGapWords = [...gapWords];
      updatedGapWords[hiddenWordIndex].userInput = updatedGapWords[hiddenWordIndex].word.replace(/[.,!?;:]/g, '');
      setGapWords(updatedGapWords);
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
      <h2 className="text-2xl font-bold text-[#fc5d01] mb-4">Điền từ còn thiếu (Gap-fill)</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Nghe audio và điền vào chỗ trống:</p>
        <audio 
          ref={audioRef}
          controls 
          src={currentSample.url} 
          className="w-full mb-4"
        />
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handlePlayAudio}
            className="px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-300"
          >
            Phát Audio
          </button>
          
          <select
            value={difficulty}
            onChange={handleDifficultyChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fc5d01] text-black font-medium"
          >
            <option value="easy" className="text-black font-medium">Dễ (20% từ bị ẩn)</option>
            <option value="medium" className="text-black font-medium">Trung bình (40% từ bị ẩn)</option>
            <option value="hard" className="text-black font-medium">Khó (60% từ bị ẩn)</option>
          </select>
        </div>
      </div>
      
      <div className="mb-6 p-4 bg-white rounded-lg">
        <div className="flex flex-wrap gap-2">
          {gapWords.map((gapWord, index) => (
            <div key={index} className="inline-block">
              {gapWord.isHidden ? (
                <input
                  type="text"
                  value={gapWord.userInput}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  className={`w-24 px-2 py-1 border ${
                    showAnswer 
                      ? gapWord.userInput.trim().toLowerCase() === gapWord.word.trim().toLowerCase().replace(/[.,!?;:]/g, '')
                        ? 'border-green-500 bg-green-50 text-black font-medium' 
                        : 'border-red-500 bg-red-50 text-black font-medium'
                      : 'border-[#fc5d01] bg-white text-black font-medium'
                  } rounded focus:outline-none focus:ring-1 focus:ring-[#fc5d01]`}
                  placeholder="_ _ _"
                  disabled={showAnswer}
                />
              ) : (
                <span className="px-2 py-1 text-black font-medium">{gapWord.word}</span>
              )}
            </div>
          ))}
        </div>
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
          onClick={handleRevealOneWord}
          className="px-4 py-2 bg-[#fdbc94] text-white rounded-lg hover:bg-[#ffac7b] transition-colors duration-300"
          disabled={showAnswer}
        >
          Gợi Ý (Hiện 1 Từ)
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
          <p className="mt-2 text-sm text-black italic">
            Phương pháp Reverse Dictation: Bắt đầu với một số từ được hiển thị, sau đó dần dần ẩn đi để giúp ghi nhớ.
          </p>
        </div>
      )}
    </div>
  );
};

export default GapFill;
