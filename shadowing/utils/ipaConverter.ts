import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

// Common English words with their IPA transcriptions (fallback)
export const commonWords: { [key: string]: string } = {
  'the': 'ðə',
  'a': 'ə',
  'an': 'ən',
  'and': 'ænd',
  'of': 'əv',
  'to': 'tu',
  'in': 'ɪn',
  'is': 'ɪz',
  'are': 'ɑr',
  'was': 'wʌz',
  'were': 'wɜr',
  'will': 'wɪl',
  'would': 'wʊd',
  'can': 'kæn',
  'could': 'kʊd',
  'should': 'ʃʊd',
  'have': 'hæv',
  'has': 'hæz',
  'had': 'hæd',
  'been': 'bɪn',
  'being': 'ˈbiɪŋ',
};

// Cache for Firebase IPA mappings
let firebaseIPACache: { [key: string]: string } | null = null;

// Function to fetch IPA mappings from Firebase
async function fetchFirebaseIPAMappings() {
  if (firebaseIPACache) {
    return firebaseIPACache;
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'ipaWords'));
    const mappings: { [key: string]: string } = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      mappings[data.word] = data.ipa;
    });

    firebaseIPACache = mappings;
    return mappings;
  } catch (error) {
    console.error('Error fetching IPA mappings from Firebase:', error);
    return {};
  }
}

// Vowel patterns with accurate IPA equivalents
const vowelPatterns: [RegExp, string][] = [
  [/igh/, 'aɪ'],
  [/ee|ea/, 'i'],
  [/oo/, 'u'],
  [/oa/, 'oʊ'],
  [/ai|ay/, 'eɪ'],
  [/ie/, 'aɪ'],
  [/ou/, 'aʊ'],
  [/oi|oy/, 'ɔɪ'],
  [/ir|er|ur/, 'ɜr'],
  [/or/, 'ɔr'],
  [/ar/, 'ɑr'],
  [/au|aw/, 'ɔ'],
  [/a([^aeiou])e/, 'eɪ'],
  [/i([^aeiou])e/, 'aɪ'],
  [/o([^aeiou])e/, 'oʊ'],
  [/u([^aeiou])e/, 'ju'],
  [/e([^aeiou])$/, 'ə']
];

// Consonant patterns with accurate IPA equivalents
const consonantPatterns: [RegExp, string][] = [
  [/th(?=[aeiou])/, 'ð'],
  [/th/, 'θ'],
  [/ch/, 'tʃ'],
  [/sh/, 'ʃ'],
  [/ph/, 'f'],
  [/wh/, 'w'],
  [/ng/, 'ŋ'],
  [/ck/, 'k'],
  [/dg/, 'dʒ'],
  [/tion/, 'ʃən'],
  [/sion/, 'ʒən']
];

// Single letter to IPA mapping
const singleLetterMap: { [key: string]: string } = {
  'a': 'æ',
  'e': 'ɛ',
  'i': 'ɪ',
  'o': 'ɑ',
  'u': 'ʌ',
  'b': 'b',
  'c': 'k',
  'd': 'd',
  'f': 'f',
  'g': 'g',
  'h': 'h',
  'j': 'dʒ',
  'k': 'k',
  'l': 'l',
  'm': 'm',
  'n': 'n',
  'p': 'p',
  'q': 'k',
  'r': 'r',
  's': 's',
  't': 't',
  'v': 'v',
  'w': 'w',
  'x': 'ks',
  'y': 'j',
  'z': 'z'
};

function applyPatterns(word: string, patterns: [RegExp, string][]): string {
  let result = word.toLowerCase();
  for (const [pattern, replacement] of patterns) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

async function processWord(word: string): Promise<string> {
  const lowerWord = word.toLowerCase();
  
  // First check Firebase dictionary
  const firebaseMappings = await fetchFirebaseIPAMappings();
  if (firebaseMappings[lowerWord]) {
    return firebaseMappings[lowerWord];
  }

  // Then check static common words
  if (commonWords[lowerWord]) {
    return commonWords[lowerWord];
  }

  // Apply vowel and consonant patterns
  let ipa = word.toLowerCase();
  ipa = applyPatterns(ipa, vowelPatterns);
  ipa = applyPatterns(ipa, consonantPatterns);

  // Handle remaining single letters
  let result = '';
  for (let i = 0; i < ipa.length; i++) {
    const char = ipa[i];
    if (singleLetterMap[char]) {
      result += singleLetterMap[char];
    } else {
      result += char;
    }
  }

  return result;
}

export async function convertToIPA(text: string): Promise<string> {
  // Split text into words, preserving punctuation
  const words = text.match(/\b\w+\b|\W+/g) || [];
  
  // Convert each word to IPA
  const ipaWords = await Promise.all(words.map(word => {
    if (/^\W+$/.test(word)) {
      // Return punctuation and whitespace as-is
      return word;
    }
    return processWord(word);
  }));
  
  return ipaWords.join('');
}

// Add stress marks to syllables
export function addStressMarks(ipa: string): string {
  // Add primary stress to long vowels
  let result = ipa.replace(/([iɑɔuæeɪʊ])ː/g, 'ˈ$1ː');
  
  // Add secondary stress to compound words
  result = result.replace(/(\w+)-(\w+)/g, 'ˌ$1-$2');
  
  return result;
}
