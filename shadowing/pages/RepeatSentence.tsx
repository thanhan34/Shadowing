import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import AppShellBackground from "../components/ui/AppShellBackground";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Tabs from "../components/ui/Tabs";

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

const RepeatSentence: React.FC = () => {
  const [repeatSentences, setRepeatSentences] = useState<RepeatSentenceItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [chunkingFilter, setChunkingFilter] = useState<ChunkingFilter>("with");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchRepeatSentences = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const repeatsentenceRef = collection(db, TARGET_COLLECTION);
      const q = query(repeatsentenceRef, where("isHidden", "==", false));
      const querySnapshot = await getDocs(q);

      const fetchedData = querySnapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data() as Omit<RepeatSentenceItem, "id">;
          return {
            id: docSnapshot.id,
            ...data,
          };
        })
        .sort(sortRepeatSentences);

      setRepeatSentences(fetchedData);
    } catch (error) {
      setErrorMessage(
        `Lỗi khi tải Repeat Sentence: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRepeatSentences();
  }, [fetchRepeatSentences]);

  const filteredRepeatSentences = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return repeatSentences.filter((item) => {
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
  }, [repeatSentences, searchText, chunkingFilter]);

  const stats = useMemo(() => {
    const withChunking = repeatSentences.filter((item) => hasChunking(item.text)).length;
    const withoutChunking = Math.max(repeatSentences.length - withChunking, 0);

    return {
      total: repeatSentences.length,
      withChunking,
      withoutChunking,
      filtered: filteredRepeatSentences.length,
    };
  }, [repeatSentences, filteredRepeatSentences.length]);

  return (
    <AppShellBackground>
      <Head>
        <title>Repeat Sentence</title>
      </Head>

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 pb-10 pt-24 sm:gap-6 sm:px-6 lg:pt-28">
        <Card strong className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[24px] font-bold leading-tight text-white sm:text-[30px]">
                Repeat Sentence
              </h1>
              <p className="mt-2 text-sm text-white/70 sm:text-base">
                Danh sách toàn bộ câu <span className="font-semibold text-[#ffac7b]">Repeat Sentence.</span>
              </p>
              
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-white sm:text-lg">Bộ lọc danh sách Repeat Sentence</h2>

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
              placeholder="Tìm theo nội dung câu, ID hoặc document id..."
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
            <h2 className="text-base font-semibold text-white sm:text-lg">
              Danh sách câu ({filteredRepeatSentences.length})
            </h2>
          </div>

          {isLoading ? (
            <p className="text-sm text-white/70">Loading repeat sentence...</p>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3">
              <p className="text-sm text-rose-200">{errorMessage}</p>
            </div>
          ) : filteredRepeatSentences.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-10 text-center">
              <p className="text-white/85">Không có câu Repeat Sentence nào phù hợp.</p>
            </div>
          ) : (
            <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {filteredRepeatSentences.map((sentence, index) => (
                <article
                  key={sentence.id}
                  className="glass-hover rounded-2xl border border-white/15 bg-white/[0.08] p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">                   

                    <div className="flex flex-wrap gap-2">
                      {sentence.ID && (
                        <span className="rounded-full border border-[#fc5d01]/35 bg-[#fc5d01]/15 px-3 py-1 text-xs font-semibold text-[#ffcfad]">
                          {sentence.ID}
                        </span>
                      )}

                      <span className="rounded-full border border-emerald-300/35 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                        Visible
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-white/90 sm:text-base whitespace-pre-wrap break-words">
                    {renderChunkedText(sentence.text)}
                  </p>

                  

                  {sentence.vietnameseTranslation && (
                    <p className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75">
                      VN: {sentence.vietnameseTranslation}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </Card>
      </main>
    </AppShellBackground>
  );
};

export default RepeatSentence;
