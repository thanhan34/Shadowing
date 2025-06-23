import React, { useState, useRef, useEffect } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";

interface AudioSample {
  id: string;
  text: string;
  url: string;
  audio?: { [key: string]: string };
}

const RepeatAndType: React.FC = () => {
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([]);
  const [currentSample, setCurrentSample] = useState<AudioSample | null>(null);
  const [userInput, setUserInput] = useState("");
  const [userRecording, setUserRecording] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingPermission, setRecordingPermission] = useState<boolean | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recordingRef = useRef<HTMLAudioElement>(null);
  const chunksRef = useRef<BlobPart[]>([]);

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
    
    // Check for microphone permission
    checkMicrophonePermission();
    
    // Cleanup
    return () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingPermission(true);
      
      // Stop all tracks to release the microphone
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error("Microphone permission denied:", error);
      setRecordingPermission(false);
      setRecordingError("Vui lòng cấp quyền truy cập microphone để sử dụng tính năng này.");
    }
  };

  const startRecording = async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setUserRecording(url);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      setRecordingError("Không thể bắt đầu ghi âm. Vui lòng kiểm tra quyền truy cập microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
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
    setUserInput("");
    setUserRecording(null);
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

  const handlePlayRecording = () => {
    if (recordingRef.current) {
      recordingRef.current.play();
    }
  };

  const handleListenAndRepeat = async () => {
    if (audioRef.current) {
      // First play the original audio
      audioRef.current.play();
      
      // Wait for the audio to finish
      await new Promise(resolve => {
        audioRef.current!.onended = resolve;
      });
      
      // Then start recording
      startRecording();
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

  if (recordingPermission === false) {
    return (
      <div className="p-6 bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-[#fc5d01] mb-4">Nghe – Nói – Gõ lại (Repeat + Type)</h2>
        <div className="p-4 bg-red-100 border border-red-500 rounded-lg">
          <p className="text-red-700">{recordingError || "Vui lòng cấp quyền truy cập microphone để sử dụng tính năng này."}</p>
          <button
            onClick={checkMicrophonePermission}
            className="mt-2 px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-300"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-[#fc5d01] mb-4">Nghe – Nói – Gõ lại (Repeat + Type)</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Nghe audio, nhắc lại và gõ nội dung:</p>
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
          
          <button
            onClick={handleListenAndRepeat}
            className="px-4 py-2 bg-[#fd7f33] text-white rounded-lg hover:bg-[#fdbc94] transition-colors duration-300"
            disabled={isRecording}
          >
            Nghe và Nhắc lại
          </button>
          
          {isRecording && (
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 animate-pulse"
            >
              Dừng ghi âm
            </button>
          )}
        </div>
      </div>
      
      {userRecording && (
        <div className="mb-6 p-4 bg-[#fedac2] rounded-lg">
          <p className="font-medium text-[#fc5d01] mb-2">Bản ghi âm của bạn:</p>
          <audio 
            ref={recordingRef}
            controls 
            src={userRecording} 
            className="w-full mb-2"
          />
          
          <button
            onClick={handlePlayRecording}
            className="px-4 py-2 bg-[#fdbc94] text-white rounded-lg hover:bg-[#ffac7b] transition-colors duration-300"
          >
            Phát bản ghi âm
          </button>
          
          <p className="mt-2 text-sm text-gray-600 italic">
            Phương pháp Peer Teaching: Ghi âm và so sánh với bản gốc để cải thiện phát âm.
          </p>
        </div>
      )}
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Gõ lại nội dung bạn đã nghe và nói:</p>
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
          
          <div className="mt-4 p-4 bg-[#fedac2] rounded-lg">
            <h4 className="font-medium text-[#fc5d01] mb-2">Hướng dẫn cải thiện:</h4>
            <ul className="list-disc pl-5 space-y-1 text-black">
              <li>So sánh bản ghi âm của bạn với bản gốc</li>
              <li>Chú ý đến ngữ điệu, trọng âm và nhịp điệu</li>
              <li>Luyện tập nhiều lần để cải thiện phát âm</li>
              <li>Ghi âm lại và so sánh sự tiến bộ</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepeatAndType;
