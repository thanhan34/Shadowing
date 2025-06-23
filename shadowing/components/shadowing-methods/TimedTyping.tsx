import React, { useState, useRef, useEffect } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";

interface AudioSample {
  id: string;
  text: string;
  url: string;
  audio?: { [key: string]: string };
}

interface TimerState {
  isRunning: boolean;
  timeLeft: number;
  totalTime: number;
}

const TimedTyping: React.FC = () => {
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([]);
  const [currentSample, setCurrentSample] = useState<AudioSample | null>(null);
  const [userInput, setUserInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [typingSpeed, setTypingSpeed] = useState<number | null>(null);
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    timeLeft: 15, // Default 15 seconds
    totalTime: 15
  });
  const [loopMode, setLoopMode] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching audio samples:", error);
        setLoading(false);
      }
    };
    
    fetchAudioSamples();
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timer.isRunning) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev.timeLeft <= 1) {
            // Time's up
            clearInterval(timerRef.current as NodeJS.Timeout);
            handleTimeUp();
            return { ...prev, isRunning: false, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timer.isRunning]);

  const handleTimeUp = () => {
    if (!currentSample) return;
    
    // Calculate typing speed (characters per minute)
    const charactersTyped = userInput.length;
    const minutesElapsed = timer.totalTime / 60;
    const cpm = Math.round(charactersTyped / minutesElapsed);
    
    setTypingSpeed(cpm);
    
    // Check correctness
    const normalizedInput = userInput.trim().toLowerCase();
    const normalizedAnswer = currentSample.text.trim().toLowerCase();
    const isAnswerCorrect = normalizedInput === normalizedAnswer;
    
    setIsCorrect(isAnswerCorrect);
    setShowAnswer(true);
    
    // If in loop mode and answer is incorrect, restart after a delay
    if (loopMode && !isAnswerCorrect) {
      setAttempts(prev => prev + 1);
      setTimeout(() => {
        handleRestart();
      }, 3000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
  };

  const handleStart = () => {
    if (audioRef.current) {
      audioRef.current.play();
      
      // Focus the input field
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      // Start the timer
      setTimer(prev => ({ ...prev, isRunning: true }));
      setUserInput("");
      setShowAnswer(false);
      setIsCorrect(null);
      setTypingSpeed(null);
    }
  };

  const handleRestart = () => {
    // Reset timer
    setTimer({
      isRunning: true,
      timeLeft: timer.totalTime,
      totalTime: timer.totalTime
    });
    
    // Reset input
    setUserInput("");
    setShowAnswer(false);
    setIsCorrect(null);
    setTypingSpeed(null);
    
    // Play audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      
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
    setUserInput("");
    setShowAnswer(false);
    setIsCorrect(null);
    setTypingSpeed(null);
    setAttempts(0);
    
    // Reset timer
    setTimer({
      isRunning: false,
      timeLeft: timer.totalTime,
      totalTime: timer.totalTime
    });
    
    // Reset audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleTimerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTime = parseInt(e.target.value, 10);
    setTimer({
      isRunning: false,
      timeLeft: newTime,
      totalTime: newTime
    });
  };

  const toggleLoopMode = () => {
    setLoopMode(!loopMode);
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
      <h2 className="text-2xl font-bold text-[#fc5d01] mb-4">Gõ theo thời gian (Timed Typing)</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Nghe audio và gõ lại nội dung trong thời gian giới hạn:</p>
        <audio 
          ref={audioRef}
          controls 
          src={currentSample.url} 
          className="w-full mb-4"
        />
        
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={timer.totalTime}
            onChange={handleTimerChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fc5d01] text-black font-medium"
            disabled={timer.isRunning}
          >
            <option value="10" className="text-black">10 giây</option>
            <option value="15" className="text-black">15 giây</option>
            <option value="20" className="text-black">20 giây</option>
            <option value="30" className="text-black">30 giây</option>
          </select>
          
          <button
            onClick={toggleLoopMode}
            className={`px-4 py-2 ${loopMode ? 'bg-[#fc5d01]' : 'bg-[#fdbc94]'} text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-300`}
          >
            {loopMode ? 'Tắt Dictation Loop' : 'Bật Dictation Loop'}
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-700">Thời gian còn lại: <span className="font-bold">{timer.timeLeft}s</span></p>
          {loopMode && attempts > 0 && (
            <p className="text-gray-700">Số lần thử: <span className="font-bold">{attempts}</span></p>
          )}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-[#fc5d01] h-2.5 rounded-full" 
            style={{ width: `${(timer.timeLeft / timer.totalTime) * 100}%` }}
          ></div>
        </div>
        
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={handleInputChange}
          placeholder="Gõ nội dung bạn nghe được..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fc5d01] min-h-[120px] text-black font-medium"
          disabled={!timer.isRunning || showAnswer}
        />
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handleStart}
          className="px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-300"
          disabled={timer.isRunning}
        >
          Bắt đầu
        </button>
        
        <button
          onClick={handleRestart}
          className="px-4 py-2 bg-[#fdbc94] text-white rounded-lg hover:bg-[#ffac7b] transition-colors duration-300"
          disabled={timer.isRunning}
        >
          Thử lại
        </button>
        
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-[#fd7f33] text-white rounded-lg hover:bg-[#fdbc94] transition-colors duration-300"
          disabled={timer.isRunning}
        >
          Câu Tiếp Theo
        </button>
      </div>
      
      {showAnswer && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100 border border-green-500' : 'bg-red-100 border border-red-500'}`}>
          <h3 className="font-bold mb-2 text-black">{isCorrect ? 'Chính xác!' : 'Chưa chính xác'}</h3>
          
          {typingSpeed !== null && (
            <p className="mb-2 text-black">Tốc độ gõ: <span className="font-bold">{typingSpeed}</span> ký tự/phút</p>
          )}
          
          <p className="font-medium text-black">Đáp án đúng:</p>
          <p className="p-2 bg-white rounded text-black">{currentSample.text}</p>
          
          {loopMode && !isCorrect && (
            <p className="mt-2 text-sm text-[#fc5d01] italic">
              Dictation Loop: Sẽ tự động thử lại sau 3 giây...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TimedTyping;
