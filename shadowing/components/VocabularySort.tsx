import { useEffect, useRef, useState } from 'react';
import { dictionary } from '../data/vocabularyDictionary';
import type { Deck, Word } from '../data/vocabulary';
import Card from './ui/Card';
import Button from './ui/Button';
import VocabularyPhoto from './VocabularyPhoto';

type Mark = 'known' | 'unknown';

function WordCard({ word }: { word: Word }) {
  const note = dictionary[word.term];
  const us = word.ipaUS || note?.us, uk = word.ipaUK || note?.uk;
  const pronunciations = <>{us && <span>US /{us}/</span>}{uk && <span>UK /{uk}/</span>}</>;
  const url = `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word.term)}`;
  const dialog = useRef<HTMLDialogElement>(null);
  const example = word.example.split(/(\b[A-Za-z]+\b)/).map((s, i) => s.toLowerCase() === word.term ? <mark key={i}>{s}</mark> : s);
  return <div className="space-y-4"><h3 lang="en" className="text-3xl font-bold text-primaryHover">{word.term}</h3>
    {(us || uk) && <p className="flex flex-wrap gap-4 text-textGlass-secondary">{pronunciations}</p>}
    <a className="accent-ring inline-flex min-h-[44px] items-center text-sm underline" href={url} rel="noopener noreferrer" target="_blank">Nghe phát âm trên Cambridge ↗<span className="sr-only"> (mở tab mới)</span></a>
    <div className="vocab-definition"><Button variant="secondary" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>Xem nghĩa và hình minh họa</Button></div>
    <dialog ref={dialog} className="vocab-reader" aria-labelledby="vocab-reader-title">
      <header><button type="button" className="vocab-reader-close" aria-label="Đóng cửa sổ tra từ" onClick={() => dialog.current?.close()}>×</button>
        <h2 id="vocab-reader-title" lang="en">{word.term}</h2>
        <div className="vocab-reader-ipa">{pronunciations}<a href={url} target="_blank" rel="noopener noreferrer">Nghe phát âm trên Cambridge ↗</a></div>
      </header>
      <div className="vocab-reader-columns">
        <section aria-label="Nghĩa tiếng Việt"><h3>Nghĩa tiếng Việt</h3><p><small>{word.part}</small> <strong>{word.meaning}</strong></p>
          <ol><li><span lang="en">{example}</span>{word.translation && <p className="vocab-translation">{word.translation}</p>}</li></ol>
          {word.imageUrl ? <VocabularyPhoto word={word} /> : note && <figure><svg role="img" aria-label={note.caption} viewBox="0 0 128 88" className="mx-auto h-28"><path d={note.drawing} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg><figcaption>{note.caption}</figcaption></figure>}
        </section>
        <section lang="en" aria-label="English definitions"><h3>English Definitions</h3>{(word.definition || note) && <p><small>{word.part}</small> <strong>{word.definition || note?.definition}</strong></p>}
          <ol><li>{example}</li></ol><div className="vocab-reader-form"><small>Base form</small> {word.term}</div>
        </section>
      </div>
    </dialog></div>;
}

export default function VocabularySort({ deck, storageKey }: { deck: Deck; storageKey: string }) {
  const [marks, setMarks] = useState<Record<string, Mark>>({}), [ready, setReady] = useState(false);
  const [queue, setQueue] = useState<Word[] | null>(null), [index, setIndex] = useState(0), [error, setError] = useState('');
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const valid: Record<string, Mark> = {};
      for (const { term } of deck.words) if (raw?.[term] === 'known' || raw?.[term] === 'unknown') valid[term] = raw[term];
      setMarks(valid);
    } catch { setError('Không đọc được phân loại đã lưu.'); }
    setReady(true);
  }, [deck, storageKey]);
  const unknown = deck.words.filter(w => marks[w.term] === 'unknown');
  const known = deck.words.filter(w => marks[w.term] === 'known').length;
  const word = queue?.[index];
  function start(words: Word[]) { setQueue(words); setIndex(0); }
  function classify(mark: Mark) {
    if (!word) return;
    const next = { ...marks, [word.term]: mark }; setMarks(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { setError('Không lưu được trên thiết bị; phân loại chỉ còn trong phiên này.'); }
    setIndex(index + 1);
  }
  return <Card><div className="space-y-4"><p className="home-eyebrow">03 · TỰ ĐÁNH GIÁ / {deck.topic}</p>
    <h2 className="text-2xl font-bold">Đã biết hay chưa biết?</h2>
    <p aria-live="polite" className="text-sm text-textGlass-secondary">{known} đã biết · {unknown.length} chưa biết · {deck.words.length - known - unknown.length} chưa phân loại</p>
    {error && <p role="alert">{error}</p>}
    {queue && word ? <><div className="flex items-center justify-between gap-3"><p aria-live="polite">Thẻ {index + 1}/{queue.length}</p><Button variant="secondary" onClick={() => setQueue(null)}>Đóng phiên</Button></div>
      <WordCard key={word.term} word={word} /><div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>Thẻ trước</Button><Button variant="secondary" onClick={() => classify('unknown')}>Chưa biết</Button><Button onClick={() => classify('known')}>Đã biết</Button></div></> : <>
      <p>{queue ? 'Đã phân loại xong phiên này.' : 'Thử nhớ nghĩa trước khi mở thẻ. Lựa chọn của bạn không làm thay đổi XP hay lịch ôn.'}</p>
      <div className="flex flex-wrap gap-3"><Button disabled={!ready} onClick={() => start(deck.words)}>Phân loại cả bộ</Button><Button variant="secondary" disabled={!ready || !unknown.length} onClick={() => start(unknown)}>Ôn nhóm chưa biết ({unknown.length})</Button></div></>}
  </div></Card>;
}