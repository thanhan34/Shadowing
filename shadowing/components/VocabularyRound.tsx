import { useState } from 'react';
import { Word } from '../data/vocabulary';
import { Mode, modes, shuffle } from '../lib/vocabulary';
import Button from './ui/Button';
import Input from './ui/Input';
import { dictionary } from '../data/vocabularyDictionary';

export interface Round { words: Word[]; mode: Mode; title: string }
interface Props extends Round { pool: Word[]; record: (word: Word, correct: boolean) => number; retry: (words: Word[]) => void; exit: () => void }

function EnglishFace({ word }: { word: Word }) {
  const [failed, setFailed] = useState(false);
  const drawing = dictionary[word.term]?.drawing;
  return <span className="vocab-game-face" lang="en"><strong>{word.term}</strong>
    {word.imageUrl && !failed ? <picture><img className="vocab-game-art" width={240} height={144} src={word.imageUrl} alt="" onError={() => setFailed(true)} /></picture> : drawing && <svg className="vocab-game-art" viewBox="0 0 128 88" aria-hidden="true"><path d={drawing} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
  </span>;
}

function Question({ word, pool, mode, answer, next }: { word: Word; pool: Word[]; mode: Mode; answer: (ok: boolean) => void; next: () => void }) {
  const [result, setResult] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [text, setText] = useState('');
  const [options] = useState(() => shuffle([word, ...shuffle(pool.filter(w => w.term !== word.term)).slice(0, 3)]));
  const [letters] = useState(() => { const s = shuffle(word.term.split('')).join(''); return (s === word.term ? s.slice(1) + s[0] : s).split('').join(' · '); });
  const submit = (ok: boolean) => { if (result === null) { setResult(ok); answer(ok); } };
  return <div className="space-y-5">
    <h3 className="vocab-game-prompt text-3xl font-bold">{mode === 'match' || mode === 'flash' ? <EnglishFace word={word} /> : word.meaning}</h3>
    {mode === 'flash' && !revealed && <Button onClick={() => setRevealed(true)}>Lật thẻ xem nghĩa</Button>}
    {mode === 'flash' && revealed && <><p>{word.meaning}</p><p lang="en" className="italic">{word.example}</p>
      {'speechSynthesis' in window && <Button variant="secondary" onClick={() => { const u = new SpeechSynthesisUtterance(word.term); u.lang = 'en-GB'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); }}>Nghe phát âm</Button>}
      <Button onClick={() => { answer(true); next(); }}>Đã xem · Tiếp tục</Button></>}
    {mode === 'match' && <div className="grid gap-3 sm:grid-cols-2">{options.map(w => <Button key={w.term} variant="secondary" disabled={result !== null} onClick={() => submit(w.term === word.term)}>{w.meaning}</Button>)}</div>}
    {(mode === 'spell' || mode === 'recall') && <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (text.trim()) submit(text.trim().toLowerCase() === word.term); }}>
      {mode === 'spell' && <p className="text-primaryHover">Chữ cái: {letters}</p>}
      <label className="block" htmlFor="vocab-answer">{mode === 'spell' ? 'Sắp xếp chữ cái và nhập từ' : 'Tự nhớ và nhập từ tiếng Anh'}</label>
      <Input id="vocab-answer" value={text} disabled={result !== null} autoComplete="off" autoCapitalize="none" spellCheck={false} onChange={e => setText(e.target.value)} />
      {result === null && <Button type="submit" disabled={!text.trim()}>Kiểm tra</Button>}</form>}
    {result !== null && <><div className="vocab-game-feedback" role="status"><p className="font-bold">{result ? '✓ Chính xác!' : 'Chưa đúng · Đáp án'}</p>{mode !== 'match' && <EnglishFace word={word} />}<p>{mode === 'match' && `${word.term} — `}{word.meaning}</p><i lang="en">{word.example}</i></div><Button onClick={next}>Tiếp tục</Button></>}
  </div>;
}

function Memory({ words, record, finish }: { words: Word[]; record: (w: Word, ok: boolean) => void; finish: () => void }) {
  const [cards] = useState(() => shuffle(words.flatMap(w => [{ w, english: true }, { w, english: false }])));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  function flip(i: number) {
    if (open.includes(i) || open.length === 2 || matched.includes(cards[i].w.term)) return;
    if (!open.length) { setOpen([i]); return; }
    const a = cards[open[0]].w, b = cards[i].w;
    if (a.term !== b.term) { setMissed([...missed, a.term, b.term]); setOpen([...open, i]); return; }
    record(a, !missed.includes(a.term)); setMatched([...matched, a.term]); setOpen([]);
  }
  return <div className="space-y-4"><p>Lật hai thẻ để ghép từ với nghĩa. Đã ghép {matched.length}/{words.length} cặp.</p>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{cards.map(({ w, english }, i) => {
      const done = matched.includes(w.term), visible = done || open.includes(i);
      return <Button key={i} variant="secondary" className="vocab-memory-tile" data-open={visible} disabled={visible || open.length === 2} onClick={() => flip(i)}>{visible ? <>{english ? <EnglishFace word={w} /> : w.meaning}{done && <small className="block">✓ Đã ghép</small>}</> : `Thẻ ${i + 1}`}</Button>;
    })}</div>
    {open.length === 2 && <><p role="status">Hai thẻ chưa khớp.</p><Button onClick={() => setOpen([])}>Úp lại hai thẻ</Button></>}
    {matched.length === words.length && <Button onClick={finish}>Xem kết quả</Button>}</div>;
}

export default function VocabularyRound({ words, mode, title, pool, record, retry, exit }: Props) {
  const [index, setIndex] = useState(0), [xp, setXp] = useState(0), [errors, setErrors] = useState<Word[]>([]);
  const [completed, setCompleted] = useState(0);
  const track = (w: Word, ok: boolean) => { const gain = record(w, ok); setCompleted(n => n + 1); setXp(n => n + gain); if (!ok) setErrors(items => [...items, w]); };
  if (index === words.length) return <div className="space-y-4"><span className="home-eyebrow">KẾT QUẢ PHIÊN HỌC</span><h2 className="text-2xl font-bold">Hoàn thành {title}</h2>
    <p>{mode === 'flash' ? `Đã xem ${words.length} từ` : `${words.length - errors.length}/${words.length} ${mode === 'memory' ? 'cặp không ghép nhầm' : 'câu đúng'}`} · +{xp} XP</p>
    {errors.length > 0 && <><p>Cần luyện lại: {errors.map(w => w.term).join(', ')}</p><Button onClick={() => retry(errors)}>Luyện lại từ sai</Button></>}
    <Button variant="secondary" onClick={exit}>Về thư viện</Button></div>;
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="home-eyebrow">{title}</span><h2 className="text-2xl font-bold">{modes[mode]}</h2></div><Button variant="secondary" onClick={exit}>Kết thúc sớm</Button></div>
    <div><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span>{completed}/{words.length} {mode === 'memory' ? 'cặp đã ghép' : 'thẻ hoàn thành'}</span><strong className="vocab-xp">+{xp} XP</strong></div><progress className="rs-upload-progress" aria-label="Tiến độ phiên học" max={words.length} value={completed} /></div>
    {mode === 'memory' ? <Memory words={words} record={track} finish={() => setIndex(words.length)} /> : <><p className="text-sm text-textGlass-secondary">Thẻ {index + 1} / {words.length}</p><Question key={index} word={words[index]} mode={mode} pool={pool} answer={ok => track(words[index], ok)} next={() => setIndex(i => i + 1)} /></>}</div>;
}