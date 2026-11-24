import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import * as XLSX from "xlsx";
import { db, storage } from "../firebase";
import {
  RS_AUDIO_VOICES,
  buildMissingRepeatSentenceAudioRows,
  RepeatSentenceUploadResult,
  uploadRepeatSentenceAudioFiles,
} from "../lib/repeatSentenceAudio";
import AppShellBackground from "../components/ui/AppShellBackground";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Tabs from "../components/ui/Tabs";
import TaskAdminTabs from "../components/ui/TaskAdminTabs";
import RepeatSentenceResourceEditor from "../components/RepeatSentenceResourceEditor";
import RepeatSentenceTranslationImport from "../components/RepeatSentenceTranslationImport";

type MessageType = "success" | "error" | "info";

interface AppMessage {
  type: MessageType;
  text: string;
}

interface RepeatSentenceItem {
  id: string;
  audio?: Record<string, string>;
  practiceUrl?: string;
  ID?: string;
  text: string;
  occurrence?: number;
  createdAt?: Timestamp;
  isHidden?: boolean;
  questionType?: string;
  vietnameseTranslation?: string;
  displayOrder?: number;
}

const TARGET_COLLECTION = "repeatsentence";
type ChunkingFilter = "with" | "without";

const hasChunking = (text: string) => text.includes("/");

const extractIdNumber = (id?: string) => {
  if (!id) return Number.MAX_SAFE_INTEGER;
  const match = id.match(/#(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const sortRepeatSentences = (a: RepeatSentenceItem, b: RepeatSentenceItem) => {
  const aDisplayOrder =
    typeof a.displayOrder === "number" ? a.displayOrder : Number.MAX_SAFE_INTEGER;
  const bDisplayOrder =
    typeof b.displayOrder === "number" ? b.displayOrder : Number.MAX_SAFE_INTEGER;

  if (aDisplayOrder !== bDisplayOrder) {
    return aDisplayOrder - bDisplayOrder;
  }

  const aNumber = extractIdNumber(a.ID);
  const bNumber = extractIdNumber(b.ID);

  if (aNumber !== bNumber) {
    return aNumber - bNumber;
  }

  const aKey = a.ID ?? a.text ?? "";
  const bKey = b.ID ?? b.text ?? "";
  return aKey.localeCompare(bKey);
};

const renderChunkedText = (text: string) =>
  text.split(/(\/)/g).map((segment, index) => {
    if (segment === "/") {
      return (
        <span key={`slash-${index}`} className="font-semibold text-[#fc5d01]">
          /
        </span>
      );
    }

    return <span key={`text-${index}`}>{segment}</span>;
  });

const EditRepeatSentenceList: React.FC = () => {
  const router = useRouter();

  const [items, setItems] = useState<RepeatSentenceItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [searchText, setSearchText] = useState("");
  const [chunkingFilter, setChunkingFilter] = useState<ChunkingFilter>("with");
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<AppMessage | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<RepeatSentenceUploadResult[]>([]);
  const uploadLock = useRef(false);
  const [resourceSavingId, setResourceSavingId] = useState<string | null>(null);

  const appendMessage = (text: string, type: MessageType = "info") => {
    setMessage({ text, type });
  };

  const messageTone = useMemo(
    () => ({
      success: "text-emerald-300",
      info: "text-sky-300",
      error: "text-rose-300",
    }),
    []
  );

  const fetchRepeatSentences = useCallback(async () => {
    setIsLoading(true);

    try {
      const repeatsentenceRef = collection(db, TARGET_COLLECTION);
      const q = query(repeatsentenceRef, where("isHidden", "==", false));
      const querySnapshot = await getDocs(q);

      const fetchedItems = querySnapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data() as Omit<RepeatSentenceItem, "id">;
          return {
            ...data,
            id: docSnapshot.id,
          };
        })
        .sort(sortRepeatSentences);

      setItems(fetchedItems);
      setDrafts(
        fetchedItems.reduce<Record<string, string>>((acc, item) => {
          acc[item.id] = item.text ?? "";
          return acc;
        }, {})
      );
    } catch (error) {
      appendMessage(
        `Lỗi khi tải Repeat Sentence: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRepeatSentences();
  }, [fetchRepeatSentences]);

  const filteredItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return items.filter((item) => {
      const matchesChunking =
        chunkingFilter === "with" ? hasChunking(item.text) : !hasChunking(item.text);

      if (!matchesChunking) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        item.text.toLowerCase().includes(keyword) ||
        (item.ID ?? "").toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword)
      );
    });
  }, [items, searchText, chunkingFilter]);

  const stats = useMemo(() => {
    const withChunking = items.filter((item) => hasChunking(item.text)).length;
    return {
      total: items.length,
      withChunking,
      withoutChunking: Math.max(items.length - withChunking, 0),
      filtered: filteredItems.length,
    };
  }, [items, filteredItems.length]);

  const updateDraft = (id: string, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSave = async (item: RepeatSentenceItem) => {
    const newText = (drafts[item.id] ?? "").trim();

    if (!newText) {
      appendMessage("Nội dung câu không được để trống.", "error");
      return;
    }

    if (newText === item.text) {
      appendMessage("Không có thay đổi để lưu.", "info");
      return;
    }

    setSavingId(item.id);
    try {
      await updateDoc(doc(db, TARGET_COLLECTION, item.id), {
        text: newText,
      });

      setItems((prev) =>
        prev.map((current) =>
          current.id === item.id
            ? {
                ...current,
                text: newText,
              }
            : current
        )
      );

      appendMessage(`Đã lưu thành công ${item.ID ?? item.id}.`, "success");
    } catch (error) {
      appendMessage(
        `Lỗi khi lưu: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setSavingId(null);
    }
  };

  const missingAudioRows = useMemo(() => buildMissingRepeatSentenceAudioRows(items), [items]);

  const exportMissingAudioToExcel = () => {
    if (!missingAudioRows.length) {
      appendMessage("Không có câu RS nào thiếu audio Ryan.", "info");
      return;
    }
    try {
      const worksheet = XLSX.utils.json_to_sheet(missingAudioRows);
      worksheet["!cols"] = [{ wch: 15 }, { wch: 28 }, { wch: 80 }, { wch: 60 }, { wch: 18 }, { wch: 12 }, { wch: 10 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Missing Ryan Audio");
      const date = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `repeat_sentences_missing_ryan_audio_${date}.xlsx`);
      appendMessage(`Đã export ${missingAudioRows.length} câu thiếu audio Ryan.`, "success");
    } catch (error) {
      appendMessage(`Không thể export Excel: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    }
  };

  const handleBulkFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || uploadLock.current || isLoading || resourceSavingId) return;

    uploadLock.current = true;
    setIsBulkUploading(true);
    setBulkUploadProgress(0);
    setUploadResults([]);
    try {
      const results = await uploadRepeatSentenceAudioFiles(files, items, {
        readAudio: async (id) => {
          const snapshot = await getDoc(doc(db, TARGET_COLLECTION, id));
          if (!snapshot.exists() || snapshot.data().isHidden !== false) {
            throw new Error("Câu RS đã bị xóa hoặc ẩn. Hãy Refresh danh sách.");
          }
          return snapshot.data().audio ?? {};
        },
        upload: async (file, id, voice) => {
          const storageRef = ref(storage, `audio/repeatsentence/${id}/${voice}/${file.name}`);
          const snapshot = await uploadBytes(storageRef, file, {
            contentType: "audio/mpeg",
            cacheControl: "public, max-age=31536000",
          });
          return getDownloadURL(snapshot.ref);
        },
        save: async (id, voice, url) => {
          // Update only this voice, preserving other audio and any chunking edits.
          await updateDoc(doc(db, TARGET_COLLECTION, id), { [`audio.${voice}`]: url });
          setItems((previous) => previous.map((item) => item.id === id
            ? { ...item, audio: { ...item.audio, [voice]: url } }
            : item));
        },
        onResult: (result, processed) => {
          setUploadResults((previous) => [...previous, result]);
          setBulkUploadProgress(Math.round((processed / files.length) * 100));
        },
      });
      const successes = results.filter((result) => result.status === "success").length;
      const skipped = results.filter((result) => result.status === "skipped").length;
      const errors = results.filter((result) => result.status === "error").length;
      appendMessage(`Upload hoàn tất: ${successes} thành công, ${skipped} bỏ qua, ${errors} lỗi.`, errors ? "error" : "success");
    } catch (error) {
      appendMessage(`Lỗi bulk upload: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
      uploadLock.current = false;
      setIsBulkUploading(false);
    }
  };

  return (
    <AppShellBackground>
      <Head>
        <title>Edit Repeat Sentence List</title>
      </Head>

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 pb-10 pt-24 sm:gap-6 sm:px-6 lg:pt-28">
        <Card strong className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[24px] font-bold leading-tight text-white sm:text-[30px]">
                Edit Repeat Sentence List
              </h1>
              <p className="mt-2 text-sm text-white/70 sm:text-base">
                Chỉnh sửa nội dung Repeat Sentence, thêm dấu / để chunking và bulk upload MP3.
              </p>
              <p className="mt-1 text-xs text-white/55 sm:text-[13px]">
                Collection hiện tại: <span className="font-semibold text-[#ffac7b]">{TARGET_COLLECTION}</span>
              </p>
            </div>
          </div>

          <TaskAdminTabs activeKey="rs-edit" />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-white sm:text-lg">Chunking Editor</h2>

          <p className="rounded-2xl border border-[#fc5d01]/30 bg-[#fc5d01]/10 px-3 py-2 text-sm text-[#ffd6bc]">
            Gợi ý: thêm dấu <span className="font-bold text-[#fc5d01]">/</span> để chia cụm khi luyện nói.
          </p>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-white/60">Chunking Toggle</p>
            <Tabs
              items={[
                { key: "with", label: "With Chunking" },
                { key: "without", label: "Without Chunking" },
              ]}
              activeKey={chunkingFilter}
              onChange={(key) => setChunkingFilter(key as ChunkingFilter)}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm theo text, ID hoặc document id..."
            />
            <Button
              variant="secondary"
              onClick={() => {
                void fetchRepeatSentences();
              }}
              disabled={isLoading || isBulkUploading || !!resourceSavingId}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          <div className="glass rounded-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-white/55">Total Visible</p>
              <p className="mt-1 text-2xl font-bold text-[#ffac7b]">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#fc5d01]/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-white/55">With Chunking</p>
              <p className="mt-1 text-2xl font-bold text-[#ffd2b5]">{stats.withChunking}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-sky-400/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-white/55">Without Chunking</p>
              <p className="mt-1 text-2xl font-bold text-sky-200">{stats.withoutChunking}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-violet-400/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-white/55">After Filter</p>
              <p className="mt-1 text-2xl font-bold text-violet-200">{stats.filtered}</p>
            </div>
          </div>
        </Card>

        <RepeatSentenceTranslationImport items={items} loading={isLoading} onSaved={updates => setItems(prev => prev.map(item => updates.has(item.id) ? { ...item, vietnameseTranslation: updates.get(item.id) } : item))} />

        <Card className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-white sm:text-lg">Bulk Audio Upload — Ryan</h2>
            <Button
              onClick={exportMissingAudioToExcel}
              disabled={isLoading || isBulkUploading || missingAudioRows.length === 0}
              className="w-full sm:w-auto"
            >
              Export to Excel — Missing Ryan Audio ({missingAudioRows.length})
            </Button>
          </div>
          <p className="text-xs text-white/60">
            Export toàn bộ câu RS Visible chưa có audio Ryan, không phụ thuộc bộ lọc.
            Nội dung trong Excel được bỏ dấu / chunking để tạo audio.
          </p>
          <p id="rs-upload-help" className="text-sm text-white/70">
            Chọn nhiều file MP3. Tên file: <span className="font-semibold text-[#ffac7b]">number_Ryan_Text.mp3</span>
            {" "}(số thứ tự có thể bỏ qua). Chỉ hỗ trợ giọng Ryan.
            Ví dụ: 1_Ryan_We should always review before speaking.mp3.
          </p>
          <p className="text-xs text-white/60">
            Ghép theo nội dung đã lưu, bỏ qua dấu / chunking, dấu câu và chữ hoa/thường.
            Áp dụng cho toàn bộ câu RS Visible, không phụ thuộc bộ lọc bên trên.
            Chỉ bổ sung giọng còn thiếu; audio đã có được giữ nguyên. Câu trùng nội dung sẽ được bỏ qua.
          </p>
          <div className="space-y-2" role="status" aria-live="polite">
            <p className="text-sm text-white/70">
              {isBulkUploading ? "Đang upload..." : uploadResults.length ? "Đã xử lý xong" : "Sẵn sàng upload"}
              {` — ${bulkUploadProgress}%`}
            </p>
            <progress aria-label="Tiến độ bulk upload MP3" value={bulkUploadProgress} max={100} className="rs-upload-progress" />
          </div>
          <div>
            <label htmlFor="rs-bulk-audio" className="mb-2 block text-sm text-white/70">Chọn file MP3</label>
            <input
              id="rs-bulk-audio"
              type="file"
              accept=".mp3,audio/mpeg,audio/mp3"
              multiple
              onChange={handleBulkFileUpload}
              disabled={isLoading || isBulkUploading || !!resourceSavingId || items.length === 0}
              aria-describedby="rs-upload-help"
              className="rs-upload-input accent-ring"
            />
          </div>
          {uploadResults.length > 0 && (
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3">
              <h3 className="text-sm font-semibold text-white/85">Kết quả từng file ({uploadResults.length})</h3>
              {uploadResults.map((result, index) => (
                <p key={`${index}-${result.name}`} className="break-words text-xs text-white/70">
                  <span className={result.status === "success" ? "text-emerald-300" : result.status === "error" ? "text-rose-300" : "text-white/70"}>
                    {result.status === "success" ? "Thành công" : result.status === "error" ? "Lỗi" : "Bỏ qua"}
                  </span>{" "}— {result.name}: {result.message}
                </p>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white sm:text-lg">Danh sách câu ({filteredItems.length})</h2>
          </div>

          {isLoading ? (
            <p className="text-sm text-white/70">Loading repeat sentence...</p>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-10 text-center">
              <p className="text-white/85">Không có câu Repeat Sentence phù hợp.</p>
            </div>
          ) : (
            <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {filteredItems.map((item, index) => {
                const draftText = drafts[item.id] ?? "";

                return (
                  <article key={item.id} className="glass-hover rounded-2xl border border-white/15 bg-white/[0.08] p-4">
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs uppercase tracking-wide text-white/55">Sentence #{index + 1}</p>
                        <div className="flex flex-wrap gap-2">
                          {typeof item.displayOrder === "number" && (
                            <span className="rounded-full border border-violet-300/35 bg-violet-400/15 px-3 py-1 text-xs font-semibold text-violet-200">
                              Order {item.displayOrder + 1}
                            </span>
                          )}

                          {item.ID && (
                            <span className="rounded-full border border-[#fc5d01]/35 bg-[#fc5d01]/15 px-3 py-1 text-xs font-semibold text-[#ffd2b5]">
                              {item.ID}
                            </span>
                          )}
                          <span className="rounded-full border border-emerald-300/35 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                            Visible
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-white/70">Text (manual chunking bằng dấu /)</label>
                        <Input
                          multiline
                          value={draftText}
                          onChange={(e) => updateDraft(item.id, e.target.value)}
                          rows={3}
                          placeholder="Ví dụ: We should / always review / before speaking"
                        />
                      </div>

                      <div>
                        <p className="mb-1 text-xs text-white/60">Preview</p>
                        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 whitespace-pre-wrap break-words">
                          {renderChunkedText(draftText)}
                        </p>
                        {item.vietnameseTranslation && <p lang="vi" className="mt-2 text-sm text-textGlass-secondary">Nghĩa tiếng Việt: {item.vietnameseTranslation}</p>}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-white/65">
                        <span>Document ID: {item.id}</span>
                        <span>Occurrence: {item.occurrence ?? 0}</span>
                        <span>Slash count: {(draftText.match(/\//g) ?? []).length}</span>
                      </div>

                      <div className="flex flex-wrap gap-2" aria-label="Trạng thái audio">
                        {RS_AUDIO_VOICES.map((voice) => (
                          <span key={voice} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                            {voice}: {item.audio?.[voice]?.trim() ? "Đã có audio" : "Chưa có audio"}
                          </span>
                        ))}
                      </div>

                      <RepeatSentenceResourceEditor
                        key={`${item.id}-${item.audio?.Ryan ?? ""}-${item.practiceUrl ?? ""}`}
                        id={item.id}
                        audioUrl={item.audio?.Ryan ?? ""}
                        practiceUrl={item.practiceUrl ?? ""}
                        disabled={isBulkUploading || !!resourceSavingId || !!savingId}
                        onSavingChange={(saving) => setResourceSavingId(saving ? item.id : null)}
                        onSaved={(audioUrl, practiceUrl) => {
                          setItems((previous) => previous.map((current) => current.id === item.id
                            ? { ...current, audio: { ...current.audio, Ryan: audioUrl }, practiceUrl }
                            : current));
                          appendMessage(`Đã lưu audio Ryan và practice link cho ${item.ID ?? item.id}.`, "success");
                        }}
                      />

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          onClick={() => {
                            void handleSave(item);
                          }}
                          disabled={savingId === item.id}
                          className="w-full sm:w-auto"
                        >
                          {savingId === item.id ? "Saving..." : "Save"}
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() => updateDraft(item.id, item.text)}
                          disabled={savingId === item.id}
                          className="w-full sm:w-auto"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Card>

        {message && (
          <Card>
            <p className={`text-sm ${messageTone[message.type]}`}>• {message.text}</p>
          </Card>
        )}
      </main>
    </AppShellBackground>
  );
};

export default EditRepeatSentenceList;
