import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  Timestamp,
  updateDoc,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import AppShellBackground from "../components/ui/AppShellBackground";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Tabs from "../components/ui/Tabs";

type MessageType = "success" | "info" | "warning" | "error";

interface AppMessage {
  type: MessageType;
  text: string;
}

interface AudioSample {
  id?: string;
  audio: {
    Brian: string;
    Olivia: string;
    Joanna: string;
  };
  text: string;
  ID?: string;
  occurrence: number;
  createdAt?: Timestamp;
  isHidden?: boolean;
  vietnameseTranslation?: string;
  questionType?: string;
}

const TARGET_COLLECTION = "repeatsentence";
const TASK_SUFFIX = "RS";

const formatTaskId = (number: string) => `#${number} ${TASK_SUFFIX}`;

const normalizeTaskId = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/repeat\s*sentence/gi, TASK_SUFFIX)
    .toUpperCase();

const extractNumbersFromBulkText = (value: string) => {
  const strictMatches = Array.from(
    value.matchAll(/#(\d+)\s*(?:RS|Repeat\s*Sentence)/gi)
  );

  const flexibleMatches =
    strictMatches.length > 0 ? strictMatches : Array.from(value.matchAll(/#(\d+)/g));

  return Array.from(new Set(flexibleMatches.map((match) => match[1])));
};

const AddRepeatSentence: React.FC = () => {
  const router = useRouter();

  const [bulkText, setBulkText] = useState("");
  const [searchNumbers, setSearchNumbers] = useState("");
  const [searchResults, setSearchResults] = useState<{
    existing: AudioSample[];
    missing: string[];
  }>({ existing: [], missing: [] });
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMissing, setSelectedMissing] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [allDocsSnapshot, setAllDocsSnapshot] =
    useState<QuerySnapshot<DocumentData> | null>(null);

  const messageTone = useMemo(
    () => ({
      success: "text-emerald-300",
      info: "text-sky-300",
      warning: "text-amber-300",
      error: "text-rose-300",
    }),
    []
  );

  const appendMessage = (
    text: string,
    type: MessageType = "info"
  ) => {
    setMessages((prev) => [...prev, { text, type }].slice(-14));
  };

  useEffect(() => {
    setSelectedMissing((current) => {
      if (searchResults.missing.length === 0) return "";
      return searchResults.missing.includes(current)
        ? current
        : searchResults.missing[0];
    });
  }, [searchResults.missing]);

  const extractTextFromBulk = () => {
    if (!bulkText.trim()) {
      appendMessage("Vui lòng nhập nội dung để trích xuất mã Repeat Sentence.", "error");
      return;
    }

    const numbers = extractNumbersFromBulkText(bulkText);

    if (numbers.length === 0) {
      appendMessage(
        "Không tìm thấy mã hợp lệ. Dùng định dạng #number RS hoặc #number Repeat Sentence.",
        "error"
      );
      return;
    }

    setSearchNumbers(numbers.join(", "));
    setBulkText("");
    appendMessage(`Đã trích xuất ${numbers.length} mã Repeat Sentence.`, "success");
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchResults({ existing: [], missing: [] });

    try {
      const numberList = searchNumbers
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);

      if (numberList.length === 0) {
        appendMessage("Vui lòng nhập danh sách số hợp lệ để tìm kiếm.", "error");
        return;
      }

      const searchIds = numberList.map((num) => formatTaskId(num));
      const collectionRef = collection(db, TARGET_COLLECTION);
      const querySnapshot = await getDocs(collectionRef);

      const docsByID = new Map<string, AudioSample>();
      querySnapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data() as AudioSample;
        if (data.ID) {
          docsByID.set(normalizeTaskId(data.ID), {
            ...data,
            id: docSnapshot.id,
          });
        }
      });

      const existingQuestions: AudioSample[] = [];
      const foundIds = new Set<string>();

      searchIds.forEach((searchId) => {
        const normalizedId = normalizeTaskId(searchId);
        const found = docsByID.get(normalizedId);
        if (found) {
          existingQuestions.push(found);
          foundIds.add(normalizedId);
        }
      });

      const missingNumbers = searchIds
        .filter((id) => !foundIds.has(normalizeTaskId(id)))
        .map((id) => id.replace("#", "").replace(` ${TASK_SUFFIX}`, ""));

      setSearchResults({ existing: existingQuestions, missing: missingNumbers });
      setAllDocsSnapshot(querySnapshot);

      appendMessage(
        `Đã tìm xong: tìm thấy ${existingQuestions.length}, thiếu ${missingNumbers.length}.`,
        "success"
      );
    } catch (error) {
      appendMessage(
        `Lỗi khi tìm kiếm: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMissing = async () => {
    if (!selectedMissing || !newContent.trim()) {
      appendMessage("Vui lòng chọn mã còn thiếu và nhập nội dung câu.", "error");
      return;
    }

    setIsAdding(true);
    try {
      const questionData: AudioSample = {
        ID: formatTaskId(selectedMissing),
        text: newContent.trim(),
        audio: {
          Brian: "",
          Olivia: "",
          Joanna: "",
        },
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

      appendMessage(
        `Đã thêm thành công ${formatTaskId(selectedMissing)}: "${newContent.trim()}"`,
        "success"
      );
      setNewContent("");
    } catch (error) {
      appendMessage(
        `Lỗi khi thêm câu mới: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
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
        const ref = doc(db, TARGET_COLLECTION, question.id);
        await updateDoc(ref, { isHidden: false });
        processedDocs += 1;
        setCompletionProgress(Math.round((processedDocs / totalDocs) * 100));
      }

      for (const docSnapshot of allDocsSnapshot.docs) {
        if (foundDocIds.has(docSnapshot.id)) continue;
        const ref = doc(db, TARGET_COLLECTION, docSnapshot.id);
        await updateDoc(ref, { isHidden: true });
        hiddenCount += 1;
        processedDocs += 1;
        setCompletionProgress(Math.round((processedDocs / totalDocs) * 100));
      }

      setCompletionProgress(100);
      appendMessage(
        `Complete: ${searchResults.existing.length} câu hiển thị (isHidden=false), ${hiddenCount} câu đã ẩn (isHidden=true).`,
        "success"
      );
    } catch (error) {
      appendMessage(
        `Lỗi khi complete: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsCompleting(false);
      setTimeout(() => setCompletionProgress(0), 1800);
    }
  };

  const totalSearched = searchResults.existing.length + searchResults.missing.length;

  return (
    <AppShellBackground>
      <Head>
        <title>Add Repeat Sentence Samples</title>
      </Head>

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 pb-10 pt-24 sm:gap-6 sm:px-6 lg:pt-28">
        <Card strong className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[24px] font-bold leading-tight text-white sm:text-[30px]">
                Add Repeat Sentence Samples
              </h1>
              <p className="mt-2 text-sm text-white/70 sm:text-base">
                Tương tự AddAudioSample nhưng dùng cho bộ câu Repeat Sentence.
              </p>
              <p className="mt-1 text-xs text-white/55 sm:text-[13px]">
                Collection hiện tại: <span className="font-semibold text-[#ffac7b]">{TARGET_COLLECTION}</span>
              </p>
            </div>
          </div>

          <Tabs
            items={[
              { key: "wfd", label: "Write From Dictation" },
              { key: "rs", label: "Repeat Sentence" },
              { key: "rs-edit", label: "Edit RS List" },
              { key: "edit", label: "Edit Audio Sample" },
              { key: "list", label: "Audio Sample List" },
            ]}
            activeKey="rs"
            onChange={(key) => {
              if (key === "wfd") {
                router.push("/add-audio-sample");
                return;
              }
              if (key === "edit") {
                router.push("/EditAudioSamplePage");
                return;
              }
              if (key === "list") {
                router.push("/AudioSampleList");
                return;
              }
              if (key === "rs-list") {
                router.push("/RepeatSentence");
                return;
              }
              if (key === "rs-edit") {
                router.push("/EditRepeatSentenceList");
                return;
              }
              router.push("/AddRepeatSentence");
            }}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-white sm:text-lg">Bước 1: Dán nội dung để trích xuất mã RS</h2>
          <Input
            multiline
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Ví dụ: #2201 RS hoặc #2201 Repeat Sentence"
            rows={6}
          />
          <div>
            <Button
              onClick={extractTextFromBulk}
              disabled={!bulkText.trim()}
              className="w-full sm:w-auto"
            >
              Extract RS Numbers
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-white sm:text-lg">Bước 2: Tìm kiếm trong database</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={searchNumbers}
              onChange={(e) => setSearchNumbers(e.target.value)}
              placeholder="Nhập số cách nhau bởi dấu phẩy, ví dụ: 2201, 2202, 2203"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchNumbers.trim()}
              className="w-full sm:w-auto"
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {totalSearched > 0 && (
            <div className="glass rounded-card grid gap-3 p-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-xs uppercase tracking-wide text-white/55">Total</p>
                <p className="mt-1 text-2xl font-bold text-[#ffac7b]">{totalSearched}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-emerald-400/10 p-3 text-center">
                <p className="text-xs uppercase tracking-wide text-white/55">Found</p>
                <p className="mt-1 text-2xl font-bold text-emerald-300">{searchResults.existing.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-rose-400/10 p-3 text-center">
                <p className="text-xs uppercase tracking-wide text-white/55">Missing</p>
                <p className="mt-1 text-2xl font-bold text-rose-300">{searchResults.missing.length}</p>
              </div>
            </div>
          )}

          {searchResults.missing.length > 0 && (
            <div className="space-y-4 rounded-card border border-rose-400/30 bg-rose-500/10 p-4">
              <div>
                <p className="text-sm font-semibold text-rose-200">Danh sách mã còn thiếu</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {searchResults.missing.map((num) => (
                    <span
                      key={num}
                      className="rounded-full border border-rose-300/30 bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-100"
                    >
                      #{num} RS
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-100">Thêm câu còn thiếu</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Chọn mã RS</label>
                    <select
                      value={selectedMissing}
                      onChange={(e) => setSelectedMissing(e.target.value)}
                      className="ui-input accent-ring"
                    >
                      <option value="">Chọn mã cần thêm</option>
                      {searchResults.missing.map((num) => (
                        <option key={num} value={num}>
                          #{num} RS
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMissing && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs text-white/70">
                          Nội dung câu cho #{selectedMissing} RS
                        </label>
                        <Input
                          multiline
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          placeholder="Nhập nội dung câu Repeat Sentence..."
                          rows={3}
                        />
                      </div>
                      <Button
                        onClick={handleAddMissing}
                        disabled={isAdding || !newContent.trim()}
                        className="w-full sm:w-auto"
                      >
                        {isAdding ? "Adding..." : "Add Question"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {searchResults.existing.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white/85">
                Câu đã có trong database ({searchResults.existing.length})
              </p>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {searchResults.existing.map((question, index) => (
                  <article
                    key={`${question.id ?? question.ID ?? index}-${index}`}
                    className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-3"
                  >
                    <p className="text-sm text-white/90 sm:text-base">{question.text}</p>
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
              <Button onClick={handleComplete} disabled={isCompleting} className="w-full">
                {isCompleting
                  ? `Completing... ${completionProgress}%`
                  : "Complete & Update isHidden"}
              </Button>

              {isCompleting && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                    <span>Progress</span>
                    <span>{completionProgress}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] transition-all duration-300"
                      style={{ width: `${completionProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {messages.length > 0 && (
          <Card className="space-y-2">
            <p className="text-sm font-semibold text-white/85">Log</p>
            <ul className="space-y-1 text-sm">
              {messages.map((message, index) => (
                <li key={`${message.type}-${index}`} className={messageTone[message.type]}>
                  • {message.text}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </AppShellBackground>
  );
};

export default AddRepeatSentence;
