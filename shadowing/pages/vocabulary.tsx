import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import AppShellBackground from '../components/ui/AppShellBackground';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Tabs from '../components/ui/Tabs';
import VocabularyRound, { Round } from '../components/VocabularyRound';
import VocabularySort from '../components/VocabularySort';
import { decks as starterDecks, Deck, Word } from '../data/vocabulary';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { assembleDecks, Topic } from '../lib/vocabularyCatalog';
import { dayKey, Mode, modes, Progress, score, shuffle } from '../lib/vocabulary';

const fold = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const hints = { flash: 'Xem nghĩa, nghe phát âm và đọc ví dụ.', match: 'Chọn nghĩa tiếng Việt của từ.', memory: 'Lật thẻ để tìm từng cặp từ và nghĩa.', spell: 'Viết lại từ dựa trên các chữ cái đã đảo.', recall: 'Chỉ nhìn nghĩa tiếng Việt và tự gõ từ.' };

function Studio({ storageKey, decks }: { storageKey: string; decks: Deck[] }) {
  const [progress, setProgress] = useState<Progress>({}), [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false), [now, setNow] = useState(Date.now);
  const [query, setQuery] = useState(''), [topic, setTopic] = useState('');
  const [deck, setDeck] = useState(decks[0]), [mode, setMode] = useState<Mode>('flash');
  const [round, setRound] = useState<Round | null>(null), [roundId, setRoundId] = useState(0);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const valid: Progress = {};
      for (const term of Object.keys(saved || {})) { const v = saved[term]; if (!(term in Object.prototype) && v && [v.best, v.recalls, v.due, v.xp].every(Number.isFinite) && typeof v.day === 'string') valid[term] = v; }
      setProgress(valid);
    } catch { setNotice('Không đọc được tiến độ cũ trên trình duyệt này.'); }
    setReady(true);
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [storageKey]);
  function record(w: Word, ok: boolean) {
    const time = Date.now(), old = progress[w.term], entry = score(old, round!.mode, ok, time);
    const updated = { ...progress, [w.term]: entry };
    setProgress(updated); setNow(time);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { setNotice('Trình duyệt không lưu được tiến độ. Bạn vẫn có thể học trong phiên này.'); }
    return entry.xp - (old?.xp ?? 0);
  }
  const allWords = decks.flatMap(d => d.words);
  const entries = Object.values(progress), due = allWords.filter(w => progress[w.term]?.due <= now);
  const today = entries.filter(e => e.day === dayKey(now)).length;
  function start(words: Word[], selected: Mode, title: string) {
    setRoundId(id => id + 1); setRound({ words: shuffle(words), mode: selected, title }); window.scrollTo(0, 0);
  }
  const filtered = decks.filter(d => (!topic || d.topic === topic) && fold([d.topic, ...d.words.map(w => w.term + ' ' + w.meaning)].join(' ')).includes(fold(query)));
  return <AppShellBackground><Head><title>PTE Intensive Vocabulary | Học từ vựng</title></Head>
    <main lang="vi" className="vocabulary mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-28 sm:px-6">
      {notice && <p role="alert">{notice}</p>}
      {round ? <Card><VocabularyRound key={roundId} {...round} pool={round.title === deck.topic ? deck.words : allWords} record={record} retry={words => start(words, round.mode, round.title)} exit={() => setRound(null)} /></Card> : <>
        <Card><p className="home-eyebrow">PTE INTENSIVE VOCABULARY</p><h1 className="my-4 text-3xl font-bold sm:text-4xl">Học qua trò chơi.<br /><span className="text-primaryHover">Nhớ bằng thực hành.</span></h1>
          <p className="text-textGlass-secondary">Làm quen với một bộ từ, rồi thử tự viết lại khi không còn gợi ý.</p>
          <div className="mt-6 flex flex-wrap gap-3"><a className="ui-button-primary accent-ring" href="#vocab-library">Bắt đầu học</a><Button variant="secondary" disabled={!due.length || !ready} onClick={() => start(due, 'recall', 'Ôn tập hôm nay')}>Ôn tập hôm nay ({due.length})</Button></div>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-glass-border pt-4 sm:grid-cols-4">{[['Tổng XP', entries.reduce((n, e) => n + e.xp, 0)], ['Từ đã luyện', entries.length], ['Đến hạn ôn', due.length], ['Mục tiêu hôm nay', `${Math.min(today, 5)}/5 từ`]].map(([label, value]) => <div key={label}><dt className="text-sm text-textGlass-secondary">{label}</dt><dd className="text-xl font-bold">{value}</dd></div>)}</dl></Card>
        <section id="vocab-library" className="scroll-mt-28 space-y-4"><span className="home-eyebrow">01 · THƯ VIỆN</span><h2 className="text-2xl font-bold">Chọn bộ từ</h2>
          <div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Tìm bộ từ" type="search" placeholder="Tìm bộ từ hoặc từ khóa…" value={query} onChange={e => setQuery(e.target.value)} />
            <select aria-label="Lọc theo chủ đề" className="ui-input" value={topic} onChange={e => setTopic(e.target.value)}><option value="">Tất cả chủ đề</option>{decks.map(d => <option key={d.topic}>{d.topic}</option>)}</select></div>
          <div className="grid gap-3 sm:grid-cols-2">{filtered.map(d => <Button key={d.topic} variant="secondary" aria-pressed={deck === d} className="text-left" onClick={() => setDeck(d)}><span className="block text-lg font-bold">{d.topic} {d === deck && '✓'}</span><span className="text-sm">Đã luyện {d.words.filter(w => progress[w.term]).length}/{d.words.length} từ</span></Button>)}</div>
          {!filtered.length && <p role="status">Không tìm thấy bộ từ. Hãy đổi bộ lọc hoặc từ khóa.</p>}</section>
        <Card><p className="home-eyebrow">02 · PHÒNG LUYỆN</p><h2 className="my-4 text-2xl font-bold">{deck.topic} · {deck.words.length} từ</h2>
          <Tabs items={Object.entries(modes).map(([key, label]) => ({ key, label }))} activeKey={mode} onChange={k => setMode(k as Mode)} />
          <div role="tabpanel" aria-label={modes[mode]}><p className="my-4">{hints[mode]}</p><Button disabled={!ready} onClick={() => start(deck.words, mode, deck.topic)}>Bắt đầu {modes[mode]}</Button></div></Card>
        <VocabularySort key={deck.topic} deck={deck} storageKey={`${storageKey}:sort:${deck.topic}`} />
        <p className="text-sm text-textGlass-secondary">Tiến độ được lưu cho tài khoản này trên trình duyệt hiện tại, chưa đồng bộ giữa các thiết bị. Xóa dữ liệu trình duyệt sẽ xóa tiến độ.</p>
      </>}
    </main></AppShellBackground>;
}

export default function VocabularyPage() {
  const { userId } = useAuth();
  const [catalog, setCatalog] = useState<Deck[] | null>(null), [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    Promise.all([getDocs(collection(db, 'vocabularyWords')), getDocs(collection(db, 'vocabularyTopics'))]).then(([words, topics]) => {
      if (active) setCatalog(assembleDecks(words.docs.map(d => ({topic: d.get('topic'), word: d.data() as Word})), topics.docs.map(d => d.data() as Topic)));
    }).catch(() => { if (active) { setFailed(true); setCatalog(starterDecks); } });
    return () => { active = false; };
  }, [userId]);
  if (!userId) return null;
  if (!catalog) return <p className="pt-28 text-center" role="status">Đang tải bộ từ…</p>;
  return <>{failed && <p className="pt-24 text-center" role="status">Chưa tải được từ đã xuất bản. Bạn vẫn có thể học bộ từ mẫu.</p>}<Studio key={userId} decks={catalog} storageKey={`pte-vocabulary:v1:${userId}`} /></>;
}