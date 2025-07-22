import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { db as oldDb } from '../firebase';
import { testDb as newDb } from '../firebaseTest';
import { storage } from '../firebase';
import { collection, doc, updateDoc, getDocs, CollectionReference, query, orderBy, Query, DocumentData, Timestamp, onSnapshot, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as XLSX from 'xlsx';

interface AudioSample {
  id: string;
  audio: { [key: string]: string };
  text: string;
  occurrence: number;
  createdAt: Timestamp;
  isHidden?: boolean;
  vietnameseTranslation?: string;
  topic?: string;
}

// Define default topics
const DEFAULT_TOPICS = [
  "Business & Work",
  "Education & Learning", 
  "Technology & Science",
  "Daily Life & Routine",
  "Health & Medicine",
  "Travel & Tourism",
  "Food & Cooking",
  "Sports & Recreation",
  "Environment & Nature",
  "Arts & Humanities",
  "General"
];

// SampleCard component for inline editing
interface SampleCardProps {
  sample: AudioSample;
  index: number;
  filterMode: 'translations' | 'audio' | 'topics';
  needsAttention: boolean;
  needsTranslation: boolean;
  needsTopic: boolean;
  onUpdate: (updatedSample: AudioSample) => Promise<void>;
}

const SampleCard: React.FC<SampleCardProps> = ({ 
  sample, 
  index, 
  filterMode, 
  needsAttention, 
  needsTranslation, 
  needsTopic, 
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSample, setEditedSample] = useState<AudioSample>(sample);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(editedSample);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedSample(sample);
    setIsEditing(false);
  };

  const getStatusIcon = () => {
    if (filterMode === 'translations' && needsTranslation) return '🔤';
    if (filterMode === 'audio') return '🎵';
    if (filterMode === 'topics' && needsTopic) return '🏷️';
    return '✅';
  };

  const getStatusText = () => {
    if (filterMode === 'translations') return 'Missing Translation';
    if (filterMode === 'audio') return 'Missing Audio';
    if (filterMode === 'topics') return 'Missing Topic';
    return 'Complete';
  };

  return (
    <div className={`
      relative p-4 rounded-lg border transition-all duration-200 hover:shadow-lg
      ${needsAttention 
        ? 'bg-gradient-to-r from-[#fc5d01]/10 to-[#fd7f33]/5 border-[#fc5d01]/30' 
        : 'bg-gradient-to-r from-gray-700/50 to-gray-600/30 border-gray-600/50'
      }
    `}>
      {/* Header with status and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className="text-xs font-medium text-[#ffac7b] bg-[#fc5d01]/20 px-2 py-1 rounded-full">
            #{index + 1} - {getStatusText()}
          </span>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              ✏️ Edit
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? '💾' : '✅'} Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                ❌ Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* English Text */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">English Text:</label>
          {isEditing ? (
            <textarea
              value={editedSample.text}
              onChange={(e) => setEditedSample({...editedSample, text: e.target.value})}
              className="w-full p-2 text-sm bg-gray-800 border border-gray-600 rounded text-white resize-none"
              rows={2}
            />
          ) : (
            <p className="text-white font-mono text-sm bg-gray-800/50 p-2 rounded">
              {sample.text}
            </p>
          )}
        </div>

        {/* Vietnamese Translation */}
        {(filterMode === 'translations' || sample.vietnameseTranslation) && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Vietnamese Translation:</label>
            {isEditing ? (
              <textarea
                value={editedSample.vietnameseTranslation || ''}
                onChange={(e) => setEditedSample({...editedSample, vietnameseTranslation: e.target.value})}
                placeholder="Enter Vietnamese translation..."
                className="w-full p-2 text-sm bg-gray-800 border border-gray-600 rounded text-white resize-none"
                rows={2}
              />
            ) : (
              <p className="text-gray-300 text-sm bg-gray-800/30 p-2 rounded italic">
                {sample.vietnameseTranslation || 'No translation available'}
              </p>
            )}
          </div>
        )}

        {/* Topic */}
        {(filterMode === 'topics' || sample.topic) && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Topic:</label>
            {isEditing ? (
              <select
                value={editedSample.topic || 'General'}
                onChange={(e) => setEditedSample({...editedSample, topic: e.target.value})}
                className="w-full p-2 text-sm bg-gray-800 border border-gray-600 rounded text-white"
              >
                {DEFAULT_TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            ) : (
              <span className="inline-block px-2 py-1 text-xs bg-[#fd7f33] text-white rounded-full">
                {sample.topic || 'General'}
              </span>
            )}
          </div>
        )}

        {/* Audio Status (for audio filter mode) */}
        {filterMode === 'audio' && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Audio Status:</label>
            <div className="flex gap-2 flex-wrap">
              {['Brian', 'Joanna', 'Olivia'].map(voice => {
                const hasAudio = sample.audio?.[voice] && sample.audio[voice].trim() !== '';
                return (
                  <span
                    key={voice}
                    className={`px-2 py-1 text-xs rounded-full ${
                      hasAudio 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {voice}: {hasAudio ? '✅' : '❌'}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-600/30">
          <span>Occurrence: {sample.occurrence}</span>
          <span>ID: {sample.id.slice(-6)}</span>
        </div>
      </div>
    </div>
  );
};

const EditAudioSamplePage: React.FC = () => {
  const [useNewDb, setUseNewDb] = useState(true);
  const db = useNewDb ? newDb : oldDb;
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<AudioSample[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterMode, setFilterMode] = useState<'translations' | 'audio' | 'topics'>('translations');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [currentSample, setCurrentSample] = useState<AudioSample | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; voice: string; text: string }>>([]);
  const [reusingUrls, setReusingUrls] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when switching projects
  const handleProjectSwitch = useCallback(() => {
    setUseNewDb(prev => !prev);
    setAudioSamples([]);
    setFilteredSamples([]);
    setCurrentIndex(0);
    setCurrentSample(null);
    setLoading(true);
    setUploadedFiles([]);
  }, []);

  // Firestore listener effect
  useEffect(() => {
    console.log('Setting up Firestore listener...');
    const collectionRef: CollectionReference<DocumentData> = collection(db, 'writefromdictation');
    // Query all documents and filter in memory
    const q: Query<DocumentData> = query(
      collectionRef,
      orderBy('text')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log('Firestore update received');
      
      const data = querySnapshot.docs
        .filter(doc => {
          const docData = doc.data();
          return docData.isHidden !== true;
        })
        .map(doc => {
          const docData = doc.data();
          const audio = docData.audio || {};
          const sample = {
          ...docData,
          id: doc.id,
          audio: {
            Brian: audio.Brian || '',
            Joanna: audio.Joanna || '',
            Olivia: audio.Olivia || '',
            ...audio // Keep any other existing audio URLs
          }
        } as AudioSample;

        return sample;
      });
      
      const validData = data.filter((item): item is AudioSample => item !== null);
      const sortedData = validData.sort((a, b) => a.text.localeCompare(b.text));
      setAudioSamples(sortedData);
      setLoading(false);

      // Log duplicate samples
      const textCount: { [text: string]: number } = {};
      data.forEach(sample => {
        textCount[sample.text] = (textCount[sample.text] || 0) + 1;
      });
      const duplicates = Object.keys(textCount).filter(text => textCount[text] > 1);
      if (duplicates.length > 0) {
        console.log('Duplicate texts:', duplicates);
      }
    }, (error) => {
      console.error('Error fetching data:', error);
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up Firestore listener...');
      unsubscribe();
    };
  }, [db]); // Add db dependency to re-run effect when project changes

  // Filter samples effect
  useEffect(() => {
    console.log('Filtering samples...');
    console.log('Total samples:', audioSamples.length);
    
    // Make sure we only show visible samples (isHidden === false)
    const visibleSamples = audioSamples.filter(sample => sample.isHidden !== true);
    console.log('Visible samples:', visibleSamples.length);
    
    let filtered = visibleSamples;
    
    // Filter based on filter mode
    filtered = visibleSamples.filter(sample => {
      // Check if the sample needs Vietnamese translation
      const needsVietnameseTranslation = !sample.vietnameseTranslation || sample.vietnameseTranslation.trim() === '';
      
      // Check if the sample is missing any audio links
      const voices = ['Brian', 'Joanna', 'Olivia'];
      const hasMissingAudio = voices.some(voice => {
        return !sample.audio?.[voice] || !sample.audio[voice].trim();
      });
      
      // Check if the sample is missing topic
      const needsTopic = !sample.topic || sample.topic.trim() === '';
      
      // Debug log for each sample
      if ((filterMode === 'translations' && needsVietnameseTranslation) || 
          (filterMode === 'audio' && hasMissingAudio) ||
          (filterMode === 'topics' && needsTopic)) {
        console.log('Sample matching current filter:', {
          text: sample.text,
          needsVietnameseTranslation,
          hasMissingAudio,
          needsTopic,
          audio: sample.audio
        });
      }
      
      // Filter based on mode
      switch (filterMode) {
        case 'translations':
          return needsVietnameseTranslation;
        case 'audio':
          return hasMissingAudio;
        case 'topics':
          return needsTopic;
        default:
          return needsVietnameseTranslation;
      }
    });
    
    console.log('Filtered samples:', filtered.length);
    
    setFilteredSamples(filtered);
    // Reset current index when filter changes to avoid out of bounds
    if (filtered.length > 0) {
      const newIndex = currentIndex < filtered.length ? currentIndex : 0;
      setCurrentIndex(newIndex);
      setCurrentSample(filtered[newIndex]);
    } else {
      setCurrentSample(null);
    }
  }, [audioSamples, currentIndex, filterMode]);

  // Function to find existing audio URLs for a voice
  const findExistingAudioUrl = useCallback((text: string, voice: string) => {
    return audioSamples.find(sample => 
      sample.text === text && 
      sample.audio?.[voice] && 
      typeof sample.audio[voice] === 'string' && 
      sample.audio[voice].trim() !== ''
    )?.audio[voice];
  }, [audioSamples]);

  // Function to reuse existing audio URLs
  const reuseExistingUrls = useCallback(async () => {
    setReusingUrls(true);
    let updated = 0;
    
    for (const sample of audioSamples) {
      const updatedAudio = { ...sample.audio };
      let hasUpdates = false;

      ['Brian', 'Joanna', 'Olivia'].forEach(voice => {
        if (!updatedAudio[voice] || !updatedAudio[voice].trim()) {
          const existingUrl = findExistingAudioUrl(sample.text, voice);
          if (existingUrl) {
            updatedAudio[voice] = existingUrl;
            hasUpdates = true;
          }
        }
      });

      if (hasUpdates) {
        const docRef = doc(db, 'writefromdictation', sample.id);
        await updateDoc(docRef, { audio: updatedAudio });
        updated++;
      }
    }

    setReusingUrls(false);
    alert(`Updated ${updated} samples with existing audio URLs`);
  }, [audioSamples, findExistingAudioUrl, db]);

  // Function to clean up duplicate documents
  const cleanupDuplicates = useCallback(async () => {
    console.log('Starting duplicate cleanup...');
    const collectionRef = collection(db, 'writefromdictation');
    const querySnapshot = await getDocs(collectionRef);
    
    // Group documents by text
    interface DocData {
      text: string;
      audio?: { [key: string]: string };
      createdAt?: { seconds: number };
    }

    const textGroups = new Map<string, { id: string; data: DocData }[]>();
    querySnapshot.forEach(doc => {
      const data = doc.data() as DocData;
      if (!textGroups.has(data.text)) {
        textGroups.set(data.text, []);
      }
      textGroups.get(data.text)?.push({ id: doc.id, data });
    });

    // Find and merge duplicates
    for (const text of Array.from(textGroups.keys())) {
      const docs = textGroups.get(text)!;
      if (docs.length > 1) {
        console.log(`Found ${docs.length} duplicates for text: ${text}`);
        
        // Sort by most complete audio and newest
        const sorted = [...docs].sort((a, b) => {
          const aAudio = Object.values(a.data.audio || {}).filter(Boolean).length;
          const bAudio = Object.values(b.data.audio || {}).filter(Boolean).length;
          if (aAudio !== bAudio) return bAudio - aAudio;
          return (b.data.createdAt?.seconds || 0) - (a.data.createdAt?.seconds || 0);
        });

        // Keep the first one (most complete/newest)
        const keep = sorted[0];
        const remove = sorted.slice(1);

        // Merge audio URLs from duplicates
        type VoiceType = 'Brian' | 'Joanna' | 'Olivia';
        const mergedAudio: Record<VoiceType, string> = {
          Brian: keep.data.audio?.Brian || '',
          Joanna: keep.data.audio?.Joanna || '',
          Olivia: keep.data.audio?.Olivia || ''
        };

        // Add any missing audio URLs from duplicates
        remove.forEach((doc: { id: string; data: DocData }) => {
          const audio = doc.data.audio || {};
          (Object.entries(audio) as [VoiceType, string][]).forEach(([voice, url]) => {
            if (url && !mergedAudio[voice]) {
              mergedAudio[voice] = url;
            }
          });
        });

        // Update the keeper with merged audio
        const keepDoc = doc(db, 'writefromdictation', keep.id);
        await updateDoc(keepDoc, { audio: mergedAudio });

        // Delete duplicates
        for (const duplicate of remove) {
          const docRef = doc(db, 'writefromdictation', duplicate.id);
          await updateDoc(docRef, { isHidden: true });
          console.log(`Marked duplicate ${duplicate.id} as hidden`);
        }
      }
    }
    console.log('Duplicate cleanup completed');
  }, [db]);

  // Function to parse text from filename
  const parseTextFromFilename = (filename: string): { text: string, voice: string } | null => {
    // Remove .mp3 extension and number prefix
    const withoutExt = filename.replace(/\.mp3$/, '');
    const withoutNumber = withoutExt.replace(/^\d+_/, '');
    
    // Split by underscore
    const parts = withoutNumber.split('_');
    
    // Need at least 2 parts: voice and text
    if (parts.length < 2) return null;
    
    // First part is voice name (Brian/Joanna/Olivia)
    const voice = parts[0];
    if (!['Brian', 'Joanna', 'Olivia'].includes(voice)) {
      return null;
    }
    
    // Rest is the text content
    const text = parts.slice(1).join(' ');
    
    console.log('Parsed filename:', {
      original: filename,
      voice,
      text
    });
    
    return { text, voice };
  };

  // Function to handle bulk file upload
  const handleBulkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsBulkUploading(true);
    setBulkUploadProgress(0);

    const files = Array.from(e.target.files);
    let processed = 0;
    let errors = 0;

    console.log(`Starting upload of ${files.length} files...`);
    alert(`Starting upload of ${files.length} files. Please wait...`);

    // Group files by their text content
    const fileGroups = new Map<string, { file: File, voice: string }[]>();
    
    // First pass: Parse and group files
    for (const file of files) {
      const parsed = parseTextFromFilename(file.name);
      if (!parsed) {
        console.error(`Invalid filename format: ${file.name}`);
        errors++;
        continue;
      }

      const { text, voice } = parsed;
      if (!fileGroups.has(text)) {
        fileGroups.set(text, []);
      }
      fileGroups.get(text)?.push({ file, voice });
    }

    // Second pass: Process each group of files
    for (const text of Array.from(fileGroups.keys())) {
      const fileGroup = fileGroups.get(text)!;
      try {
        console.log(`Processing group for text: ${text}`);
        
        // Only search in samples that are missing audio URLs
        const samplesWithMissingAudio = audioSamples.filter(s => {
          const voices = ['Brian', 'Joanna', 'Olivia'];
          return voices.some(voice => !s.audio?.[voice] || !s.audio[voice].trim());
        });

        // Find matching sample from filtered list
        const sample = samplesWithMissingAudio.find(s => {
          // Advanced text cleaning and word-based comparison
          const cleanText = (text: string) => {
            return text.toLowerCase()
              .replace(/^(brian|joanna|olivia)\s+/i, '') // Remove voice name from start
              .replace(/[.,!?]/g, '') // Remove punctuation
              .replace(/\s+/g, ' ')   // Normalize spaces
              .trim();
          };

          // Get unique words and handle joined/split words
          const getWords = (text: string) => {
            const commonWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
            
            // First get normal words
            const normalWords = cleanText(text)
              .split(' ')
              .filter(word => !commonWords.includes(word));
            
            // Then get potential joined words by removing spaces
            const joinedText = normalWords.join('').toLowerCase();
            
            // Combine both sets of words
            return Array.from(new Set([
              ...normalWords,
              joinedText // Include the joined version of all words
            ]));
          };

          // Get words from both texts
          const sampleWords = getWords(s.text);
          const fileWords = getWords(text);

          // Calculate word overlap with fuzzy matching
          const commonWords = sampleWords.filter(word => {
            // Check for exact match
            if (fileWords.includes(word)) return true;
            
            // Check if this word is part of any file word
            return fileWords.some(fileWord => 
              fileWord.includes(word) || word.includes(fileWord)
            );
          });
          
          const matchScore = commonWords.length / Math.max(sampleWords.length, fileWords.length);

          // Log comparison details
          console.log('\n=== Text Comparison ===');
          console.log('Original DB Text:', s.text);
          console.log('Original File Text:', text);
          console.log('DB Words:', sampleWords);
          console.log('File Words:', fileWords);
          console.log('Common Words:', commonWords);
          console.log('Match Score:', matchScore);
          
          // Calculate match threshold based on text length
          // Use higher threshold for shorter texts to avoid false matches
          const getMatchThreshold = (wordCount: number) => {
            if (wordCount <= 3) return 0.9;  // 90% match for very short texts
            if (wordCount <= 5) return 0.8;  // 80% match for short texts
            return 0.7;  // 70% match for longer texts
          };

          const threshold = getMatchThreshold(Math.max(sampleWords.length, fileWords.length));
          const isMatch = matchScore >= threshold;

          console.log('Match Threshold:', threshold);
          console.log('Match Result:', isMatch);
          console.log('======================\n');
          
          return isMatch;
        });

        if (!sample) {
          console.error(`No matching sample found for text: ${text}`);
          errors++;
          continue;
        }

        console.log(`Found matching sample with ID: ${sample.id}`);

        // Process all files in the group
        const updatedAudio = {
          Brian: sample.audio?.Brian || '',
          Joanna: sample.audio?.Joanna || '',
          Olivia: sample.audio?.Olivia || ''
        };

        // Only process files for missing voices
        const missingVoices = ['Brian', 'Joanna', 'Olivia'].filter(
          voice => !sample.audio?.[voice] || !sample.audio[voice].trim()
        );
        
        const filesToProcess = fileGroup.filter(
          ({ voice }) => missingVoices.includes(voice)
        );

        for (const { file, voice } of filesToProcess) {
          try {
            console.log(`Processing ${voice} file for text: ${text}`);
            const storageRef = ref(storage, `audio/${sample.id}/${voice}/${file.name}`);
            console.log(`Uploading to: audio/${sample.id}/${voice}/${file.name}`);
            
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
            updatedAudio[voice as keyof typeof updatedAudio] = url;
            console.log(`Uploaded ${voice} file, got URL: ${url}`);
            setUploadedFiles(prev => [...prev, { name: file.name, voice, text }]);
          } catch (error) {
            console.error(`Error processing ${voice} file:`, error);
            errors++;
          }
        }

        // Update Firestore with all processed audio URLs
        const docRef = doc(db, 'writefromdictation', sample.id);
        await updateDoc(docRef, {
          audio: updatedAudio
        });
        console.log(`Firestore updated for sample ${sample.id} with all voices`);

        processed++;
        const progress = Math.round((processed / files.length) * 100);
        setBulkUploadProgress(progress);
        console.log(`Progress: ${progress}% (${processed}/${files.length} files)`);
      } catch (error: unknown) {
        console.error(`Error processing text group: ${text}`, error);
        
        if (error instanceof Error) {
          console.error(`Error details: ${error.message}`);
        }
        
        // Log detailed error information for Firebase Storage errors
        if (typeof error === 'object' && error !== null && 'code' in error) {
          const storageError = error as { code: string };
          if (storageError.code === 'storage/unauthorized') {
            console.error('User does not have permission to access the object');
          } else if (storageError.code === 'storage/canceled') {
            console.error('User canceled the upload');
          } else if (storageError.code === 'storage/unknown') {
            console.error('Unknown error occurred, inspect error.serverResponse');
          }
        }
        
        errors++;
        continue;
      }
    }

    setIsBulkUploading(false);
    setBulkUploadProgress(0);

    const message = `Upload complete!\nProcessed: ${processed} files\nErrors: ${errors} files`;
    console.log(message);
    alert(message);
    
    if (processed > 0) {
      // No need to reload the page since we have real-time updates via onSnapshot
      console.log('Upload complete - UI will update automatically via Firestore listener');
    }
  };

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
        
        // Ensure audio object is properly initialized
        const currentAudio = data.audio || {};
        data.audio = {
          Brian: currentAudio.Brian || '',
          Joanna: currentAudio.Joanna || '',
          Olivia: currentAudio.Olivia || '',
          ...currentAudio
        };
        
        await updateDoc(docRef, data);
        setEditing(false);
        setSaving(false);
      } catch (error) {
        console.error('Error saving data:', error);
        setSaving(false);
      }
    }
  }, [currentSample, db]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: keyof AudioSample) => {
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
        // Add metadata with CORS settings
        const metadata = {
          contentType: 'audio/mp3',
          cacheControl: 'public, max-age=31536000', // Cache for 1 year
          customMetadata: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          }
        };
        const snapshot = await uploadBytes(storageRef, file, metadata);
        const url = await getDownloadURL(snapshot.ref);
        // Initialize audio object with all voices
        const currentAudio = currentSample.audio || {};
        const updatedAudio = {
          Brian: currentAudio.Brian || '',
          Joanna: currentAudio.Joanna || '',
          Olivia: currentAudio.Olivia || '',
          ...currentAudio,
          [uploadingFor]: url
        };

        const updatedSample: AudioSample = {
          ...currentSample,
          audio: updatedAudio
        };
        setCurrentSample(updatedSample);
        setUploading(false);
        setUploadingFor(null);

        // Update Firestore document with new audio URL
        const docRef = doc(db, 'writefromdictation', currentSample.id);
        await updateDoc(docRef, { audio: updatedAudio });
      } catch (error: unknown) {
        console.error('Error uploading file:', error);
        
        if (error instanceof Error) {
          alert(`Error uploading file: ${error.message}`);
        } else {
          alert('An unknown error occurred while uploading');
        }
        
        setUploading(false);
        
        // Log detailed error information for Firebase Storage errors
        if (typeof error === 'object' && error !== null && 'code' in error) {
          const storageError = error as { code: string };
          if (storageError.code === 'storage/unauthorized') {
            console.error('User does not have permission to access the object');
          } else if (storageError.code === 'storage/canceled') {
            console.error('User canceled the upload');
          } else if (storageError.code === 'storage/unknown') {
            console.error('Unknown error occurred, inspect error.serverResponse');
          }
        }
      }
    }
  }, [currentSample, uploadingFor, db]);

  const handleUploadClick = useCallback((voice: string) => {
    setUploadingFor(voice);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Function to export filtered data to Excel
  const exportToExcel = useCallback(() => {
    // Create a worksheet with the filtered data
    // Note: filteredSamples already only includes visible items (isHidden !== true)
    const worksheet = XLSX.utils.json_to_sheet(
      filteredSamples.map(sample => {
        // Check which voices have audio
        const brianHasAudio = sample.audio?.Brian && sample.audio.Brian.trim() !== '';
        const joannaHasAudio = sample.audio?.Joanna && sample.audio.Joanna.trim() !== '';
        const oliviaHasAudio = sample.audio?.Olivia && sample.audio.Olivia.trim() !== '';
        
        // Return a simplified object for Excel
        return {
          'English Text': sample.text,
          'Vietnamese Translation': sample.vietnameseTranslation || '',
          'Topic': sample.topic || 'General',
          'Has Brian Audio': brianHasAudio ? 'Yes' : 'No',
          'Has Joanna Audio': joannaHasAudio ? 'Yes' : 'No',
          'Has Olivia Audio': oliviaHasAudio ? 'Yes' : 'No',
          'Missing': filterMode === 'translations' ? 'Translation' : filterMode === 'audio' ? 'Audio' : 'Topic',
          'Visible': sample.isHidden === true ? 'No' : 'Yes'
        };
      })
    );

    // Set column widths
    const columnWidths = [
      { wch: 50 }, // English Text
      { wch: 50 }, // Vietnamese Translation
      { wch: 20 }, // Topic
      { wch: 15 }, // Has Brian Audio
      { wch: 15 }, // Has Joanna Audio
      { wch: 15 }, // Has Olivia Audio
      { wch: 15 }, // Missing
      { wch: 10 }  // Visible
    ];
    worksheet['!cols'] = columnWidths;

    // Create a workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    const sheetName = filterMode === 'translations' ? 'Missing Translations' : 
                     filterMode === 'audio' ? 'Missing Audio' : 'Missing Topics';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filenameSuffix = filterMode === 'translations' ? 'missing_translations' : 
                          filterMode === 'audio' ? 'missing_audio' : 'missing_topics';
    const filename = `audio_samples_${filenameSuffix}_${date}.xlsx`;

    // Export to Excel file
    XLSX.writeFile(workbook, filename);
  }, [filteredSamples, filterMode]);

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
        onChange={(e) => {
          const currentAudio = currentSample?.audio || {};
          const updatedAudio = {
            Brian: currentAudio.Brian || '',
            Joanna: currentAudio.Joanna || '',
            Olivia: currentAudio.Olivia || '',
            ...currentAudio,
            [voice]: e.target.value
          };
          setCurrentSample({
            ...currentSample!,
            audio: updatedAudio
          });
        }}
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
      <div className="flex justify-between items-center w-full max-w-2xl mb-4">
        <h1 className="text-2xl font-bold">Edit Audio Sample</h1>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${useNewDb ? 'text-green-400' : 'text-gray-400'}`}>
            {useNewDb ? 'Using New Project' : 'Using Old Project'}
          </span>
          <button
            onClick={handleProjectSwitch}
            className={`px-4 py-2 rounded text-white ${
              useNewDb ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Switch to {useNewDb ? 'Old' : 'New'} Project
          </button>
        </div>
      </div>
      
      {/* Filter mode selection */}
      <div className="w-full max-w-2xl mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Texts Needing Completion:</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as 'translations' | 'audio' | 'topics')}
                className="px-3 py-1 bg-[#fc5d01] text-white rounded text-sm"
              >
                <option value="translations">Missing Translations</option>
                <option value="audio">Missing Audio</option>
                <option value="topics">Missing Topics</option>
              </select>
            </div>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-[#fc5d01] text-white rounded hover:bg-[#fd7f33] transition-colors"
            >
              Export to Excel
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Showing {filteredSamples.length} sentences that need {
            filterMode === 'translations' ? 'Vietnamese translations' : 
            filterMode === 'audio' ? 'audio links' : 'topics'
          }.
        </p>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl max-h-[70vh] overflow-y-auto space-y-3">
          {filteredSamples.length > 0 ? (
            filteredSamples.map((sample, index) => {
              // Check if the sample needs Vietnamese translation
              const needsTranslation = !sample.vietnameseTranslation || sample.vietnameseTranslation.trim() === '';
              
              // Check if the sample is missing any audio links
              const voices = ['Brian', 'Joanna', 'Olivia'];
              const hasMissingAudio = voices.some(voice => {
                return !sample.audio?.[voice] || !sample.audio[voice].trim();
              });
              
              // Check if missing topic
              const needsTopic = !sample.topic || sample.topic.trim() === '';
              
              // Determine if this sample needs attention
              const needsAttention = needsTranslation || hasMissingAudio || needsTopic;
              
              return (
                <SampleCard 
                  key={sample.id}
                  sample={sample}
                  index={index}
                  filterMode={filterMode}
                  needsAttention={needsAttention}
                  needsTranslation={needsTranslation}
                  needsTopic={needsTopic}
                  onUpdate={async (updatedSample) => {
                    try {
                      const docRef = doc(db, 'writefromdictation', updatedSample.id);
                      const { id, ...data } = updatedSample;
                      await updateDoc(docRef, data);
                    } catch (error) {
                      console.error('Error updating sample:', error);
                      alert('Error updating sample');
                    }
                  }}
                />
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-400 text-lg">
                No sentences found that need {
                  filterMode === 'translations' ? 'Vietnamese translations' : 
                  filterMode === 'audio' ? 'audio links' : 'topics'
                }.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Try switching to a different filter mode or check your data.
              </p>
            </div>
          )}
        </div>
      </div>

      {currentSample && (
        <div className="w-full max-w-md space-y-4">
          <p>{filteredSamples.length}</p>
          {editing ? (
            <div>
              <label htmlFor="text" className="block mb-2">Text</label>
              <textarea
                id="text"
                className="w-full p-2 border border-gray-300 rounded text-black"
                value={currentSample.text}
                onChange={(e) => handleChange(e, 'text')}
              ></textarea>
              <label htmlFor="vietnameseTranslation" className="block mb-2">Vietnamese Translation</label>
              <textarea
                id="vietnameseTranslation"
                className="w-full p-2 border border-gray-300 rounded text-black"
                value={currentSample.vietnameseTranslation || ''}
                onChange={(e) => handleChange(e, 'vietnameseTranslation')}
                placeholder="Enter Vietnamese translation here"
              ></textarea>
              <label htmlFor="occurrence" className="block mb-2">Occurrence</label>
              <input
                id="occurrence"
                type="number"
                className="w-full p-2 border border-gray-300 rounded text-black"
                value={currentSample.occurrence}
                onChange={(e) => handleChange(e, 'occurrence')}
              />
              <label htmlFor="topic" className="block mb-2">Topic</label>
              <select
                id="topic"
                className="w-full p-2 border border-gray-300 rounded text-black"
                value={currentSample.topic || 'General'}
                onChange={(e) => handleChange(e, 'topic')}
              >
                {DEFAULT_TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
              <label htmlFor="audio" className="block mb-2">Audio URLs</label>
              {['Brian', 'Joanna', 'Olivia'].map(renderAudioField)}
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
              <p className="text-black"><strong>Text:</strong> {currentSample.text}</p>
              {currentSample.vietnameseTranslation && (
                <p className="text-black"><strong>Vietnamese Translation:</strong> {currentSample.vietnameseTranslation}</p>
              )}
              <p className="text-black"><strong>Occurrence:</strong> {currentSample.occurrence}</p>
              <div>
                <strong>Audio URLs:</strong>
                {Object.entries(currentSample.audio).map(([voice, url]) => (
                  <div key={voice}>
                    <p className="text-black">{voice}: <a href={url} target="_blank" rel="noopener noreferrer">{url}</a></p>
                  </div>
                ))}
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleEditClick}>Edit</button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => {
                  if (currentIndex + 1 < filteredSamples.length) {
                    setCurrentIndex(currentIndex + 1);
                  }
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 w-full max-w-md space-y-4">
        {/* Bulk Vietnamese Translation Update section */}
        <div className="border p-4 rounded bg-[#fc5d01] bg-opacity-20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Bulk Vietnamese Translation Update</h3>
          </div>
          <p className="text-sm mb-2">
            Paste text in format: &quot;English text | Vietnamese translation&quot; (one per line)
          </p>
          <textarea
            id="translation-textarea"
            className="w-full p-2 border border-gray-300 rounded text-black mb-4 h-40"
            placeholder={"Example:\nThe weather is nice today. | Thời tiết hôm nay đẹp.\nI like to read books. | Tôi thích đọc sách."}
          />
          <button
            className="px-4 py-2 bg-[#fc5d01] text-white rounded hover:bg-[#fd7f33]"
            onClick={() => {
              const textarea = document.getElementById('translation-textarea') as HTMLTextAreaElement;
              if (!textarea) return;
              
              const lines = textarea.value.split('\n').filter(line => line.trim());
              const updates: {text: string, translation: string}[] = [];
              
              lines.forEach(line => {
                const parts = line.split('|');
                if (parts.length === 2) {
                  const text = parts[0].trim();
                  const translation = parts[1].trim();
                  if (text && translation) {
                    updates.push({text, translation});
                  }
                }
              });
              
              if (updates.length === 0) {
                alert('No valid updates found. Please use the format: &quot;English text | Vietnamese translation&quot;');
                return;
              }
              
              const updateTranslations = async () => {
                let updated = 0;
                let notFound = 0;
                
                // Function to normalize text for comparison
                const normalizeText = (text: string): string => {
                  return text
                    .toLowerCase()
                    .replace(/[.,!?;:'"]/g, '') // Remove punctuation
                    .replace(/\s+/g, ' ')       // Normalize spaces
                    .trim();
                };
                
                // Create a map of normalized texts to original samples for faster lookup
                const normalizedSamplesMap = new Map<string, AudioSample>();
                audioSamples.forEach(sample => {
                  const normalizedText = normalizeText(sample.text);
                  normalizedSamplesMap.set(normalizedText, sample);
                });
                
                const notFoundTexts: string[] = [];
                
                for (const {text, translation} of updates) {
                  // Normalize the input text
                  const normalizedText = normalizeText(text);
                  
                  // Find the sample with matching normalized text
                  const sample = normalizedSamplesMap.get(normalizedText);
                  
                  if (sample) {
                    const docRef = doc(db, 'writefromdictation', sample.id);
                    await updateDoc(docRef, { vietnameseTranslation: translation });
                    updated++;
                  } else {
                    notFound++;
                    notFoundTexts.push(text);
                    console.log(`No matching sample found for text: &quot;${text}&quot;`);
                  }
                }
                
                // If there are not found texts, show the first few in the alert
                let alertMessage = `Updated ${updated} translations. ${notFound} texts not found.`;
                if (notFound > 0) {
                  const exampleCount = Math.min(3, notFoundTexts.length);
                  const examples = notFoundTexts.slice(0, exampleCount).map(t => `&quot;${t}&quot;`).join(', ');
                  alertMessage += `\n\nExamples of texts not found: ${examples}`;
                  
                  // Log all not found texts to console for debugging
                  console.log('All texts not found:', notFoundTexts);
                }
                
                alert(alertMessage);
                
                // Alert is now handled above
                textarea.value = '';
              };
              
              if (updates.length > 0) {
                if (confirm(`Update ${updates.length} Vietnamese translations?`)) {
                  updateTranslations();
                }
              }
            }}
          >
            Update Translations
          </button>
        </div>

        {/* Bulk Topic Update section */}
        <div className="border p-4 rounded bg-[#fedac2] bg-opacity-20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Bulk Topic Update</h3>
          </div>
          
          {/* Simple Bulk Update - Select topic and paste sentences */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-2">Bulk Update with Selected Topic</h4>
            <p className="text-xs mb-3 text-gray-300">
              1. Select a topic from dropdown<br/>
              2. Paste English sentences (one per line)<br/>
              3. All pasted sentences will be assigned the selected topic
            </p>
            
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Select Topic:</label>
              <select
                id="bulk-topic-dropdown"
                className="w-full p-2 border border-gray-300 rounded text-black text-sm"
                defaultValue=""
              >
                <option value="" disabled>Choose topic to assign</option>
                {DEFAULT_TOPICS.filter(topic => topic !== 'All').map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Paste English Sentences:</label>
              <textarea
                id="bulk-sentences-textarea"
                className="w-full p-2 border border-gray-300 rounded text-black text-sm h-32"
                placeholder={"Paste English sentences here (one per line):\nThe weather is nice today.\nI like to read books.\nShe is going to the market."}
              />
            </div>
            
            <button
              className="px-4 py-2 bg-[#fc5d01] text-white rounded hover:bg-[#fd7f33] text-sm"
              onClick={async () => {
                const topicSelect = document.getElementById('bulk-topic-dropdown') as HTMLSelectElement;
                const textarea = document.getElementById('bulk-sentences-textarea') as HTMLTextAreaElement;
                
                if (!topicSelect || !topicSelect.value) {
                  alert('Please select a topic first');
                  return;
                }
                
                if (!textarea || !textarea.value.trim()) {
                  alert('Please paste some English sentences');
                  return;
                }
                
                const selectedTopic = topicSelect.value;
                const lines = textarea.value.split('\n').filter(line => line.trim());
                
                if (lines.length === 0) {
                  alert('No valid sentences found');
                  return;
                }
                
                if (confirm(`Update ${lines.length} sentences to topic "${selectedTopic}"?`)) {
                  let updated = 0;
                  let notFound = 0;
                  
                  // Function to normalize text for comparison
                  const normalizeText = (text: string): string => {
                    return text
                      .toLowerCase()
                      .replace(/[.,!?;:'"]/g, '') // Remove punctuation
                      .replace(/\s+/g, ' ')       // Normalize spaces
                      .trim();
                  };
                  
                  // Create a map of normalized texts to original samples for faster lookup
                  const normalizedSamplesMap = new Map<string, AudioSample>();
                  audioSamples.forEach(sample => {
                    const normalizedText = normalizeText(sample.text);
                    normalizedSamplesMap.set(normalizedText, sample);
                  });
                  
                  const notFoundTexts: string[] = [];
                  
                  for (const line of lines) {
                    const text = line.trim();
                    if (!text) continue;
                    
                    // Normalize the input text
                    const normalizedText = normalizeText(text);
                    
                    // Find the sample with matching normalized text
                    const sample = normalizedSamplesMap.get(normalizedText);
                    
                    if (sample) {
                      try {
                        const docRef = doc(db, 'writefromdictation', sample.id);
                        await updateDoc(docRef, { topic: selectedTopic });
                        updated++;
                      } catch (error) {
                        console.error(`Error updating sample ${sample.id}:`, error);
                      }
                    } else {
                      notFound++;
                      notFoundTexts.push(text);
                      console.log(`No matching sample found for text: "${text}"`);
                    }
                  }
                  
                  // Show results
                  let alertMessage = `Successfully updated ${updated} sentences to topic "${selectedTopic}".`;
                  if (notFound > 0) {
                    alertMessage += `\n${notFound} sentences not found in database.`;
                    
                    const exampleCount = Math.min(3, notFoundTexts.length);
                    const examples = notFoundTexts.slice(0, exampleCount).map(t => `"${t}"`).join(', ');
                    alertMessage += `\n\nExamples not found: ${examples}`;
                    
                    // Log all not found texts to console for debugging
                    console.log('All texts not found:', notFoundTexts);
                  }
                  
                  alert(alertMessage);
                  
                  // Clear inputs
                  textarea.value = '';
                  topicSelect.value = '';
                }
              }}
            >
              Update All Sentences
            </button>
          </div>

          {/* Advanced Update - Text format with individual topics */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Advanced Update (Individual Topics)</h4>
            <p className="text-xs mb-2">
              For different topics per sentence, use format: &quot;English text | Topic&quot; (one per line)
            </p>
            <textarea
              id="advanced-topic-textarea"
              className="w-full p-2 border border-gray-300 rounded text-black mb-4 h-32 text-sm"
              placeholder={"Example:\nThe weather is nice today. | Environment & Nature\nI like to read books. | Education & Learning"}
            />
            <button
              className="px-4 py-2 bg-[#fd7f33] text-white rounded hover:bg-[#fc5d01] text-sm"
              onClick={() => {
                const textarea = document.getElementById('advanced-topic-textarea') as HTMLTextAreaElement;
                if (!textarea) return;
                
                const lines = textarea.value.split('\n').filter(line => line.trim());
                const updates: {text: string, topic: string}[] = [];
                
                lines.forEach(line => {
                  const parts = line.split('|');
                  if (parts.length === 2) {
                    const text = parts[0].trim();
                    const topic = parts[1].trim();
                    if (text && topic && DEFAULT_TOPICS.includes(topic)) {
                      updates.push({text, topic});
                    }
                  }
                });
                
                if (updates.length === 0) {
                  alert(`No valid updates found. Please use the format: "English text | Topic"\nValid topics: ${DEFAULT_TOPICS.join(', ')}`);
                  return;
                }
                
                const updateTopics = async () => {
                  let updated = 0;
                  let notFound = 0;
                  
                  // Function to normalize text for comparison
                  const normalizeText = (text: string): string => {
                    return text
                      .toLowerCase()
                      .replace(/[.,!?;:'"]/g, '') // Remove punctuation
                      .replace(/\s+/g, ' ')       // Normalize spaces
                      .trim();
                  };
                  
                  // Create a map of normalized texts to original samples for faster lookup
                  const normalizedSamplesMap = new Map<string, AudioSample>();
                  audioSamples.forEach(sample => {
                    const normalizedText = normalizeText(sample.text);
                    normalizedSamplesMap.set(normalizedText, sample);
                  });
                  
                  const notFoundTexts: string[] = [];
                  
                  for (const {text, topic} of updates) {
                    // Normalize the input text
                    const normalizedText = normalizeText(text);
                    
                    // Find the sample with matching normalized text
                    const sample = normalizedSamplesMap.get(normalizedText);
                    
                    if (sample) {
                      const docRef = doc(db, 'writefromdictation', sample.id);
                      await updateDoc(docRef, { topic: topic });
                      updated++;
                    } else {
                      notFound++;
                      notFoundTexts.push(text);
                      console.log(`No matching sample found for text: "${text}"`);
                    }
                  }
                  
                  // If there are not found texts, show the first few in the alert
                  let alertMessage = `Updated ${updated} topics. ${notFound} texts not found.`;
                  if (notFound > 0) {
                    const exampleCount = Math.min(3, notFoundTexts.length);
                    const examples = notFoundTexts.slice(0, exampleCount).map(t => `"${t}"`).join(', ');
                    alertMessage += `\n\nExamples of texts not found: ${examples}`;
                    
                    // Log all not found texts to console for debugging
                    console.log('All texts not found:', notFoundTexts);
                  }
                  
                  alert(alertMessage);
                  
                  textarea.value = '';
                };
                
                if (updates.length > 0) {
                  if (confirm(`Update ${updates.length} topics?`)) {
                    updateTopics();
                  }
                }
              }}
            >
              Update Topics
            </button>
          </div>
        </div>
        
        {/* Bulk audio upload section */}
        <div className="border p-4 rounded bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Bulk Audio Upload</h3>
            <div className="flex gap-2">
              <button
                onClick={reuseExistingUrls}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={reusingUrls}
              >
                {reusingUrls ? 'Updating...' : 'Reuse URLs'}
              </button>
              <button
                onClick={cleanupDuplicates}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Clean Duplicates
              </button>
            </div>
          </div>

          {/* Show uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="mb-4 p-2 bg-gray-700 rounded max-h-40 overflow-y-auto">
              <h4 className="text-sm font-semibold mb-2">Successfully Uploaded:</h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="text-xs text-gray-300 mb-1">
                  <span className="text-green-400">{file.voice}</span>: {file.name}
                </div>
              ))}
            </div>
          )}
          <p className="text-sm mb-2">Select multiple audio files to upload. Files should be named like: &quot;number_Voice_Text.mp3&quot;</p>
          
          {/* Status and progress section */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${isBulkUploading ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <p className="text-sm text-gray-300">
                {isBulkUploading ? 'Uploading files...' : 'Ready to upload'}
              </p>
            </div>
            
            <div className="w-full bg-gray-900 rounded h-2">
              <div 
                className="h-full bg-blue-500 rounded transition-all duration-300 ease-in-out"
                style={{ 
                  width: isBulkUploading ? `${bulkUploadProgress}%` : '0%'
                }}
              />
            </div>
            {isBulkUploading && (
              <p className="text-xs text-center mt-1 text-gray-400">
                {bulkUploadProgress}% complete
              </p>
            )}
          </div>
          <input
            type="file"
            accept="audio/mp3"
            multiple
            onChange={handleBulkFileUpload}
            ref={bulkFileInputRef}
            disabled={isBulkUploading}
            className="block w-full text-sm text-gray-300
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-500 file:text-white
              hover:file:bg-blue-600
              disabled:opacity-50
              focus:outline-none"
          />
        </div>

        <label htmlFor="audio-select" className="block mb-2">Select Audio Sample</label>
        <select
          id="audio-select"
          value={currentIndex}
          onChange={handleSelectChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          {filteredSamples.map((sample, index) => (
            <option className="text-black" key={sample.id} value={index}>
              {sample.text}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default EditAudioSamplePage;
