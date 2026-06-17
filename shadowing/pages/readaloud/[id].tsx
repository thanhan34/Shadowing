import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "../../firebase";
import AppShellBackground from "../../components/ui/AppShellBackground";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import {
  HighlightedReadAloudText,
  HighlightToggle,
  useReadAloudHighlightRules,
} from "../../components/readaloud/ReadAloudHighlightTools";

interface ReadAloudItem {
  id: string;
  ID?: string;
  text: string;
  occurrence?: number;
  createdAt?: Timestamp;
  isHidden?: boolean;
  questionType?: string;
  vietnameseTranslation?: string;
}

type ChunkingFilter = "with" | "without";

const TARGET_COLLECTION = "readaloud";

const hasChunking = (text: string) => text.includes("/");

const extractIdNumber = (id?: string) => {
  if (!id) return Number.MAX_SAFE_INTEGER;
  const match = id.match(/#(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const sortReadAloud = (a: ReadAloudItem, b: ReadAloudItem) => {
  const aNumber = extractIdNumber(a.ID);
  const bNumber = extractIdNumber(b.ID);

  if (aNumber !== bNumber) {
    return aNumber - bNumber;
  }

  const aKey = a.ID ?? a.text ?? "";
  const bKey = b.ID ?? b.text ?? "";
  return aKey.localeCompare(bKey);
};

const getStringQuery = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
};

const ReadAloudDetailPage: React.FC = () => {
  const router = useRouter();
  const [items, setItems] = useState<ReadAloudItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const {
    rules: highlightRules,
    setRules: setHighlightRules,
    isHighlightEnabled,
    setIsHighlightEnabled,
  } = useReadAloudHighlightRules();

  const currentId = getStringQuery(router.query.id);
  const chunkingQuery = getStringQuery(router.query.chunking);
  const chunkingFilter: ChunkingFilter = chunkingQuery === "without" ? "without" : "with";
  const searchText = getStringQuery(router.query.search);

  const fetchReadAloud = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const readAloudRef = collection(db, TARGET_COLLECTION);
      const q = query(readAloudRef, where("isHidden", "==", false));
      const querySnapshot = await getDocs(q);

      const fetchedData = querySnapshot.docs
        .map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<ReadAloudItem, "id">),
        }))
        .sort(sortReadAloud);

      setItems(fetchedData);
    } catch (error) {
      setErrorMessage(
        `Lỗi khi tải Read Aloud: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReadAloud();
  }, [fetchReadAloud]);

  const filteredItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return items.filter((item) => {
      const matchesChunking =
        chunkingFilter === "with" ? hasChunking(item.text) : !hasChunking(item.text);

      if (!matchesChunking) return false;
      if (!keyword) return true;

      return (
        item.text.toLowerCase().includes(keyword) ||
        (item.ID ?? "").toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword) ||
        (item.vietnameseTranslation ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [items, searchText, chunkingFilter]);

  const currentIndex = filteredItems.findIndex((item) => item.id === currentId);
  const currentItem = currentIndex >= 0 ? filteredItems[currentIndex] : null;
  const previousItem = currentIndex > 0 ? filteredItems[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < filteredItems.length - 1
      ? filteredItems[currentIndex + 1]
      : null;

  const goToItem = (item: ReadAloudItem | null) => {
    if (!item) return;

    void router.push({
      pathname: "/readaloud/[id]",
      query: {
        id: item.id,
        chunking: chunkingFilter,
        ...(searchText.trim() ? { search: searchText.trim() } : {}),
      },
    });
  };

  const backToList = () => {
    void router.push({
      pathname: "/readaloud",
      query: {
        chunking: chunkingFilter,
        ...(searchText.trim() ? { search: searchText.trim() } : {}),
      },
    });
  };

  return (
    <AppShellBackground>
      <Head>
        <title>{currentItem?.ID ? `${currentItem.ID} - Read Aloud` : "Read Aloud Detail"}</title>
      </Head>

      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 pb-10 pt-24 sm:gap-6 sm:px-6 lg:pt-28">
        <Card strong className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffac7b]">
                Read Aloud Detail
              </p>
              <h1 className="mt-2 text-[24px] font-bold leading-tight text-white sm:text-[32px]">
                {currentItem?.ID ?? "Chi tiết đoạn"}
              </h1>
              <p className="mt-2 text-sm text-white/65">
                {filteredItems.length > 0 && currentIndex >= 0
                  ? `Đoạn ${currentIndex + 1}/${filteredItems.length}`
                  : "Đang tải dữ liệu đoạn..."}
              </p>
            </div>

            <Button variant="secondary" onClick={backToList} className="w-full sm:w-auto">
              Quay lại danh sách
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <HighlightToggle
            enabled={isHighlightEnabled}
            onEnabledChange={setIsHighlightEnabled}
          />
        </Card>

        <Card className="space-y-5">
          {isLoading ? (
            <p className="text-sm text-white/70">Loading read aloud detail...</p>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3">
              <p className="text-sm text-rose-200">{errorMessage}</p>
            </div>
          ) : !currentItem ? (
            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-10 text-center">
              <p className="text-white/85">Không tìm thấy đoạn Read Aloud này trong bộ lọc hiện tại.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {currentItem.ID && (
                  <span className="rounded-full border border-[#fc5d01]/45 bg-[#fc5d01]/20 px-3 py-1 text-xs font-semibold text-[#ffcfad]">
                    {currentItem.ID}
                  </span>
                )}

                <span className="rounded-full border border-emerald-300/35 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Visible
                </span>

                {currentItem.questionType && (
                  <span className="rounded-full border border-violet-300/30 bg-violet-400/15 px-3 py-1 text-xs font-semibold text-violet-200">
                    {currentItem.questionType}
                  </span>
                )}
              </div>

              <section className="rounded-[22px] border border-[#fc5d01]/35 bg-[#fc5d01]/10 p-4 shadow-[0_18px_44px_-28px_rgba(252,93,1,0.85)] sm:p-6">
                <p className="whitespace-pre-wrap break-words text-[24px] font-medium leading-relaxed text-white sm:text-[34px] sm:leading-relaxed">
                  {isHighlightEnabled ? (
                    <HighlightedReadAloudText text={currentItem.text} rules={highlightRules} />
                  ) : (
                    currentItem.text
                  )}
                </p>
              </section>

              {currentItem.vietnameseTranslation && (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-white/80 sm:text-base">
                  <span className="font-semibold text-white/90">VN:</span> {currentItem.vietnameseTranslation}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  onClick={() => goToItem(previousItem)}
                  disabled={!previousItem}
                  className="w-full"
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => goToItem(nextItem)}
                  disabled={!nextItem}
                  className="w-full"
                >
                  Next →
                </Button>
              </div>
            </>
          )}
        </Card>
      </main>
    </AppShellBackground>
  );
};

export default ReadAloudDetailPage;