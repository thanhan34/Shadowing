import React, { useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { validateRepeatSentenceResources } from "../lib/repeatSentenceResources";
import Button from "./ui/Button";
import Input from "./ui/Input";

interface Props {
  id: string;
  audioUrl: string;
  practiceUrl: string;
  disabled?: boolean;
  onSavingChange: (saving: boolean) => void;
  onSaved: (audioUrl: string, practiceUrl: string) => void;
}

const RepeatSentenceResourceEditor: React.FC<Props> = ({ id, audioUrl, practiceUrl, disabled, onSaved, onSavingChange }) => {
  const [draftAudio, setDraftAudio] = useState(audioUrl);
  const [draftLink, setDraftLink] = useState(practiceUrl);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = saving || disabled;
  const changed = draftAudio.trim() !== audioUrl || draftLink.trim() !== practiceUrl || !!file;

  const reset = () => {
    setDraftAudio(audioUrl);
    setDraftLink(practiceUrl);
    setFile(null);
    setMessage("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const save = async () => {
    if (lock.current || busy || !changed) return;
    lock.current = true;
    setSaving(true);
    onSavingChange(true);
    setMessage("");
    try {
      const validated = validateRepeatSentenceResources(file ? "" : draftAudio, draftLink);
      let newAudioUrl = validated.audioUrl;
      if (file) {
        if (!/\.mp3$/i.test(file.name) || !file.size) throw new Error("Vui lòng chọn file MP3 không rỗng.");
        // New storage object avoids overwriting the currently published audio before Save succeeds.
        const storageRef = ref(storage, `audio/repeatsentence/${id}/Ryan/${crypto.randomUUID()}.mp3`);
        const uploaded = await uploadBytes(storageRef, file, { contentType: "audio/mpeg" });
        newAudioUrl = await getDownloadURL(uploaded.ref);
        // Retain the uploaded URL if Firestore fails so retry need not re-upload.
        setDraftAudio(newAudioUrl);
        setFile(null);
        if (fileInput.current) fileInput.current.value = "";
      }
      const patch: Record<string, string> = {};
      if (newAudioUrl !== audioUrl) patch["audio.Ryan"] = newAudioUrl;
      if (validated.practiceUrl !== practiceUrl) patch.practiceUrl = validated.practiceUrl;
      if (Object.keys(patch).length) await updateDoc(doc(db, "repeatsentence", id), patch);
      onSaved(newAudioUrl, validated.practiceUrl);
      setDraftAudio(newAudioUrl);
      setDraftLink(validated.practiceUrl);
      setMessage("Đã lưu audio Ryan và practice link.");
    } catch (error) {
      setMessage(`Không thể lưu: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      lock.current = false;
      setSaving(false);
      onSavingChange(false);
    }
  };

  return (
    <details className="rounded-2xl border border-white/15 bg-white/5">
      <summary className="accent-ring flex min-h-11 cursor-pointer items-center rounded-2xl px-4 py-3 text-sm font-semibold text-white/85">Audio Ryan & Practice link</summary>
      <div className="space-y-4 border-t border-white/10 p-4">
        <div>
          <label htmlFor={`rs-audio-url-${id}`} className="mb-1 block text-xs text-white/70">Audio Ryan URL</label>
          <Input id={`rs-audio-url-${id}`} type="url" value={draftAudio} disabled={busy || !!file} onChange={(event) => setDraftAudio(event.target.value)} placeholder="https://.../audio.mp3" />
          <p className="mt-2 text-xs text-white/60">Dán URL HTTPS hoặc chọn MP3 bên dưới để thay thế. Để trống URL và lưu để gỡ audio khỏi câu (không xóa file trên Storage).</p>
        </div>
        <div>
          <label htmlFor={`rs-audio-file-${id}`} className="mb-2 block text-xs text-white/70">Thay audio bằng file MP3</label>
          <input ref={fileInput} id={`rs-audio-file-${id}`} type="file" accept=".mp3,audio/mpeg,audio/mp3" disabled={busy} className="rs-upload-input accent-ring" onChange={(event) => {
            const selected = event.target.files?.[0];
            setMessage("");
            if (selected && (!/\.mp3$/i.test(selected.name) || !selected.size)) {
              setMessage("Vui lòng chọn file MP3 không rỗng.");
              event.target.value = "";
              setFile(null);
              return;
            }
            setFile(selected ?? null);
          }} />
          {file && <div className="mt-2 flex flex-wrap items-center gap-2"><p className="break-all text-xs text-white/70">Đã chọn: {file.name}. File chỉ được upload khi bấm lưu.</p><Button variant="secondary" disabled={busy} onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ""; }}>Bỏ chọn file</Button></div>}
        </div>
        <div>
          <label htmlFor={`rs-practice-url-${id}`} className="mb-1 block text-xs text-white/70">Practice link (APEUni)</label>
          <Input id={`rs-practice-url-${id}`} type="url" value={draftLink} disabled={busy} onChange={(event) => setDraftLink(event.target.value)} placeholder="https://www.apeuni.com/practice/repeat_sentences/170" />
          <p className="mt-2 text-xs text-white/60">Link đã lưu sẽ được dùng trên trang RepeatSentence. Nếu để trống, trang luyện tập tự tạo link theo ID câu.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button disabled={busy || !changed} onClick={() => void save()}>{saving ? "Đang lưu..." : "Lưu audio & link"}</Button>
          <Button variant="secondary" disabled={busy} onClick={reset}>Reset audio & link</Button>
        </div>
        {message && <p role="status" className="break-words text-sm text-white/80">{message}</p>}
      </div>
    </details>
  );
};

export default RepeatSentenceResourceEditor;