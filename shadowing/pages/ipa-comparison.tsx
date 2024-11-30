import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { convertToIPA } from '../utils/ipaConverter';
import { transcribeAudio } from '../utils/transcribe';

interface ComparisonResult {
  word: string;
  expected: string;
  actual: string;
  difference: number;
  isMatch: boolean;
}

type RecordingStatus = 'idle' | 'initializing' | 'recording' | 'processing';
type PermissionStatus = 'not-requested' | 'requesting' | 'granted' | 'denied';

const IPAComparison = () => {
  const [text, setText] = useState('');
  const [textIPA, setTextIPA] = useState('');
  const [audioText, setAudioText] = useState('');
  const [audioIPA, setAudioIPA] = useState('');
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [error, setError] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('not-requested');
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  const hasRequestedPermission = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-black placeholder-gray-400";

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    // Convert to IPA
    convertToIPA(newText).then(ipaText => {
      setTextIPA(ipaText);
      if (audioIPA) {
        compareIPAs(newText, ipaText, audioText, audioIPA);
      }
    }).catch(() => {
      setError('Error converting text to IPA');
    });
  };

  const checkMicrophonePermission = async () => {
    // Skip if we've already checked permissions
    if (hasRequestedPermission.current) {
      console.log('Permission already checked');
      return permissionStatus === 'granted';
    }

    hasRequestedPermission.current = true;

    try {
      // Check if permission is already granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevice = devices.find(device => device.kind === 'audioinput');
      
      if (audioDevice?.label) {
        // If we can see the label, permission was already granted
        console.log('Microphone permission already granted');
        setPermissionStatus('granted');
        return true;
      }

      // Request permission if not already granted
      console.log('Requesting microphone permission...');
      setPermissionStatus('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('Microphone permission granted');
      setPermissionStatus('granted');
      return true;
    } catch (err) {
      console.error('Error checking/requesting microphone permission:', err);
      setPermissionStatus('denied');
      setError('Please allow microphone access to use voice recording.');
      return false;
    }
  };

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition is not supported in your browser');
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Add error recovery
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'network') {
        // Attempt to restart recognition after a short delay
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to restart speech recognition...');
          try {
            recognition.stop();
            recognition.start();
          } catch (err) {
            console.error('Error restarting recognition:', err);
            setError('Unable to restart speech recognition. Please try again.');
            setRecordingStatus('idle');
          }
        }, 1000);
      } else if (event.error === 'not-allowed') {
        setError('Microphone access was denied. Please allow microphone access in your browser settings.');
        setPermissionStatus('denied');
        setRecordingStatus('idle');
      } else if (event.error === 'no-speech') {
        // Don't show error for no-speech, just keep listening
        console.log('No speech detected, continuing to listen...');
      } else {
        setError(`Speech recognition error: ${event.error}`);
        setRecordingStatus('idle');
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      // Only stop if we're not trying to restart
      if (!retryTimeoutRef.current) {
        setRecordingStatus('idle');
      }
    };

    return recognition;
  };

  const startRecording = async () => {
    console.log('Starting recording...');
    setError('');
    setRecordingStatus('initializing');
    
    try {
      // Check microphone permission if not already granted
      if (permissionStatus !== 'granted') {
        const permitted = await checkMicrophonePermission();
        if (!permitted) {
          setRecordingStatus('idle');
          return;
        }
      }

      console.log('Initializing speech recognition...');
      setAudioText('');
      setAudioIPA('');
      setComparisonResults([]);

      const recognition = initializeSpeechRecognition();
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setRecordingStatus('recording');
        setError(''); // Clear any previous errors
      };

      recognition.onresult = async (event: any) => {
        console.log('Speech recognition result received');
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            setAudioText(finalTranscript.trim());
            
            try {
              const ipaText = await convertToIPA(finalTranscript.trim());
              setAudioIPA(ipaText);
              if (textIPA) {
                compareIPAs(text, textIPA, finalTranscript.trim(), ipaText);
              }
            } catch (err) {
              console.error('Error converting to IPA:', err);
              setError('Error converting speech to IPA');
            }
          } else {
            interimTranscript = transcript;
            setAudioText(prevText => {
              const newText = (prevText || '') + ' ' + interimTranscript;
              console.log('Updated audio text:', newText);
              return newText;
            });
          }
        }
      };

      console.log('Starting speech recognition...');
      await recognition.start();
    } catch (err) {
      console.error('Error starting recording:', err);
      if (err instanceof Error && err.message === 'Speech recognition is not supported in your browser') {
        setError('Speech recognition is not supported in your browser. Please use Chrome.');
      } else {
        setError('Error starting recording. Please make sure you are using a supported browser and have a working microphone.');
      }
      setRecordingStatus('idle');
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setRecordingStatus('idle');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset previous transcription
      setAudioText('');
      setAudioIPA('');
      setComparisonResults([]);
      setError('');
      setIsTranscribing(true);

      // Create audio URL for playback
      const url = URL.createObjectURL(file);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }

      // Start transcription
      transcribeAudio(file).then(transcript => {
        console.log('Transcription result:', transcript);
        setAudioText(transcript);

        // Convert transcript to IPA
        return convertToIPA(transcript).then(ipaText => {
          setAudioIPA(ipaText);
          if (textIPA) {
            compareIPAs(text, textIPA, transcript, ipaText);
          }
        });
      }).catch(err => {
        console.error('Error processing audio:', err);
        setError('Error processing audio. Please try again.');
      }).finally(() => {
        setIsTranscribing(false);
      });
    }
  };

  const compareIPAs = (originalText: string, expectedIPA: string, actualText: string, actualIPA: string) => {
    const originalWords = originalText.toLowerCase().split(/\s+/);
    const actualWords = actualText.toLowerCase().split(/\s+/);
    const expectedIPAWords = expectedIPA.split(/\s+/);
    const actualIPAWords = actualIPA.split(/\s+/);
    
    const results: ComparisonResult[] = [];
    
    const maxLength = Math.max(originalWords.length, actualWords.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < originalWords.length && i < actualWords.length) {
        const originalWord = originalWords[i];
        const expectedIPA = expectedIPAWords[i] || '';
        const actualIPA = actualIPAWords[i] || '';
        const isMatch = expectedIPA === actualIPA;
        
        if (!isMatch) {
          results.push({
            word: originalWord,
            expected: expectedIPA,
            actual: actualIPA,
            difference: calculatePhonemeDistance(expectedIPA, actualIPA),
            isMatch: false
          });
        }
      }
    }
    
    results.sort((a, b) => b.difference - a.difference);
    setComparisonResults(results);
  };

  const calculatePhonemeDistance = (expected: string, actual: string): number => {
    const matrix: number[][] = Array(expected.length + 1).fill(null)
      .map(() => Array(actual.length + 1).fill(0));

    for (let i = 0; i <= expected.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= actual.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= expected.length; i++) {
      for (let j = 1; j <= actual.length; j++) {
        const cost = expected[i - 1] === actual[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[expected.length][actual.length];
  };

  useEffect(() => {
    // Check microphone permission on mount
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      console.log('Checking initial microphone permission...');
      checkMicrophonePermission();
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      const currentAudioRef = audioRef.current;
      if (currentAudioRef?.src) {
        URL.revokeObjectURL(currentAudioRef.src);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const getRecordButtonText = () => {
    switch (recordingStatus) {
      case 'initializing':
        return 'Initializing...';
      case 'recording':
        return 'Stop Recording';
      case 'processing':
        return 'Processing...';
      default:
        return 'Start Recording';
    }
  };

  const getRecordButtonStyle = () => {
    if (permissionStatus === 'denied') {
      return 'bg-gray-400 cursor-not-allowed';
    }
    if (recordingStatus === 'recording') {
      return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    }
    if (recordingStatus === 'initializing' || recordingStatus === 'processing') {
      return 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500';
    }
    return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            IPA Pronunciation Comparison
          </h1>
          <Link
            href="/ipa-dictionary"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Manage IPA Dictionary
          </Link>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Reference Text
            </label>
            <textarea
              className={inputClasses}
              rows={4}
              value={text}
              onChange={handleTextChange}
              placeholder="Enter the reference text..."
            />
            {textIPA && (
              <div className="mt-2">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Reference IPA</h2>
                <div className="bg-gray-50 p-3 rounded-lg font-mono text-black">
                  {textIPA}
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Record or Upload Audio
                </label>
                {permissionStatus !== 'not-requested' && (
                  <span className={`text-sm ${
                    permissionStatus === 'granted' ? 'text-green-600' : 
                    permissionStatus === 'denied' ? 'text-red-600' : 
                    'text-yellow-600'
                  }`}>
                    {permissionStatus === 'granted' ? 'Microphone access granted' :
                     permissionStatus === 'denied' ? 'Microphone access denied' :
                     'Requesting microphone access...'}
                  </span>
                )}
              </div>
              <button
                onClick={recordingStatus === 'recording' ? stopRecording : startRecording}
                disabled={permissionStatus === 'denied' || recordingStatus === 'initializing' || recordingStatus === 'processing'}
                className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors text-white ${getRecordButtonStyle()}`}
              >
                {getRecordButtonText()}
              </button>
            </div>
            <div className="mb-4">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={isTranscribing || recordingStatus !== 'idle'}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
              />
            </div>
            <div className="mt-4">
              <audio ref={audioRef} controls className="w-full" />
            </div>
            {isTranscribing && (
              <div className="mt-2 flex items-center text-sm text-indigo-600">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Transcribing audio with Azure Speech Services...
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Transcript
            </label>
            <div className="bg-gray-50 p-3 rounded-lg text-black min-h-[4rem]">
              {audioText || (
                <span className="text-gray-500">
                  {isTranscribing ? 'Transcribing...' : 
                   recordingStatus === 'recording' ? 'Recording... Speak now.' : 
                   recordingStatus === 'initializing' ? 'Initializing speech recognition...' :
                   recordingStatus === 'processing' ? 'Processing speech...' :
                   'Transcript will appear here after processing...'}
                </span>
              )}
            </div>
            {audioIPA && (
              <div className="mt-2">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Audio Transcript IPA</h2>
                <div className="bg-gray-50 p-3 rounded-lg font-mono text-black">
                  {audioIPA}
                </div>
              </div>
            )}
          </div>

          {comparisonResults.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Pronunciation Differences
              </h2>
              <div className="space-y-3">
                {comparisonResults.map((result, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{result.word}</span>
                      <span className="text-sm text-gray-500">
                        Difference Score: {result.difference}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Expected: </span>
                        <span className="font-mono text-black">{result.expected}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Actual: </span>
                        <span className="font-mono text-black">{result.actual}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IPAComparison;
