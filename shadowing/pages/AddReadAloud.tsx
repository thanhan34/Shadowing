import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDocs,
  QuerySnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import AppShellBackground from "../components/ui/AppShellBackground";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import TaskAdminTabs from "../components/ui/TaskAdminTabs";

type MessageType = "success" | "info" | "warning" | "error";

interface AppMessage {
  type: MessageType;
  text: string;
}

interface ReadAloudItem {
  id?: string;
  text: string;
  ID?: string;
  occurrence: number;
  createdAt?: Timestamp;
  isHidden?: boolean;
  vietnameseTranslation?: string;
  questionType?: string;
}

const TARGET_COLLECTION = "readaloud";
const TASK_SUFFIX = "RA";

const formatTaskId = (number: string) => `#${number} ${TASK_SUFFIX}`;

const normalizeTaskId = (value: string) =>
  value.trim().replace(/\s+/g, " ").replace(/read\s*aloud/gi, TASK_SUFFIX).toUpperCase();

const extractNumbersFromBulkText = (value: string) => {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  // Ưu tiên format mới kiểu:
  // #921 Volcano Behaviors
  // #921ShadowMedium
  // Undone
  // -> chỉ lấy số ở dòng tiêu đề đầu tiên để tránh bắt nhầm các dòng trạng thái/phân loại.
  const titleLineMatches = lines
    .map((line) => line.match(/^#(\d+)\s+.+$/))
    .filter((match): match is RegExpMatchArray => Boolean(match));

  if (titleLineMatches.length > 0) {
    return Array.from(new Set(titleLineMatches.map((match) => match[1])));
  }

  const strictMatches = Array.from(value.matchAll(/#(\d+)\s*(?:RA|Read\s*Aloud)/gi));
  if (strictMatches.length > 0) {
    return Array.from(new Set(strictMatches.map((match) => match[1])));
  }

  const flexibleMatches = lines
    .map((line) => line.match(/^#(\d+)/))
    .filter((match): match is RegExpMatchArray => Boolean(match));

  return Array.from(new Set(flexibleMatches.map((match) => match[1])));
};

const AddReadAloud: React.FC = () => {
  const router = useRouter();
  const [bulkText, setBulkText] = useState("");
  const [searchNumbers, setSearchNumbers] = useState("");
  const [searchResults, setSearchResults] = useState<{ existing: ReadAloudItem[]; missing: string[] }>({ existing: [], missing: [] });
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMissing, setSelectedMissing] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [allDocsSnapshot, setAllDocsSnapshot] = useState<QuerySnapshot<DocumentData> | null>(null);

  const messageTone = useMemo(
    () => ({ success: "text-emerald-300", info: "text-sky-300", warning: "text-amber-300", error: "text-rose-300" }),
    []
  );

  const appendMessage = (text: string, type: MessageType = "info") => {
    setMessages((prev) => [...prev, { text, type }].slice(-14));
  };

  useEffect(() => {
    setSelectedMissing((current) => {
      if (searchResults.missing.length === 0) return "";
      return searchResults.missing.includes(current) ? current : searchResults.missing[0];
    });
  }, [searchResults.missing]);

  const extractTextFromBulk = () => {
    if (!bulkText.trim()) {
      appendMessage("Vui lòng nhập nội dung để trích xuất mã Read Aloud.", "error");
      return;
    }

    const numbers = extractNumbersFromBulkText(bulkText);
    if (numbers.length === 0) {
      appendMessage("Không tìm thấy mã hợp lệ. Hỗ trợ cả format cũ (#number RA / #number Read Aloud) và format mới 3 dòng (#number Title, #numberShadow..., Undone).", "error");
      return;
    }

    setSearchNumbers(numbers.join(", "));
    setBulkText("");
    appendMessage(`Đã trích xuất ${numbers.length} mã Read Aloud.`, "success");
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchResults({ existing: [], missing: [] });

    try {
      const numberList = searchNumbers.split(",").map((n) => n.trim()).filter(Boolean);
      if (numberList.length === 0) {
        appendMessage("Vui lòng nhập danh sách số hợp lệ để tìm kiếm.", "error");
        return;
      }

      const searchIds = numberList.map((num) => formatTaskId(num));
      const querySnapshot = await getDocs(collection(db, TARGET_COLLECTION));

      const docsById = new Map<string, ReadAloudItem>();
      querySnapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data() as ReadAloudItem;
        if (data.ID) {
          docsById.set(normalizeTaskId(data.ID), { ...data, id: docSnapshot.id });
        }
      });

      const existing: ReadAloudItem[] = [];
      const foundIds = new Set<string>();

      searchIds.forEach((searchId) => {
        const normalizedId = normalizeTaskId(searchId);
        const found = docsById.get(normalizedId);
        if (found) {
          existing.push(found);
          foundIds.add(normalizedId);
        }
      });

      const missing = searchIds
        .filter((id) => !foundIds.has(normalizeTaskId(id)))
        .map((id) => id.replace("#", "").replace(` ${TASK_SUFFIX}`, ""));

      setSearchResults({ existing, missing });
      setAllDocsSnapshot(querySnapshot);
      appendMessage(`Đã tìm xong: tìm thấy ${existing.length}, thiếu ${missing.length}.`, "success");
    } catch (error) {
      appendMessage(`Lỗi khi tìm kiếm: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMissing = async () => {
    if (!selectedMissing || !newContent.trim()) {
      appendMessage("Vui lòng chọn mã còn thiếu và nhập nội dung đoạn đọc.", "error");
      return;
    }

    setIsAdding(true);
    try {
      const questionData: ReadAloudItem = {
        ID: formatTaskId(selectedMissing),
        text: newContent.trim(),
        occurrence: 1,
        createdAt: Timestamp.now(),
        isHidden: false,
        questionType: "New",
      };

      const docRef = await addDoc(collection(db, TARGET_COLLECTION), questionData);
      setSearchResults((prev) => ({
        existing: [...prev.existing, { ...questionData, id: docRef.id }],
        missing: prev.missing.filter((num) => num !== selectedMissing),
      }));

      appendMessage(`Đã thêm thành công ${formatTaskId(selectedMissing)}: "${newContent.trim()}"`, "success");
      setNewContent("");
    } catch (error) {
      appendMessage(`Lỗi khi thêm đoạn mới: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleComplete = async () => {
    if (!allDocsSnapshot) {
      appendMessage("Bạn cần tìm kiếm trước khi bấm Complete.", "warning");
      return;
    }
    if (searchResults.missing.length > 0) {
      appendMessage("Vui lòng thêm đủ tất cả mã còn thiếu trước khi Complete.", "warning");
      return;
    }

    setIsCompleting(true);
    setCompletionProgress(0);

    try {
      const foundDocIds = new Set(searchResults.existing.map((item) => item.id).filter(Boolean));
      const totalDocs = Math.max(allDocsSnapshot.docs.length, 1);
      let processedDocs = 0;
      let hiddenCount = 0;

      for (const question of searchResults.existing) {
        if (!question.id) continue;
        await updateDoc(doc(db, TARGET_COLLECTION, question.id), { isHidden: false });
        processedDocs += 1;
        setCompletionProgress(Math.round((processedDocs / totalDocs) * 100));
      }

      for (const docSnapshot of allDocsSnapshot.docs) {
        if (foundDocIds.has(docSnapshot.id)) continue;
        await updateDoc(doc(db, TARGET_COLLECTION, docSnapshot.id), { isHidden: true });
        hiddenCount += 1;
        processedDocs += 1;
        setCompletionProgress(Math.round((processedDocs / totalDocs) * 100));
      }

      setCompletionProgress(100);
      appendMessage(`Complete: ${searchResults.existing.length} đoạn hiển thị (isHidden=false), ${hiddenCount} đoạn đã ẩn (isHidden=true).`, "success");
    } catch (error) {
      appendMessage(`Lỗi khi complete: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
      setIsCompleting(false);
      setTimeout(() => setCompletionProgress(0), 1800);
    }
  };

  const totalSearched = searchResults.existing.length + searchResults.missing.length;

  return (
    <AppShellBackground>
      <Head>
        <title>Add Read Aloud Samples</title>
      </Head>

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 pb-10 pt-24 sm:gap-6 sm:px-6 lg:pt-28">
        <Card strong className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[24px] font-bold leading-tight text-white sm:text-[30px]">Add Read Aloud Samples</h1>
              <p className="mt-2 text-sm text-white/70 sm:text-base">Giao diện đồng bộ với Add Repeat Sentence, dùng cho bộ đoạn Read Aloud.</p>
              <p className="mt-1 text-xs text-white/55 sm:text-[13px]">Collection hiện tại: <span className="font-semibold text-[#ffac7b]">{TARGET_COLLECTION}</span></p>
            </div>
          </div>

          <TaskAdminTabs activeKey="ra-add" />

        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-white sm:text-lg">Bước 1: Dán nội dung để trích xuất mã RA</h2>
          <Input multiline value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Ví dụ: #1201 RA, #1201 Read Aloud hoặc format 3 dòng như #1201 Title / #1201ShadowEasy / Undone" rows={6} />
          <div>
            <Button onClick={extractTextFromBulk} disabled={!bulkText.trim()} className="w-full sm:w-auto">Extract RA Numbers</Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-white sm:text-lg">Bước 2: Tìm kiếm trong database</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input value={searchNumbers} onChange={(e) => setSearchNumbers(e.target.value)} placeholder="Nhập số cách nhau bởi dấu phẩy, ví dụ: 1201, 1202, 1203" />
            <Button onClick={handleSearch} disabled={isSearching || !searchNumbers.trim()} className="w-full sm:w-auto">{isSearching ? "Searching..." : "Search"}</Button>
          </div>

          {totalSearched > 0 && (
            <div className="glass rounded-card grid gap-3 p-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center"><p className="text-xs uppercase tracking-wide text-white/55">Total</p><p className="mt-1 text-2xl font-bold text-[#ffac7b]">{totalSearched}</p></div>
              <div className="rounded-2xl border border-white/10 bg-emerald-400/10 p-3 text-center"><p className="text-xs uppercase tracking-wide text-white/55">Found</p><p className="mt-1 text-2xl font-bold text-emerald-300">{searchResults.existing.length}</p></div>
              <div className="rounded-2xl border border-white/10 bg-rose-400/10 p-3 text-center"><p className="text-xs uppercase tracking-wide text-white/55">Missing</p><p className="mt-1 text-2xl font-bold text-rose-300">{searchResults.missing.length}</p></div>
            </div>
          )}

          {searchResults.missing.length > 0 && (
            <div className="space-y-4 rounded-card border border-rose-400/30 bg-rose-500/10 p-4">
              <div>
                <p className="text-sm font-semibold text-rose-200">Danh sách mã còn thiếu</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {searchResults.missing.map((num) => <span key={num} className="rounded-full border border-rose-300/30 bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-100">#{num} RA</span>)}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-100">Thêm đoạn còn thiếu</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Chọn mã RA</label>
                    <select value={selectedMissing} onChange={(e) => setSelectedMissing(e.target.value)} className="ui-input accent-ring">
                      <option value="">Chọn mã cần thêm</option>
                      {searchResults.missing.map((num) => <option key={num} value={num}>#{num} RA</option>)}
                    </select>
                  </div>

                  {selectedMissing && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs text-white/70">Nội dung đoạn cho #{selectedMissing} RA</label>
                        <Input multiline value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Nhập nội dung đoạn Read Aloud..." rows={5} />
                      </div>
                      <Button onClick={handleAddMissing} disabled={isAdding || !newContent.trim()} className="w-full sm:w-auto">{isAdding ? "Adding..." : "Add Passage"}</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {searchResults.existing.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white/85">Đoạn đã có trong database ({searchResults.existing.length})</p>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {searchResults.existing.map((question, index) => (
                  <article key={`${question.id ?? question.ID ?? index}-${index}`} className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-3">
                    <p className="whitespace-pre-wrap break-words text-sm text-white/90 sm:text-base">{question.text}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-white/65">
                      <span>ID: {question.ID ?? "N/A"}</span>
                      <span>Occurrence: {question.occurrence ?? 0}</span>
                      {question.isHidden && <span className="text-amber-300">Hidden</span>}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {searchResults.existing.length > 0 && searchResults.missing.length === 0 && (
            <div className="space-y-3 rounded-2xl border border-[#fc5d01]/35 bg-[#fc5d01]/10 p-4">
              <Button onClick={handleComplete} disabled={isCompleting} className="w-full">{isCompleting ? `Completing... ${completionProgress}%` : "Complete & Update isHidden"}</Button>
              {isCompleting && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-white/70"><span>Progress</span><span>{completionProgress}%</span></div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] transition-all duration-300" style={{ width: `${completionProgress}%` }} /></div>
                </div>
              )}
            </div>
          )}
        </Card>

        {messages.length > 0 && (
          <Card className="space-y-2">
            <p className="text-sm font-semibold text-white/85">Log</p>
            <ul className="space-y-1 text-sm">
              {messages.map((message, index) => <li key={`${message.type}-${index}`} className={messageTone[message.type]}>• {message.text}</li>)}
            </ul>
          </Card>
        )}
      </main>
    </AppShellBackground>
  );
};

export default AddReadAloud;