import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import AppShellBackground from "../components/ui/AppShellBackground";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Tabs from "../components/ui/Tabs";

type MessageType = "success" | "error" | "info";

interface AppMessage {
  type: MessageType;
  text: string;
}

interface RepeatSentenceItem {
  id: string;
  ID?: string;
  text: string;
  occurrence?: number;
  createdAt?: Timestamp;
  isHidden?: boolean;
  questionType?: string;
  vietnameseTranslation?: string;
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
            id: docSnapshot.id,
            ...data,
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
                Chỉnh sửa nội dung Repeat Sentence và thêm dấu / thủ công để chunking.
              </p>
              <p className="mt-1 text-xs text-white/55 sm:text-[13px]">
                Collection hiện tại: <span className="font-semibold text-[#ffac7b]">{TARGET_COLLECTION}</span>
              </p>
            </div>
          </div>

          <Tabs
            items={[
              { key: "wfd", label: "Write From Dictation" },
              { key: "rs", label: "Add Repeat Sentence" },
              { key: "rs-edit", label: "Edit RS List" },
              { key: "edit", label: "Edit Audio Sample" },
              { key: "list", label: "Audio Sample List" },
            ]}
            activeKey="rs-edit"
            onChange={(key) => {
              if (key === "wfd") {
                router.push("/AddAudioSample");
                return;
              }
              if (key === "rs") {
                router.push("/AddRepeatSentence");
                return;
              }
              if (key === "rs-list") {
                router.push("/RepeatSentence");
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
              router.push("/EditRepeatSentenceList");
            }}
          />
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
              disabled={isLoading}
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
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-white/65">
                        <span>Document ID: {item.id}</span>
                        <span>Occurrence: {item.occurrence ?? 0}</span>
                        <span>Slash count: {(draftText.match(/\//g) ?? []).length}</span>
                      </div>

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
