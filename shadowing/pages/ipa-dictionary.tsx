import { useState, useEffect } from 'react';
import { commonWords } from '../utils/ipaConverter';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface DictionaryEntry {
  word: string;
  ipa: string;
  id?: string;
}

const IPADictionary = () => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [newWord, setNewWord] = useState('');
  const [newIPA, setNewIPA] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-black placeholder-gray-400";
  const tableInputClasses = "w-full px-3 py-1.5 text-sm font-mono border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-black";

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const querySnapshot = await getDocs(collection(db, 'ipaWords'));
      const fetchedEntries: DictionaryEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedEntries.push({
          word: data.word,
          ipa: data.ipa,
          id: doc.id
        });
      });

      Object.entries(commonWords).forEach(([word, ipa]) => {
        if (!fetchedEntries.some(entry => entry.word === word)) {
          fetchedEntries.push({ word, ipa });
        }
      });

      setEntries(fetchedEntries.sort((a, b) => a.word.localeCompare(b.word)));
    } catch (error) {
      console.error('Error fetching entries:', error);
      setMessage('Error loading dictionary entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newWord.trim() || !newIPA.trim()) {
      setMessage('Both word and IPA transcription are required');
      return;
    }

    const existingIndex = entries.findIndex(e => e.word === newWord.toLowerCase());
    if (existingIndex >= 0) {
      setMessage('Word already exists. Edit the existing entry instead.');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'ipaWords'), {
        word: newWord.toLowerCase(),
        ipa: newIPA
      });

      const newEntry: DictionaryEntry = {
        word: newWord.toLowerCase(),
        ipa: newIPA,
        id: docRef.id
      };

      setEntries(prev => [...prev, newEntry].sort((a, b) => a.word.localeCompare(b.word)));
      setNewWord('');
      setNewIPA('');
      setMessage('Entry added successfully');
    } catch (error) {
      console.error('Error adding entry:', error);
      setMessage('Error adding entry');
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkInput.trim()) {
      setMessage('Please enter some entries to add');
      return;
    }

    try {
      const lines = bulkInput.trim().split('\n');
      const newEntries: DictionaryEntry[] = [];
      const skippedWords: string[] = [];
      const invalidLines: string[] = [];

      for (const line of lines) {
        const [word, ipa] = line.split(',').map(s => s.trim());
        
        if (!word || !ipa) {
          invalidLines.push(line);
          continue;
        }

        const normalizedWord = word.toLowerCase();
        
        if (entries.some(e => e.word === normalizedWord)) {
          skippedWords.push(word);
          continue;
        }

        try {
          const docRef = await addDoc(collection(db, 'ipaWords'), {
            word: normalizedWord,
            ipa
          });

          newEntries.push({
            word: normalizedWord,
            ipa,
            id: docRef.id
          });
        } catch (error) {
          console.error(`Error adding entry for word: ${word}`, error);
          invalidLines.push(line);
        }
      }

      if (newEntries.length > 0 || skippedWords.length > 0) {
        setEntries(prev => [...prev, ...newEntries].sort((a, b) => a.word.localeCompare(b.word)));
        
        let statusMessage = [];
        if (newEntries.length > 0) {
          statusMessage.push(`Added ${newEntries.length} new entries`);
        }
        if (skippedWords.length > 0) {
          statusMessage.push(`Skipped ${skippedWords.length} existing words`);
        }
        if (invalidLines.length > 0) {
          statusMessage.push(`Failed to process ${invalidLines.length} lines`);
        }
        
        setMessage(statusMessage.join('. '));
        
        if (newEntries.length === lines.length) {
          setBulkInput('');
          setShowBulkAdd(false);
        }
      } else {
        if (skippedWords.length === lines.length) {
          setMessage('All words already exist in the dictionary');
        } else {
          setMessage(`Failed to add entries. Invalid format in lines: ${invalidLines.join('; ')}`);
        }
      }
    } catch (error) {
      console.error('Error in bulk add:', error);
      setMessage('Error processing bulk add');
    }
  };

  const handleUpdateEntry = async (index: number, word: string, newIPA: string) => {
    const entry = entries[index];
    if (!entry.id) {
      try {
        const docRef = await addDoc(collection(db, 'ipaWords'), {
          word,
          ipa: newIPA
        });
        
        setEntries(prev => {
          const updated = [...prev];
          updated[index] = { word, ipa: newIPA, id: docRef.id };
          return updated;
        });
        setMessage('Entry updated successfully');
      } catch (error) {
        console.error('Error creating entry:', error);
        setMessage('Error updating entry');
      }
      return;
    }

    try {
      await updateDoc(doc(db, 'ipaWords', entry.id), {
        ipa: newIPA
      });

      setEntries(prev => {
        const updated = [...prev];
        updated[index] = { ...entry, ipa: newIPA };
        return updated;
      });
      setMessage('Entry updated successfully');
    } catch (error) {
      console.error('Error updating entry:', error);
      setMessage('Error updating entry');
    }
  };

  const handleDeleteEntry = async (word: string) => {
    const entry = entries.find(e => e.word === word);
    if (!entry?.id) {
      setMessage('Cannot delete default common words');
      return;
    }

    try {
      await deleteDoc(doc(db, 'ipaWords', entry.id));
      setEntries(prev => prev.filter(e => e.word !== word));
      setMessage('Entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      setMessage('Error deleting entry');
    }
  };

  const handleExport = () => {
    const dictionary = entries.reduce((acc, { word, ipa }) => {
      acc[word] = ipa;
      return acc;
    }, {} as { [key: string]: string });

    const content = `// Common English words with their IPA transcriptions
export const commonWords: { [key: string]: string } = ${JSON.stringify(dictionary, null, 2)};
`;

    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ipaCommonWords.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage('Dictionary exported successfully');
  };

  const filteredEntries = entries.filter(entry =>
    entry.word.includes(searchTerm.toLowerCase()) ||
    entry.ipa.includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dictionary...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              IPA Dictionary Manager
            </h1>
            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                message.includes('Error') || message.includes('Failed')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : message.includes('Skipped') || message.includes('already exist')
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}
          </div>

          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Add Entries</h2>
                <button
                  onClick={() => setShowBulkAdd(!showBulkAdd)}
                  className="text-sm text-indigo-600 hover:text-indigo-900 font-medium focus:outline-none focus:underline"
                >
                  {showBulkAdd ? 'Single Entry Mode' : 'Bulk Add Mode'}
                </button>
              </div>

              {showBulkAdd ? (
                <div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bulk Add Entries (one per line, format: word, IPA)
                    </label>
                    <textarea
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      className={inputClasses}
                      placeholder="Example:&#10;hello, həˈloʊ&#10;world, wɜrld"
                      rows={6}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Note: Existing words will be skipped automatically
                    </p>
                  </div>
                  <button
                    onClick={handleBulkAdd}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Add All Entries
                  </button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Word
                      </label>
                      <input
                        type="text"
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        className={inputClasses}
                        placeholder="Enter word..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IPA Transcription
                      </label>
                      <input
                        type="text"
                        value={newIPA}
                        onChange={(e) => setNewIPA(e.target.value)}
                        className={inputClasses}
                        placeholder="Enter IPA..."
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddEntry}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Add Entry
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Dictionary Entries ({filteredEntries.length})
              </h2>
              <div className="flex gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${inputClasses} w-64 pl-10 pr-4`}
                    placeholder="Search entries..."
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Export Dictionary
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Word
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      IPA Transcription
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries.map((entry, index) => (
                    <tr 
                      key={entry.word}
                      className={`${!entry.id ? 'bg-gray-50' : 'hover:bg-gray-50'} transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{entry.word}</span>
                          {!entry.id && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                              default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={entry.ipa}
                          onChange={(e) => handleUpdateEntry(index, entry.word, e.target.value)}
                          className={tableInputClasses}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.id && (
                          <button
                            onClick={() => handleDeleteEntry(entry.word)}
                            className="text-red-600 hover:text-red-900 font-medium focus:outline-none focus:underline"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPADictionary;
