import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { db, storage } from '../firebase';
import {
  collection,
  doc,
  updateDoc,
  getDocs,
  CollectionReference,
  query,
  orderBy,
  Query,
  DocumentData,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as XLSX from 'xlsx';
import AppShellBackground from '../components/ui/AppShellBackground';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Tabs from '../components/ui/Tabs';

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

type FilterMode = 'translations' | 'audio' | 'topics';

const DEFAULT_TOPICS = [
  'Business & Work',
  'Education & Learning',
  'Technology & Science',
  'Daily Life & Routine',
  'Health & Medicine',
  'Travel & Tourism',
  'Food & Cooking',
  'Sports & Recreation',
  'Environment & Nature',
  'Arts & Humanities',
  'General',
];

const normalizeTextForCompare = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

interface SampleCardProps {
  sample: AudioSample;
  index: number;
  filterMode: FilterMode;
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
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSample, setEditedSample] = useState<AudioSample>(sample);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedSample(sample);
  }, [sample]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(editedSample);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving sample');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedSample(sample);
    setIsEditing(false);
  };

  const statusIcon =
    filterMode === 'translations' && needsTranslation
      ? '🔤'
      : filterMode === 'audio'
      ? '🎵'
      : filterMode === 'topics' && needsTopic
      ? '🏷️'
      : '✅';

  const statusText =
    filterMode === 'translations'
      ? 'Missing Translation'
      : filterMode === 'audio'
      ? 'Missing Audio'
      : filterMode === 'topics'
      ? 'Missing Topic'
      : 'Complete';

  return (
    <Card
      hoverable
      className={`space-y-4 ${
        needsAttention
          ? 'border-[#fc5d01]/35 bg-[#fc5d01]/10'
          : 'border-white/15 bg-white/[0.08]'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg">
            {statusIcon}
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/55">Sample #{index + 1}</p>
            <p className="text-sm font-semibold text-[#ffac7b]">{statusText}</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {!isEditing ? (
            <Button variant="secondary" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
              Edit
            </Button>
          ) : (
            <>
              <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-white/70">English Text</label>
          {isEditing ? (
            <Input
              multiline
              value={editedSample.text}
              onChange={(e) => setEditedSample({ ...editedSample, text: e.target.value })}
              rows={3}
            />
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/90">{sample.text}</p>
          )}
        </div>

        {(filterMode === 'translations' || sample.vietnameseTranslation || isEditing) && (
          <div>
            <label className="mb-1 block text-xs text-white/70">Vietnamese Translation</label>
            {isEditing ? (
              <Input
                multiline
                value={editedSample.vietnameseTranslation || ''}
                onChange={(e) =>
                  setEditedSample({
                    ...editedSample,
                    vietnameseTranslation: e.target.value,
                  })
                }
                placeholder="Nhập Vietnamese translation..."
                rows={3}
              />
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm italic text-white/75">
                {sample.vietnameseTranslation || 'No translation available'}
              </p>
            )}
          </div>
        )}

        {(filterMode === 'topics' || sample.topic || isEditing) && (
          <div>
            <label className="mb-1 block text-xs text-white/70">Topic</label>
            {isEditing ? (
              <select
                value={editedSample.topic || 'General'}
                onChange={(e) => setEditedSample({ ...editedSample, topic: e.target.value })}
                className="ui-input accent-ring"
              >
                {DEFAULT_TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            ) : (
              <span className="inline-flex rounded-full border border-[#fc5d01]/35 bg-[#fc5d01]/20 px-3 py-1 text-xs font-semibold text-[#ffcfae]">
                {sample.topic || 'General'}
              </span>
            )}
          </div>
        )}

        {filterMode === 'audio' && (
          <div>
            <label className="mb-1 block text-xs text-white/70">Audio Status</label>
            <div className="flex flex-wrap gap-2">
              {['Brian', 'Joanna', 'Olivia'].map((voice) => {
                const hasAudio = sample.audio?.[voice] && sample.audio[voice].trim() !== '';
                return (
                  <span
                    key={voice}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      hasAudio
                        ? 'border-emerald-300/35 bg-emerald-400/15 text-emerald-200'
                        : 'border-rose-300/35 bg-rose-400/15 text-rose-200'
                    }`}
                  >
                    {voice}: {hasAudio ? 'Done' : 'Missing'}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs text-white/55">
          <span>Occurrence: {sample.occurrence}</span>
          <span>ID: {sample.id.slice(-6)}</span>
        </div>
      </div>
    </Card>
  );
};

const EditAudioSamplePage: React.FC = () => {
  const router = useRouter();

  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<AudioSample[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterMode, setFilterMode] = useState<FilterMode>('translations');

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

  const [translationBulkText, setTranslationBulkText] = useState('');
  const [bulkTopic, setBulkTopic] = useState('');
  const [bulkSentencesText, setBulkSentencesText] = useState('');
  const [advancedTopicText, setAdvancedTopicText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const modeLabel = useMemo(() => {
    if (filterMode === 'translations') return 'Missing Translations';
    if (filterMode === 'audio') return 'Missing Audio';
    return 'Missing Topics';
  }, [filterMode]);

  useEffect(() => {
    const collectionRef: CollectionReference<DocumentData> = collection(db, 'writefromdictation');
    const q: Query<DocumentData> = query(collectionRef, orderBy('text'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs
          .filter((docSnapshot) => {
            const docData = docSnapshot.data();
            return docData.isHidden !== true;
          })
          .map((docSnapshot) => {
            const docData = docSnapshot.data();
            const audio = docData.audio || {};

            return {
              ...docData,
              id: docSnapshot.id,
              audio: {
                Brian: audio.Brian || '',
                Joanna: audio.Joanna || '',
                Olivia: audio.Olivia || '',
                ...audio,
              },
            } as AudioSample;
          });

        const sortedData = data.sort((a, b) => a.text.localeCompare(b.text));
        setAudioSamples(sortedData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const visibleSamples = audioSamples.filter((sample) => sample.isHidden !== true);

    const filtered = visibleSamples.filter((sample) => {
      const needsVietnameseTranslation =
        !sample.vietnameseTranslation || sample.vietnameseTranslation.trim() === '';

      const hasMissingAudio = ['Brian', 'Joanna', 'Olivia'].some(
        (voice) => !sample.audio?.[voice] || !sample.audio[voice].trim()
      );

      const needsTopic = !sample.topic || sample.topic.trim() === '';

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

    setFilteredSamples(filtered);

    if (filtered.length === 0) {
      setCurrentSample(null);
      if (currentIndex !== 0) {
        setCurrentIndex(0);
      }
      return;
    }

    const safeIndex = currentIndex < filtered.length ? currentIndex : 0;
    if (safeIndex !== currentIndex) {
      setCurrentIndex(safeIndex);
    }

    setCurrentSample(filtered[safeIndex]);
  }, [audioSamples, currentIndex, filterMode]);

  const findExistingAudioUrl = useCallback(
    (text: string, voice: string) => {
      return audioSamples.find(
        (sample) =>
          sample.text === text &&
          sample.audio?.[voice] &&
          typeof sample.audio[voice] === 'string' &&
          sample.audio[voice].trim() !== ''
      )?.audio[voice];
    },
    [audioSamples]
  );

  const reuseExistingUrls = useCallback(async () => {
    setReusingUrls(true);
    let updated = 0;

    try {
      for (const sample of audioSamples) {
        const updatedAudio = { ...sample.audio };
        let hasUpdates = false;

        ['Brian', 'Joanna', 'Olivia'].forEach((voice) => {
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

      alert(`Updated ${updated} samples with existing audio URLs`);
    } catch (error) {
      console.error('Error reusing URLs:', error);
      alert('Error while reusing URLs');
    } finally {
      setReusingUrls(false);
    }
  }, [audioSamples, findExistingAudioUrl]);

  const cleanupDuplicates = useCallback(async () => {
    try {
      const collectionRef = collection(db, 'writefromdictation');
      const querySnapshot = await getDocs(collectionRef);

      interface DocData {
        text: string;
        audio?: { [key: string]: string };
        createdAt?: { seconds: number };
      }

      const textGroups = new Map<string, { id: string; data: DocData }[]>();
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as DocData;
        if (!textGroups.has(data.text)) {
          textGroups.set(data.text, []);
        }
        textGroups.get(data.text)?.push({ id: docSnapshot.id, data });
      });

      for (const text of Array.from(textGroups.keys())) {
        const docs = textGroups.get(text);
        if (!docs || docs.length <= 1) continue;

        const sorted = [...docs].sort((a, b) => {
          const aAudio = Object.values(a.data.audio || {}).filter(Boolean).length;
          const bAudio = Object.values(b.data.audio || {}).filter(Boolean).length;
          if (aAudio !== bAudio) return bAudio - aAudio;
          return (b.data.createdAt?.seconds || 0) - (a.data.createdAt?.seconds || 0);
        });

        const keep = sorted[0];
        const remove = sorted.slice(1);

        type VoiceType = 'Brian' | 'Joanna' | 'Olivia';
        const mergedAudio: Record<VoiceType, string> = {
          Brian: keep.data.audio?.Brian || '',
          Joanna: keep.data.audio?.Joanna || '',
          Olivia: keep.data.audio?.Olivia || '',
        };

        remove.forEach((dupDoc) => {
          const audio = dupDoc.data.audio || {};
          (Object.entries(audio) as [VoiceType, string][]).forEach(([voice, url]) => {
            if (url && !mergedAudio[voice]) {
              mergedAudio[voice] = url;
            }
          });
        });

        const keepDoc = doc(db, 'writefromdictation', keep.id);
        await updateDoc(keepDoc, { audio: mergedAudio });

        for (const duplicate of remove) {
          const dupRef = doc(db, 'writefromdictation', duplicate.id);
          await updateDoc(dupRef, { isHidden: true });
        }
      }

      alert('Duplicate cleanup completed');
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      alert('Error during duplicate cleanup');
    }
  }, []);

  const parseTextFromFilename = (filename: string): { text: string; voice: string } | null => {
    const withoutExt = filename.replace(/\.mp3$/, '');
    const withoutNumber = withoutExt.replace(/^\d+_/, '');
    const parts = withoutNumber.split('_');

    if (parts.length < 2) return null;

    const voice = parts[0];
    if (!['Brian', 'Joanna', 'Olivia'].includes(voice)) {
      return null;
    }

    const text = parts.slice(1).join(' ');
    return { text, voice };
  };

  const handleBulkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsBulkUploading(true);
    setBulkUploadProgress(0);
    setUploadedFiles([]);

    const files = Array.from(e.target.files);
    let processedGroups = 0;
    let updatedCount = 0;
    let errors = 0;

    const fileGroups = new Map<string, { file: File; voice: string }[]>();

    for (const file of files) {
      const parsed = parseTextFromFilename(file.name);
      if (!parsed) {
        errors++;
        continue;
      }

      const { text, voice } = parsed;
      if (!fileGroups.has(text)) {
        fileGroups.set(text, []);
      }
      fileGroups.get(text)?.push({ file, voice });
    }

    const totalGroups = Math.max(fileGroups.size, 1);

    try {
      for (const text of Array.from(fileGroups.keys())) {
        const fileGroup = fileGroups.get(text);
        if (!fileGroup) continue;

        try {
          const samplesWithMissingAudio = audioSamples.filter((sample) => {
            return ['Brian', 'Joanna', 'Olivia'].some(
              (voice) => !sample.audio?.[voice] || !sample.audio[voice].trim()
            );
          });

          const sample = samplesWithMissingAudio.find((s) => {
            const getWords = (value: string) => {
              const commonWords = [
                'a',
                'an',
                'the',
                'and',
                'or',
                'but',
                'in',
                'on',
                'at',
                'to',
                'for',
                'of',
                'with',
                'by',
              ];

              const cleaned = value
                .toLowerCase()
                .replace(/^(brian|joanna|olivia)\s+/i, '')
                .replace(/[.,!?]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

              const normalWords = cleaned
                .split(' ')
                .filter((word) => word && !commonWords.includes(word));

              const joinedText = normalWords.join('').toLowerCase();
              return Array.from(new Set([...normalWords, joinedText]));
            };

            const sampleWords = getWords(s.text);
            const fileWords = getWords(text);

            const commonWords = sampleWords.filter((word) => {
              if (fileWords.includes(word)) return true;
              return fileWords.some(
                (fileWord) => fileWord.includes(word) || word.includes(fileWord)
              );
            });

            const matchScore = commonWords.length / Math.max(sampleWords.length, fileWords.length);

            const getMatchThreshold = (wordCount: number) => {
              if (wordCount <= 3) return 0.9;
              if (wordCount <= 5) return 0.8;
              return 0.7;
            };

            const threshold = getMatchThreshold(Math.max(sampleWords.length, fileWords.length));
            return matchScore >= threshold;
          });

          if (!sample) {
            errors++;
            processedGroups++;
            setBulkUploadProgress(Math.round((processedGroups / totalGroups) * 100));
            continue;
          }

          const updatedAudio = {
            Brian: sample.audio?.Brian || '',
            Joanna: sample.audio?.Joanna || '',
            Olivia: sample.audio?.Olivia || '',
          };

          const missingVoices = ['Brian', 'Joanna', 'Olivia'].filter(
            (voice) => !sample.audio?.[voice] || !sample.audio[voice].trim()
          );

          const filesToProcess = fileGroup.filter(({ voice }) => missingVoices.includes(voice));

          for (const { file, voice } of filesToProcess) {
            try {
              const storageRef = ref(storage, `audio/${sample.id}/${voice}/${file.name}`);

              const metadata = {
                contentType: 'audio/mp3',
                cacheControl: 'public, max-age=31536000',
                customMetadata: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                },
              };

              const snapshot = await uploadBytes(storageRef, file, metadata);
              const url = await getDownloadURL(snapshot.ref);
              updatedAudio[voice as keyof typeof updatedAudio] = url;
              setUploadedFiles((prev) => [...prev, { name: file.name, voice, text }]);
            } catch (error) {
              console.error(`Error processing ${voice} file:`, error);
              errors++;
            }
          }

          const docRef = doc(db, 'writefromdictation', sample.id);
          await updateDoc(docRef, { audio: updatedAudio });
          updatedCount++;
        } catch (error) {
          console.error(`Error processing text group: ${text}`, error);
          errors++;
        }

        processedGroups++;
        setBulkUploadProgress(Math.round((processedGroups / totalGroups) * 100));
      }

      alert(`Upload complete!\nUpdated groups: ${updatedCount}\nErrors: ${errors}`);
    } finally {
      setIsBulkUploading(false);
      setTimeout(() => setBulkUploadProgress(0), 1200);
      if (bulkFileInputRef.current) {
        bulkFileInputRef.current.value = '';
      }
    }
  };

  const handleSelectChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const index = parseInt(event.target.value, 10);
      setCurrentIndex(index);
      setCurrentSample(filteredSamples[index]);
    },
    [filteredSamples]
  );

  const handleEditClick = useCallback(() => {
    setEditing(true);
  }, []);

  const handleSaveClick = useCallback(async () => {
    if (!currentSample) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'writefromdictation', currentSample.id);
      const { id, ...data } = currentSample;

      const currentAudio = data.audio || {};
      data.audio = {
        Brian: currentAudio.Brian || '',
        Joanna: currentAudio.Joanna || '',
        Olivia: currentAudio.Olivia || '',
        ...currentAudio,
      };

      await updateDoc(docRef, data);
      setEditing(false);
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data');
    } finally {
      setSaving(false);
    }
  }, [currentSample]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
      field: keyof AudioSample
    ) => {
      if (!currentSample) return;

      const value =
        field === 'occurrence' ? Number(e.target.value || 0) : (e.target.value as string);

      setCurrentSample({
        ...currentSample,
        [field]: value,
      } as AudioSample);
    },
    [currentSample]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0] || !currentSample || !uploadingFor) return;

      setUploading(true);
      const file = e.target.files[0];
      const storageRef = ref(storage, `audio/${currentSample.id}/${uploadingFor}/${file.name}`);

      try {
        const metadata = {
          contentType: 'audio/mp3',
          cacheControl: 'public, max-age=31536000',
          customMetadata: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          },
        };

        const snapshot = await uploadBytes(storageRef, file, metadata);
        const url = await getDownloadURL(snapshot.ref);

        const currentAudio = currentSample.audio || {};
        const updatedAudio = {
          Brian: currentAudio.Brian || '',
          Joanna: currentAudio.Joanna || '',
          Olivia: currentAudio.Olivia || '',
          ...currentAudio,
          [uploadingFor]: url,
        };

        const updatedSample: AudioSample = {
          ...currentSample,
          audio: updatedAudio,
        };

        setCurrentSample(updatedSample);

        const docRef = doc(db, 'writefromdictation', currentSample.id);
        await updateDoc(docRef, { audio: updatedAudio });
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file');
      } finally {
        setUploading(false);
        setUploadingFor(null);
      }
    },
    [currentSample, uploadingFor]
  );

  const handleUploadClick = useCallback((voice: string) => {
    setUploadingFor(voice);
    fileInputRef.current?.click();
  }, []);

  const exportToExcel = useCallback(() => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredSamples.map((sample) => {
        const brianHasAudio = sample.audio?.Brian && sample.audio.Brian.trim() !== '';
        const joannaHasAudio = sample.audio?.Joanna && sample.audio.Joanna.trim() !== '';
        const oliviaHasAudio = sample.audio?.Olivia && sample.audio.Olivia.trim() !== '';

        return {
          'English Text': sample.text,
          'Vietnamese Translation': sample.vietnameseTranslation || '',
          Topic: sample.topic || 'General',
          'Has Brian Audio': brianHasAudio ? 'Yes' : 'No',
          'Has Joanna Audio': joannaHasAudio ? 'Yes' : 'No',
          'Has Olivia Audio': oliviaHasAudio ? 'Yes' : 'No',
          Missing:
            filterMode === 'translations'
              ? 'Translation'
              : filterMode === 'audio'
              ? 'Audio'
              : 'Topic',
          Visible: sample.isHidden === true ? 'No' : 'Yes',
        };
      })
    );

    worksheet['!cols'] = [
      { wch: 50 },
      { wch: 50 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
    ];

    const workbook = XLSX.utils.book_new();
    const sheetName =
      filterMode === 'translations'
        ? 'Missing Translations'
        : filterMode === 'audio'
        ? 'Missing Audio'
        : 'Missing Topics';

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const date = new Date().toISOString().split('T')[0];
    const filenameSuffix =
      filterMode === 'translations'
        ? 'missing_translations'
        : filterMode === 'audio'
        ? 'missing_audio'
        : 'missing_topics';

    XLSX.writeFile(workbook, `audio_samples_${filenameSuffix}_${date}.xlsx`);
  }, [filteredSamples, filterMode]);

  const handleBulkTranslationUpdate = async () => {
    const lines = translationBulkText.split('\n').filter((line) => line.trim());
    const updates: { text: string; translation: string }[] = [];

    lines.forEach((line) => {
      const parts = line.split('|');
      if (parts.length === 2) {
        const text = parts[0].trim();
        const translation = parts[1].trim();
        if (text && translation) {
          updates.push({ text, translation });
        }
      }
    });

    if (updates.length === 0) {
      alert('No valid updates found. Please use format: "English text | Vietnamese translation"');
      return;
    }

    if (!confirm(`Update ${updates.length} Vietnamese translations?`)) {
      return;
    }

    let updated = 0;
    let notFound = 0;
    const notFoundTexts: string[] = [];

    const normalizedSamplesMap = new Map<string, AudioSample>();
    audioSamples.forEach((sample) => {
      normalizedSamplesMap.set(normalizeTextForCompare(sample.text), sample);
    });

    for (const { text, translation } of updates) {
      const sample = normalizedSamplesMap.get(normalizeTextForCompare(text));
      if (sample) {
        const docRef = doc(db, 'writefromdictation', sample.id);
        await updateDoc(docRef, { vietnameseTranslation: translation });
        updated++;
      } else {
        notFound++;
        notFoundTexts.push(text);
      }
    }

    let alertMessage = `Updated ${updated} translations. ${notFound} texts not found.`;
    if (notFound > 0) {
      const exampleCount = Math.min(3, notFoundTexts.length);
      const examples = notFoundTexts.slice(0, exampleCount).map((t) => `"${t}"`).join(', ');
      alertMessage += `\n\nExamples of texts not found: ${examples}`;
    }

    alert(alertMessage);
    setTranslationBulkText('');
  };

  const handleBulkTopicUpdate = async () => {
    if (!bulkTopic) {
      alert('Please select a topic first');
      return;
    }

    const lines = bulkSentencesText.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      alert('Please paste some English sentences');
      return;
    }

    if (!confirm(`Update ${lines.length} sentences to topic "${bulkTopic}"?`)) {
      return;
    }

    let updated = 0;
    let notFound = 0;
    const notFoundTexts: string[] = [];

    const normalizedSamplesMap = new Map<string, AudioSample>();
    audioSamples.forEach((sample) => {
      normalizedSamplesMap.set(normalizeTextForCompare(sample.text), sample);
    });

    for (const line of lines) {
      const text = line.trim();
      const sample = normalizedSamplesMap.get(normalizeTextForCompare(text));

      if (sample) {
        try {
          const docRef = doc(db, 'writefromdictation', sample.id);
          await updateDoc(docRef, { topic: bulkTopic });
          updated++;
        } catch (error) {
          console.error(`Error updating sample ${sample.id}:`, error);
        }
      } else {
        notFound++;
        notFoundTexts.push(text);
      }
    }

    let alertMessage = `Successfully updated ${updated} sentences to topic "${bulkTopic}".`;
    if (notFound > 0) {
      alertMessage += `\n${notFound} sentences not found in database.`;
      const exampleCount = Math.min(3, notFoundTexts.length);
      const examples = notFoundTexts.slice(0, exampleCount).map((t) => `"${t}"`).join(', ');
      alertMessage += `\n\nExamples not found: ${examples}`;
    }

    alert(alertMessage);
    setBulkSentencesText('');
    setBulkTopic('');
  };

  const handleAdvancedTopicUpdate = async () => {
    const lines = advancedTopicText.split('\n').filter((line) => line.trim());
    const updates: { text: string; topic: string }[] = [];

    lines.forEach((line) => {
      const parts = line.split('|');
      if (parts.length === 2) {
        const text = parts[0].trim();
        const topic = parts[1].trim();
        if (text && topic && DEFAULT_TOPICS.includes(topic)) {
          updates.push({ text, topic });
        }
      }
    });

    if (updates.length === 0) {
      alert(`No valid updates found. Format: "English text | Topic"\nValid topics: ${DEFAULT_TOPICS.join(', ')}`);
      return;
    }

    if (!confirm(`Update ${updates.length} topics?`)) {
      return;
    }

    let updated = 0;
    let notFound = 0;
    const notFoundTexts: string[] = [];

    const normalizedSamplesMap = new Map<string, AudioSample>();
    audioSamples.forEach((sample) => {
      normalizedSamplesMap.set(normalizeTextForCompare(sample.text), sample);
    });

    for (const { text, topic } of updates) {
      const sample = normalizedSamplesMap.get(normalizeTextForCompare(text));
      if (sample) {
        const docRef = doc(db, 'writefromdictation', sample.id);
        await updateDoc(docRef, { topic });
        updated++;
      } else {
        notFound++;
        notFoundTexts.push(text);
      }
    }

    let alertMessage = `Updated ${updated} topics. ${notFound} texts not found.`;
    if (notFound > 0) {
      const exampleCount = Math.min(3, notFoundTexts.length);
      const examples = notFoundTexts.slice(0, exampleCount).map((t) => `"${t}"`).join(', ');
      alertMessage += `\n\nExamples of texts not found: ${examples}`;
    }

    alert(alertMessage);
    setAdvancedTopicText('');
  };

  const renderAudioField = (voice: string) => (
    <div key={`audio-${voice}`} className="space-y-2">
      <label htmlFor={`audio-${voice}`} className="block text-xs text-white/70">
        {voice} Audio URL
      </label>
      <Input
        id={`audio-${voice}`}
        value={currentSample?.audio[voice] || ''}
        onChange={(e) => {
          if (!currentSample) return;

          const currentAudio = currentSample.audio || {};
          const updatedAudio = {
            Brian: currentAudio.Brian || '',
            Joanna: currentAudio.Joanna || '',
            Olivia: currentAudio.Olivia || '',
            ...currentAudio,
            [voice]: e.target.value,
          };

          setCurrentSample({
            ...currentSample,
            audio: updatedAudio,
          });
        }}
        placeholder={`Dán link audio ${voice} hoặc upload file`}
      />

      <Button
        variant="secondary"
        onClick={() => handleUploadClick(voice)}
        disabled={uploading}
        className="w-full sm:w-auto"
      >
        {uploading && uploadingFor === voice ? 'Uploading...' : `Upload ${voice} Audio`}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <AppShellBackground>
        <Head>
          <title>Edit Audio Sample</title>
        </Head>
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 pb-10 pt-24 sm:gap-6 sm:px-6 lg:pt-28">
          <Card strong className="text-center">
            <p className="text-sm text-white/75 sm:text-base">Loading audio samples...</p>
          </Card>
        </main>
      </AppShellBackground>
    );
  }

  return (
    <AppShellBackground>
      <Head>
        <title>Edit Audio Sample</title>
      </Head>

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 pb-10 pt-24 sm:gap-6 sm:px-6 lg:pt-28">
        <Card strong className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[24px] font-bold leading-tight text-white sm:text-[30px]">
                Edit Audio Sample
              </h1>
              <p className="mt-2 text-sm text-white/70 sm:text-base">
                Quản lý audio, translation và topic cho bộ câu Write From Dictation.
              </p>
              <p className="mt-1 text-xs text-white/55 sm:text-[13px]">
                Collection hiện tại:{' '}
                <span className="font-semibold text-[#ffac7b]">writefromdictation</span>
              </p>
            </div>
          </div>

          <Tabs
            items={[
              { key: 'wfd', label: 'Write From Dictation' },
              { key: 'rs', label: 'Repeat Sentence' },
              { key: 'rs-edit', label: 'Edit RS List' },
              { key: 'edit', label: 'Edit Audio Sample' },
              { key: 'list', label: 'Audio Sample List' },
            ]}
            activeKey="edit"
            onChange={(key) => {
              if (key === 'wfd') {
                router.push('/AddAudioSample');
                return;
              }

              if (key === 'rs') {
                router.push('/AddRepeatSentence');
                return;
              }

              if (key === 'list') {
                router.push('/AudioSampleList');
                return;
              }

              if (key === 'rs-list') {
                router.push('/RepeatSentence');
                return;
              }

              if (key === 'rs-edit') {
                router.push('/EditRepeatSentenceList');
                return;
              }

              router.push('/EditAudioSamplePage');
            }}
          />
        </Card>

        <Card className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white sm:text-lg">Bước 1: Chọn nhóm câu cần hoàn thiện</h2>
              <p className="mt-1 text-sm text-white/70">
                Lọc nhanh theo dữ liệu còn thiếu để chỉnh sửa tập trung hơn.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                className="ui-input accent-ring min-w-[220px]"
              >
                <option value="translations">Missing Translations</option>
                <option value="audio">Missing Audio</option>
                <option value="topics">Missing Topics</option>
              </select>

              <Button onClick={exportToExcel} className="w-full sm:w-auto">
                Export to Excel
              </Button>
            </div>
          </div>

          <div className="glass rounded-card grid gap-3 p-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-white/55">Need Update</p>
              <p className="mt-1 text-2xl font-bold text-[#ffac7b]">{filteredSamples.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-sky-400/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-white/55">Visible Samples</p>
              <p className="mt-1 text-2xl font-bold text-sky-200">{audioSamples.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-amber-400/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-white/55">Current Mode</p>
              <p className="mt-1 text-sm font-semibold text-amber-200">{modeLabel}</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-white sm:text-lg">Bước 2: Inline Edit danh sách câu</h2>
            <p className="text-xs text-white/60 sm:text-sm">Chỉnh trực tiếp ngay trên từng card</p>
          </div>

          {filteredSamples.length > 0 ? (
            <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {filteredSamples.map((sample, index) => {
                const needsTranslation =
                  !sample.vietnameseTranslation || sample.vietnameseTranslation.trim() === '';
                const hasMissingAudio = ['Brian', 'Joanna', 'Olivia'].some(
                  (voice) => !sample.audio?.[voice] || !sample.audio[voice].trim()
                );
                const needsTopic = !sample.topic || sample.topic.trim() === '';
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
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-10 text-center">
              <p className="text-base font-semibold text-white/85">Không có câu nào cần cập nhật ở chế độ này.</p>
              <p className="mt-2 text-sm text-white/60">Hãy đổi mode để kiểm tra nhóm dữ liệu khác.</p>
            </div>
          )}
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-4">
            <h3 className="text-base font-semibold text-white sm:text-lg">Bước 3: Manual Edit (Selected Sample)</h3>

            <div>
              <label htmlFor="audio-select" className="mb-1 block text-xs text-white/70">
                Select Audio Sample
              </label>
              <select
                id="audio-select"
                value={currentIndex}
                onChange={handleSelectChange}
                className="ui-input accent-ring"
              >
                {filteredSamples.map((sample, index) => (
                  <option className="text-black" key={sample.id} value={index}>
                    {sample.text}
                  </option>
                ))}
              </select>
            </div>

            {currentSample ? (
              editing ? (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="text" className="mb-1 block text-xs text-white/70">
                      Text
                    </label>
                    <Input
                      id="text"
                      multiline
                      value={currentSample.text}
                      onChange={(e) => handleChange(e, 'text')}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label htmlFor="vietnameseTranslation" className="mb-1 block text-xs text-white/70">
                      Vietnamese Translation
                    </label>
                    <Input
                      id="vietnameseTranslation"
                      multiline
                      value={currentSample.vietnameseTranslation || ''}
                      onChange={(e) => handleChange(e, 'vietnameseTranslation')}
                      placeholder="Enter Vietnamese translation here"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label htmlFor="occurrence" className="mb-1 block text-xs text-white/70">
                      Occurrence
                    </label>
                    <Input
                      id="occurrence"
                      type="number"
                      value={currentSample.occurrence}
                      onChange={(e) => handleChange(e, 'occurrence')}
                    />
                  </div>

                  <div>
                    <label htmlFor="topic" className="mb-1 block text-xs text-white/70">
                      Topic
                    </label>
                    <select
                      id="topic"
                      className="ui-input accent-ring"
                      value={currentSample.topic || 'General'}
                      onChange={(e) => handleChange(e, 'topic')}
                    >
                      {DEFAULT_TOPICS.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs text-white/70">Audio URLs</label>
                    {['Brian', 'Joanna', 'Olivia'].map(renderAudioField)}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button className="w-full sm:w-auto" onClick={handleSaveClick} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => setEditing(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/90">
                    <span className="font-semibold text-white/70">Text:</span> {currentSample.text}
                  </p>

                  {currentSample.vietnameseTranslation && (
                    <p className="text-sm text-white/85">
                      <span className="font-semibold text-white/70">Vietnamese:</span>{' '}
                      {currentSample.vietnameseTranslation}
                    </p>
                  )}

                  <p className="text-sm text-white/80">
                    <span className="font-semibold text-white/70">Occurrence:</span> {currentSample.occurrence}
                  </p>

                  <div>
                    <p className="mb-1 text-xs text-white/65">Audio URLs</p>
                    <div className="space-y-1 text-xs text-white/75">
                      {Object.entries(currentSample.audio).map(([voice, url]) => (
                        <p key={voice}>
                          <span className="font-semibold text-white/65">{voice}:</span>{' '}
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-sky-300 underline underline-offset-2"
                            >
                              {url}
                            </a>
                          ) : (
                            <span className="text-rose-300">Missing</span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={handleEditClick}>
                      Edit Selected
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        if (currentIndex + 1 < filteredSamples.length) {
                          setCurrentIndex(currentIndex + 1);
                        }
                      }}
                      disabled={currentIndex + 1 >= filteredSamples.length}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <p className="text-sm text-white/60">Không có sample nào trong filter hiện tại.</p>
            )}

            <input
              type="file"
              accept="audio/mp3"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
          </Card>

          <div className="space-y-4">
            <Card className="space-y-4">
              <h3 className="text-base font-semibold text-white sm:text-lg">Bulk Vietnamese Translation Update</h3>
              <p className="text-sm text-white/70">
                Format:{' '}
                <span className="font-semibold text-[#ffac7b]">English text | Vietnamese translation</span>
              </p>

              <Input
                multiline
                value={translationBulkText}
                onChange={(e) => setTranslationBulkText(e.target.value)}
                rows={8}
                placeholder={
                  'Example:\nThe weather is nice today. | Thời tiết hôm nay đẹp.\nI like to read books. | Tôi thích đọc sách.'
                }
              />

              <Button className="w-full sm:w-auto" onClick={handleBulkTranslationUpdate}>
                Update Translations
              </Button>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-base font-semibold text-white sm:text-lg">Bulk Topic Update</h3>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <h4 className="text-sm font-semibold text-white/90">Bulk Update with Selected Topic</h4>
                <p className="text-xs text-white/60">
                  1) Chọn topic → 2) Dán câu tiếng Anh (mỗi dòng 1 câu) → 3) Update hàng loạt.
                </p>

                <select
                  value={bulkTopic}
                  onChange={(e) => setBulkTopic(e.target.value)}
                  className="ui-input accent-ring"
                >
                  <option value="">Choose topic to assign</option>
                  {DEFAULT_TOPICS.filter((topic) => topic !== 'All').map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>

                <Input
                  multiline
                  value={bulkSentencesText}
                  onChange={(e) => setBulkSentencesText(e.target.value)}
                  rows={6}
                  placeholder={
                    'Paste English sentences here (one per line):\nThe weather is nice today.\nI like to read books.\nShe is going to the market.'
                  }
                />

                <Button className="w-full sm:w-auto" onClick={handleBulkTopicUpdate}>
                  Update All Sentences
                </Button>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <h4 className="text-sm font-semibold text-white/90">Advanced Update (Individual Topics)</h4>
                <p className="text-xs text-white/60">
                  Format: <span className="font-semibold text-[#ffac7b]">English text | Topic</span>
                </p>

                <Input
                  multiline
                  value={advancedTopicText}
                  onChange={(e) => setAdvancedTopicText(e.target.value)}
                  rows={6}
                  placeholder={
                    'Example:\nThe weather is nice today. | Environment & Nature\nI like to read books. | Education & Learning'
                  }
                />

                <Button variant="secondary" className="w-full sm:w-auto" onClick={handleAdvancedTopicUpdate}>
                  Update Topics
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <Card className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-white sm:text-lg">Bulk Audio Upload</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="secondary"
                onClick={reuseExistingUrls}
                disabled={reusingUrls}
                className="w-full sm:w-auto"
              >
                {reusingUrls ? 'Updating...' : 'Reuse URLs'}
              </Button>
              <Button variant="secondary" onClick={cleanupDuplicates} className="w-full sm:w-auto">
                Clean Duplicates
              </Button>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3">
              <h4 className="text-sm font-semibold text-white/85">Successfully Uploaded</h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="text-xs text-white/70">
                  <span className="font-semibold text-emerald-300">{file.voice}</span>: {file.name}
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-white/70">
            Chọn nhiều file mp3 cùng lúc. Format filename:{' '}
            <span className="font-semibold text-[#ffac7b]">number_Voice_Text.mp3</span>
          </p>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-white/70">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isBulkUploading ? 'animate-pulse bg-[#fc5d01]' : 'bg-white/35'
                }`}
              />
              {isBulkUploading ? 'Uploading files...' : 'Ready to upload'}
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] transition-all duration-300"
                style={{ width: isBulkUploading ? `${bulkUploadProgress}%` : '0%' }}
              />
            </div>

            {isBulkUploading && <p className="mt-1 text-xs text-white/60">{bulkUploadProgress}% complete</p>}
          </div>

          <input
            type="file"
            accept="audio/mp3"
            multiple
            onChange={handleBulkFileUpload}
            ref={bulkFileInputRef}
            disabled={isBulkUploading}
            className="block w-full text-sm text-white/75 file:mr-4 file:rounded-btn file:border-0 file:bg-[#fc5d01] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#fd7f33] disabled:opacity-50"
          />
        </Card>
      </main>
    </AppShellBackground>
  );
};

export default EditAudioSamplePage;
