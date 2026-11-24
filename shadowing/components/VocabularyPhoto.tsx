import Image from 'next/image';
import type { Word } from '../data/vocabulary';

export default function VocabularyPhoto({ word }: { word: Word }) {
  if (!word.imageUrl) return null;
  return <figure><Image unoptimized width={640} height={360} className="vocabulary-photo" src={word.imageUrl} alt={word.imageCaption || word.meaning} />
    {word.imageCaption && <figcaption>{word.imageCaption}</figcaption>}</figure>;
}