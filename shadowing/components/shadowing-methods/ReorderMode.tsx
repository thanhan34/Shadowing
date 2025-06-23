import React, { useState, useRef, useEffect } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";

interface AudioSample {
  id: string;
  text: string;
  url: string;
  audio?: { [key: string]: string };
}

interface Word {
  id: string;
  content: string;
  originalIndex: number;
}

const ReorderMode: React.FC = () => {
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([]);
  const [currentSample, setCurrentSample] = useState<AudioSample | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [storyMode, setStoryMode] = useState(false);
  const [storyWords, setStoryWords] = useState<Word[]>([]);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
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
          createShuffledWords(samples[0].text);
          
          // Create story mode words from multiple samples if available
          if (samples.length >= 3) {
            createStoryWords(samples.slice(0, 3));
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching audio samples:", error);
        setLoading(false);
      }
    };
    
    fetchAudioSamples();
  }, []);

  const createShuffledWords = (text: string) => {
    // Remove HTML tags if present
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    // Split text into words
    const textWords = cleanText.split(/\s+/).filter(word => word.length > 0);
    
    // Create words with IDs
    const wordObjects: Word[] = textWords.map((word, index) => ({
      id: `word-${index}`,
      content: word,
      originalIndex: index
    }));
    
    // Shuffle the words
    const shuffledWords = [...wordObjects];
    for (let i = shuffledWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
    }
    
    setWords(shuffledWords);
  };

  const createStoryWords = (samples: AudioSample[]) => {
    // Combine multiple sentences into a story
    const allWords: Word[] = [];
    let wordIndex = 0;
    
    samples.forEach((sample, sampleIndex) => {
      // Remove HTML tags if present
      const cleanText = sample.text.replace(/<[^>]*>/g, '');
      
      // Split text into words
      const textWords = cleanText.split(/\s+/).filter(word => word.length > 0);
      
      // Add words with sample index info
      textWords.forEach((word) => {
        allWords.push({
          id: `story-word-${wordIndex}`,
          content: word,
          originalIndex: wordIndex
        });
        wordIndex++;
      });
      
      // Add a visual separator between sentences (except for the last one)
      if (sampleIndex < samples.length - 1) {
        allWords.push({
          id: `separator-${sampleIndex}`,
          content: "•••",
          originalIndex: -1 // Separator has no original index
        });
        wordIndex++;
      }
    });
    
    // Shuffle the words
    const shuffledStoryWords = [...allWords];
    for (let i = shuffledStoryWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledStoryWords[i], shuffledStoryWords[j]] = [shuffledStoryWords[j], shuffledStoryWords[i]];
    }
    
    setStoryWords(shuffledStoryWords);
  };

  const handleWordClick = (index: number) => {
    if (showAnswer) return; // Don't allow reordering after showing answer
    
    if (selectedWordIndex === null) {
      // Select the word
      setSelectedWordIndex(index);
    } else {
      // Swap the selected word with the clicked word
      const activeWords = storyMode ? [...storyWords] : [...words];
      const temp = activeWords[selectedWordIndex];
      activeWords[selectedWordIndex] = activeWords[index];
      activeWords[index] = temp;
      
      if (storyMode) {
        setStoryWords(activeWords);
      } else {
        setWords(activeWords);
      }
      
      // Deselect
      setSelectedWordIndex(null);
    }
  };

  const handleCheck = () => {
    if (storyMode) {
      // In story mode, check if words are in correct order
      // Ignore separator items for checking
      const nonSeparatorWords = storyWords.filter(word => !word.content.includes("•••"));
      const isOrderCorrect = nonSeparatorWords.every((word, index) => {
        return word.originalIndex === index;
      });
      
      setIsCorrect(isOrderCorrect);
    } else {
      // In regular mode, check if words match original order
      const isOrderCorrect = words.every((word, index) => {
        return word.originalIndex === index;
      });
      
      setIsCorrect(isOrderCorrect);
    }
    
    setShowAnswer(true);
    setSelectedWordIndex(null);
  };

  const handleNext = () => {
    if (!audioSamples.length) return;
    
    const currentIndex = currentSample 
      ? audioSamples.findIndex(sample => sample.id === currentSample.id)
      : -1;
    
    const nextIndex = (currentIndex + 1) % audioSamples.length;
    const nextSample = audioSamples[nextIndex];
    
    setCurrentSample(nextSample);
    createShuffledWords(nextSample.text);
    setShowAnswer(false);
    setIsCorrect(null);
    setSelectedWordIndex(null);
    
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

  const toggleMode = () => {
    setStoryMode(!storyMode);
    setShowAnswer(false);
    setIsCorrect(null);
    setSelectedWordIndex(null);
  };

  const resetOrder = () => {
    if (storyMode) {
      // Shuffle story words again
      const shuffled = [...storyWords];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setStoryWords(shuffled);
    } else if (currentSample) {
      // Reshuffle current sample words
      createShuffledWords(currentSample.text);
    }
    
    setShowAnswer(false);
    setIsCorrect(null);
    setSelectedWordIndex(null);
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

  const activeWords = storyMode ? storyWords : words;

  return (
    <div className="p-6 bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-[#fc5d01] mb-4">Sắp xếp từ (Reorder Mode)</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Nghe audio và sắp xếp các từ theo đúng thứ tự:</p>
        {!storyMode && (
          <audio 
            ref={audioRef}
            controls 
            src={currentSample.url} 
            className="w-full mb-4"
          />
        )}
        
        <div className="flex flex-wrap gap-2 mb-4">
          {!storyMode && (
            <button
              onClick={handlePlayAudio}
              className="px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-300"
            >
              Phát Audio
            </button>
          )}
          
          <button
            onClick={toggleMode}
            className={`px-4 py-2 ${storyMode ? 'bg-[#fc5d01]' : 'bg-[#fdbc94]'} text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-300`}
          >
            {storyMode ? 'Chế độ Câu Đơn' : 'Chế độ Story Linking'}
          </button>
          
          <button
            onClick={resetOrder}
            className="px-4 py-2 bg-[#ffac7b] text-white rounded-lg hover:bg-[#fdbc94] transition-colors duration-300"
          >
            Xáo Trộn Lại
          </button>
        </div>
      </div>
      
      <div className="mb-6 p-4 bg-white rounded-lg">
        <div className="flex flex-wrap gap-2">
          {activeWords.map((word, index) => (
            <div
              key={word.id}
              onClick={() => handleWordClick(index)}
              className={`px-3 py-2 rounded-lg shadow-sm cursor-pointer ${
                word.content.includes("•••") 
                  ? 'bg-gray-200 text-gray-500 font-medium cursor-default' 
                  : selectedWordIndex === index
                    ? 'bg-[#fc5d01] text-white font-medium'
                    : showAnswer
                      ? (word.originalIndex === index 
                          ? 'bg-green-100 border border-green-500 text-black font-medium' 
                          : 'bg-red-100 border border-red-500 text-black font-medium')
                      : 'bg-[#fedac2] text-black font-medium border border-[#fd7f33] hover:bg-[#ffac7b]'
              }`}
            >
              {word.content}
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
        
        {!storyMode && (
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-[#fd7f33] text-white rounded-lg hover:bg-[#fdbc94] transition-colors duration-300"
          >
            Câu Tiếp Theo
          </button>
        )}
      </div>
      
      {showAnswer && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100 border border-green-500' : 'bg-red-100 border border-red-500'}`}>
          <h3 className="font-bold mb-2 text-black">{isCorrect ? 'Chính xác!' : 'Chưa chính xác'}</h3>
          <p className="font-medium text-black">Đáp án đúng:</p>
          {storyMode ? (
            <div className="p-2 bg-white rounded">
              {audioSamples.slice(0, 3).map((sample, index) => (
                <p key={index} className="mb-2 text-black">{sample.text}</p>
              ))}
            </div>
          ) : (
            <p className="p-2 bg-white rounded text-black">{currentSample.text}</p>
          )}
          <p className="mt-2 text-sm text-black italic">
            {storyMode 
              ? "Phương pháp Story Linking: Ghép các câu thành đoạn văn ngắn để hiểu bối cảnh tổng thể."
              : "Kéo thả các từ để sắp xếp lại đúng thứ tự, giúp hiểu cấu trúc câu."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReorderMode;
