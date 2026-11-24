import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Word } from '../data/vocabulary';

export type Published = Word & { topic: string; revision?: string };
export type Row = { id: string; data: Published };
export class VocabularyConflict extends Error {}

// The document ID is the normalized term. Rename and duplicate checking must be atomic.
export async function commitWord(original: Row | null, next: Published | null) {
  await runTransaction(db, async tx => {
    const source = original && doc(db, 'vocabularyWords', original.id);
    const previous = source && await tx.get(source);
    if (original && (!previous?.exists() || previous.get('revision') !== original.data.revision)) {
      throw new VocabularyConflict('Từ này đã thay đổi hoặc bị xóa. Hãy hủy thao tác và chọn lại từ trong danh sách.');
    }
    if (next) {
      const target = doc(db, 'vocabularyWords', next.term);
      if (original?.id !== next.term && (await tx.get(target)).exists()) throw new VocabularyConflict('Từ này đã được xuất bản.');
      tx.set(target, { ...previous?.data(), ...next, revision: crypto.randomUUID(), createdAt: previous?.get('createdAt') ?? serverTimestamp(), updatedAt: serverTimestamp() });
    }
    if (source && original.id !== next?.term) tx.delete(source);
  });
}