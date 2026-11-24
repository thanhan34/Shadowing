import Head from 'next/head';
import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { decks, Word } from '../../data/vocabulary';
import { cleanIpa, Topic, topicEntry, validTerm } from '../../lib/vocabularyCatalog';
import { commitWord, Published, Row, VocabularyConflict } from '../../lib/vocabularyAdmin';
import AppShellBackground from '../../components/ui/AppShellBackground';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import VocabularyPhoto from '../../components/VocabularyPhoto';

const mimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const empty: Word = { term: '', meaning: '', example: '', translation: '', part: '', definition: '', imageCaption: '' };
const fields = [ ['term', 'Từ tiếng Anh', true], ['meaning', 'Nghĩa tiếng Việt', true], ['example', 'Câu ví dụ tiếng Anh', true], ['translation', 'Bản dịch ví dụ', false], ['part', 'Từ loại', false], ['definition', 'Định nghĩa tiếng Anh', false] ] as const;
export default function VocabularyAdmin() {
  const [topic, setTopic] = useState(decks[0].topic), [word, setWord] = useState(empty);
  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null), [listError, setListError] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]), [topicError, setTopicError] = useState('');
  const [addingTopic, setAddingTopic] = useState(false), [topicName, setTopicName] = useState('');
  useEffect(() => onSnapshot(collection(db, 'vocabularyTopics'), snap => {
    setTopics(snap.docs.map(d => d.data() as Topic));
  }, () => setTopicError('Không tải được chủ đề từ Firebase. Hãy tải lại trang.')), []);
  async function createTopic() {
    if (busy) return;
    setBusy(true); setTopicError('');
    try {
      const { id, data } = topicEntry(topicName);
      const target = doc(db, 'vocabularyTopics', id);
      await runTransaction(db, async tx => {
        if ((await tx.get(target)).exists()) throw new VocabularyConflict('Chủ đề này đã tồn tại. Hãy chọn trong mục Bộ từ.');
        tx.set(target, data);
      });
      setTopics(items => items.some(t => t.topic === data.topic) ? items : [...items, data]);
      setTopic(data.topic); setAddingTopic(false); setTopicName(''); setMessage(`Đã tạo và chọn chủ đề “${data.topic}”.`);
    } catch (err) { setTopicError(err instanceof Error && !('code' in err) ? err.message : 'Không thể tạo chủ đề. Kiểm tra kết nối và quyền Firebase.'); }
    finally { setBusy(false); }
  }
  const fileInput = useRef<HTMLInputElement>(null), formRef = useRef<HTMLFormElement>(null);
  useEffect(() => onSnapshot(collection(db, 'vocabularyWords'), snap => {
    setRows(snap.docs.map(d => ({ id: d.id, data: d.data() as Published }))); setListError(false);
  }, () => setListError(true)), []);
  function select(row: Row | null) {
    setEditing(row); setWord(row ? { ...empty, ...row.data } : empty); if (row) setTopic(row.data.topic);
    setFile(null); if (fileInput.current) fileInput.current.value = '';
  }
  async function cleanPhoto(url?: string) {
    if (!url) return;
    try {
      const photo = ref(storage, url);
      if (photo.bucket === ref(storage).bucket && /^vocabulary-images\/[a-f\d-]{36}$/i.test(photo.fullPath)) await deleteObject(photo);
    } catch { setError('Thay đổi đã lưu nhưng chưa dọn được ảnh cũ trong Storage.'); }
  }
  async function remove(row: Row) {
    if (busy || !window.confirm(`Xóa “${row.data.term}” khỏi bộ ${row.data.topic}? Không thể hoàn tác.`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await commitWord(row, null); if (editing?.id === row.id) select(null);
      setMessage(`Đã xóa “${row.data.term}”.`); await cleanPhoto(row.data.imageUrl);
    } catch (err) { setError(err instanceof VocabularyConflict ? err.message : 'Không xóa được từ. Kiểm tra kết nối và quyền Firebase.'); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    const url = file ? URL.createObjectURL(file) : ''; setPreview(url);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [file]);
  async function publish(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy || addingTopic) return;
    const term = word.term.trim().toLowerCase().replace(/\s+/g, ' ');
    setMessage(''); setError('');
    if (!validTerm(term) || !word.meaning.trim() || !word.example.trim()) { setError('Nhập từ tiếng Anh hợp lệ, nghĩa và câu ví dụ.'); return; }
    if (decks.some(d => d.words.some(w => w.term === term))) { setError('Từ này đã có trong bộ từ mẫu.'); return; }
    const photo = file ? ref(storage, `vocabulary-images/${crypto.randomUUID()}`) : null;
    let uploaded = false; setBusy(true);
    try {
      let imageUrl = word.imageUrl || '';
      if (file && photo) {
        await uploadBytes(photo, file, { contentType: file.type }); uploaded = true; imageUrl = await getDownloadURL(photo);
      }
      await commitWord(editing, { ...word, term, meaning: word.meaning.trim(), example: word.example.trim(), ipaUK: cleanIpa(word.ipaUK), ipaUS: cleanIpa(word.ipaUS), topic, imageUrl });
      setMessage(`Đã ${editing ? 'cập nhật' : 'thêm'} “${term}” trong bộ ${topic}.`); select(null);
      if (editing?.data.imageUrl !== imageUrl) await cleanPhoto(editing?.data.imageUrl);
    } catch (err) {
      if (uploaded && photo) await deleteObject(photo).catch(() => {});
      setError(err instanceof VocabularyConflict ? err.message : 'Không lưu được từ. Kiểm tra kết nối và quyền ghi Firebase rồi thử lại.');
    } finally { setBusy(false); }
  }
  return <AppShellBackground><Head><title>Quản lý từ vựng | PTE Intensive</title></Head><main lang="vi" className="vocabulary mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-28">
    <header><p className="home-eyebrow">QUẢN TRỊ · THƯ VIỆN TỪ VỰNG</p><h1 className="my-3 text-3xl font-bold">Quản lý từ vựng</h1><p className="text-textGlass-secondary">Thêm, sửa hoặc xóa từ đã xuất bản trên Firebase. Danh sách không bao gồm từ mẫu.</p></header>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <Card><h2 className="text-xl font-bold">Từ đã xuất bản{rows && ` (${rows.length})`}</h2>
      {listError ? <p role="alert">Không tải được danh sách. Hãy tải lại trang để thử lại.</p> : !rows ? <p role="status">Đang tải…</p> : !rows.length ? <p>Chưa có từ nào. Thêm từ đầu tiên bằng biểu mẫu bên dưới.</p> : <ul className="divide-y divide-glass-border">{rows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><strong>{row.data.term}</strong> · {row.data.meaning}<p className="text-sm text-textGlass-secondary">{row.data.topic}</p></div><div className="flex gap-2"><Button disabled={busy} variant="secondary" onClick={() => { select(row); setMessage(''); setError(''); formRef.current?.scrollIntoView({block:'start'}); formRef.current?.querySelector('input')?.focus({preventScroll:true}); }}>Sửa</Button><Button variant="secondary" disabled={busy} onClick={() => remove(row)}>Xóa</Button></div></li>)}</ul>}</Card>
    <Card><form ref={formRef} className="scroll-mt-28" onSubmit={publish}><h2 className="mb-4 text-xl font-bold">{editing ? `Sửa từ: ${editing.data.term}` : 'Thêm từ mới'}</h2><fieldset disabled={busy} className="space-y-4"><label className="block">Bộ từ<select className="ui-input" value={topic} onChange={e => setTopic(e.target.value)}>{[...decks, ...topics].map(d => <option key={d.topic}>{d.topic}</option>)}</select></label>
      <Button variant="secondary" aria-expanded={addingTopic} onClick={() => { setAddingTopic(!addingTopic); setTopicError(''); }}>{addingTopic ? 'Hủy tạo chủ đề' : '+ Tạo chủ đề'}</Button>
      {addingTopic && <fieldset className="space-y-3 rounded-card border border-glass-border p-4"><legend>Chủ đề mới</legend>
        <label className="block">Tên chủ đề<Input maxLength={80} placeholder="Ví dụ: Công nghệ" value={topicName} onChange={e => setTopicName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); void createTopic(); } }} /></label>
        <Button disabled={!topicName.trim()} onClick={createTopic}>Lưu và chọn chủ đề</Button></fieldset>}
      {topicError && <p role="alert">{topicError}</p>}
      {fields.map(([key, label, required]) => <label key={key} className="block">{label}{required && ' *'}<Input required={required} maxLength={key === 'term' ? 64 : 500} value={word[key] || ''} onChange={e => setWord({ ...word, [key]: e.target.value })} /></label>)}
      <fieldset><legend>Phiên âm IPA (tùy chọn)</legend><div className="mt-2 grid gap-4 sm:grid-cols-2">
        {([['ipaUK', 'Anh–Anh (UK)', '/sɪˈmestə/'], ['ipaUS', 'Anh–Mỹ (US)', '/səˈmestɚ/']] as const).map(([key, label, placeholder]) => <label key={key}>{label}<Input name={key} value={word[key] || ''} maxLength={160} placeholder={placeholder} spellCheck={false} autoCapitalize="none" onChange={e => setWord({ ...word, [key]: e.target.value })} /></label>)}
      </div><p className="mt-2 text-sm text-textGlass-secondary">Có thể nhập một hoặc cả hai giọng, có hoặc không có dấu / /.</p></fieldset>
      <label className="block">Ảnh minh họa (tùy chọn)<input ref={fileInput} type="file" accept={mimeTypes.join(',')} className="rs-upload-input" onChange={e => {
        const f = e.target.files?.[0]; setError(''); setMessage('');
        if (f && (!mimeTypes.includes(f.type) || f.size === 0 || f.size > 5 * 1024 * 1024)) { e.target.value = ''; setFile(null); setError('Chọn ảnh JPG, PNG hoặc WebP không quá 5 MB.'); return; }
        setFile(f || null);
      }} /></label><p className="text-sm text-textGlass-secondary">JPG, PNG hoặc WebP · tối đa 5 MB.</p>
      {(file || word.imageUrl) && <><label className="block">Mô tả ảnh<Input maxLength={240} value={word.imageCaption || ''} onChange={e => setWord({ ...word, imageCaption: e.target.value })} /></label><VocabularyPhoto word={{ ...word, imageUrl: preview || word.imageUrl }} /><Button variant="secondary" onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ''; setWord({ ...word, imageUrl: '', imageCaption: '' }); }}>Bỏ ảnh</Button></>}
      {editing && word.term.trim().toLowerCase() !== editing.data.term && <p>Tiến độ cá nhân được lưu theo tên từ và không chuyển sang tên mới.</p>}
      <div className="flex gap-3"><Button type="submit" disabled={busy || addingTopic}>{busy ? 'Đang xử lý…' : editing ? 'Lưu thay đổi' : 'Xuất bản từ vựng'}</Button>{editing && <Button variant="secondary" onClick={() => { select(null); setError(''); setMessage(''); }}>Hủy sửa</Button>}</div></fieldset></form></Card>
    <Link className="ui-button-secondary accent-ring inline-flex items-center" href="/vocabulary">Mở trang học từ vựng →</Link>
  </main></AppShellBackground>;
}