import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { BookOpen, Search, RefreshCw, Sliders, ArrowRight } from "react-feather";
import { useRouter } from "next/router";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "../firebase";
import AppShellBackground from "../components/ui/AppShellBackground";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Tabs from "../components/ui/Tabs";
import {
  HighlightedReadAloudText,
  HighlightToggle,
  useReadAloudHighlightRules,
} from "../components/readaloud/ReadAloudHighlightTools";

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

const TARGET_COLLECTION = "readaloud";
type ChunkingFilter = "with" | "without";

const hasChunking = (text: string) => text.includes("/");

const getStringQuery = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
};

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

const ReadAloudPage: React.FC = () => {
  const router = useRouter();
  const [items, setItems] = useState<ReadAloudItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [chunkingFilter, setChunkingFilter] = useState<ChunkingFilter>("with");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [largeText, setLargeText] = useState(false);
  const {
    rules: highlightRules,
    isHighlightEnabled,
    setIsHighlightEnabled,
  } = useReadAloudHighlightRules();

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

  useEffect(() => {
    if (!router.isReady) return;

    const chunkingQuery = getStringQuery(router.query.chunking);
    const searchQuery = getStringQuery(router.query.search);

    if (chunkingQuery === "with" || chunkingQuery === "without") {
      setChunkingFilter(chunkingQuery);
    }

    if (searchQuery) {
      setSearchText(searchQuery);
    }
  }, [router.isReady, router.query.chunking, router.query.search]);

  const filteredItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return items.filter((item) => {
      const matchesChunking =
        chunkingFilter === "with" ? hasChunking(item.text) : !hasChunking(item.text);

      if (!matchesChunking) {
        return false;
      }

      if (!keyword) return true;

      return (
        item.text.toLowerCase().includes(keyword) ||
        (item.ID ?? "").toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword) ||
        (item.vietnameseTranslation ?? "").toLowerCase().includes(keyword)
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

  return (
    <AppShellBackground className="rs-page ra-page">
      <Head><title>Read Aloud | Thư viện luyện đọc</title></Head>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-12 pt-24 sm:px-6 lg:pt-28">
        <Card strong className="rs-hero">
          <div className="min-w-0">
            <p className="rs-eyebrow"><BookOpen size={16} aria-hidden="true" /> PTE / READING STUDIO</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Read <span className="rs-accent">Aloud.</span></h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-white/80">Đọc rõ từng âm. Kết nối từng ý.<br />Chọn một đoạn văn và bắt đầu luyện đọc theo nhịp của bạn.</p>
          </div>
          <div className="rs-hero-note">
            <span className="rs-eyebrow">TẬP TRUNG VÀO CÁCH ĐỌC</span>
            <div className="my-4 flex flex-wrap items-center gap-3 text-sm font-semibold"><span>Đọc hiểu</span><ArrowRight size={16} aria-hidden="true" /><span>Chia cụm</span><ArrowRight size={16} aria-hidden="true" /><span>Đọc thành tiếng</span></div>
            <p className="text-sm leading-6 text-white/80">Dùng dấu <span className="rs-accent font-bold">/</span> để nhận biết cụm ý. Mở bài luyện để xem nội dung chi tiết và thực hành.</p>
          </div>
        </Card>
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Chọn bài luyện đọc</h2><span className="rs-badge">{isLoading ? 'Đang tải thư viện…' : errorMessage ? 'Chưa tải được thư viện' : stats.total + ' đoạn trong thư viện'}</span></div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1"><label htmlFor="ra-search" className="mb-2 block text-sm font-medium text-white/80">Tìm đoạn văn</label><div className="relative"><Search className="rs-search-icon" size={18} aria-hidden="true" /><Input id="ra-search" type="search" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Tìm nội dung, mã bài hoặc bản dịch…" className="rs-search" /></div></div>
            <Button variant="secondary" disabled={isLoading} onClick={() => void fetchReadAloud()} className="rs-refresh"><RefreshCw size={16} aria-hidden="true" />{isLoading ? 'Đang tải…' : 'Tải lại'}</Button>
          </div>
          <Tabs items={[{ key: 'with', label: 'Có chia cụm' }, { key: 'without', label: 'Không chia cụm' }]} activeKey={chunkingFilter} onChange={key => setChunkingFilter(key as ChunkingFilter)} />
          <details className="rs-settings">
            <summary><span className="flex flex-wrap items-center gap-2"><Sliders size={16} aria-hidden="true" />Cài đặt hiển thị <span className="text-xs">· Tô màu âm: {isHighlightEnabled ? 'Bật' : 'Tắt'}</span></span><span className="rs-chevron" aria-hidden="true">⌄</span></summary>
            <div className="space-y-3 border-t border-white/15 p-4">
              <HighlightToggle enabled={isHighlightEnabled} onEnabledChange={setIsHighlightEnabled} />
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={largeText} onChange={e => setLargeText(e.target.checked)} className="h-5 w-5 accent-[#fc5d01]" />Chữ lớn để luyện đọc</label>
              <p className="text-sm leading-6 text-white/80">{stats.withChunking} đoạn có chia cụm · {stats.withoutChunking} đoạn không chia cụm. Bản dịch có thể mở riêng ở từng bài.</p>
            </div>
          </details>
        </Card>
        <section aria-labelledby="ra-results-heading" aria-busy={isLoading}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1"><h2 id="ra-results-heading" className="text-lg font-semibold">Thư viện đoạn đọc <span className="ml-2 text-sm font-normal text-white/80">/ {chunkingFilter === 'with' ? 'Có chia cụm' : 'Không chia cụm'}</span></h2><p role="status" className="text-sm text-white/80">{isLoading ? 'Đang tải…' : errorMessage ? 'Tải dữ liệu thất bại' : stats.filtered + ' kết quả'}</p></div>
          {isLoading ? (
            <div className="space-y-4"><span className="sr-only">Đang tải đoạn Read Aloud</span>{[0, 1, 2].map(i => <Card key={i} className="rs-skeleton" aria-hidden="true"><div className="h-5 w-24 rounded bg-white/10" /><div className="mt-6 h-5 w-full rounded bg-white/10" /><div className="mt-3 h-5 w-2/3 rounded bg-white/10" /></Card>)}</div>
          ) : errorMessage ? (
            <Card><div role="alert"><h3 className="text-lg font-semibold">Chưa thể tải thư viện</h3><p className="mt-2 break-words text-sm leading-6 text-white/80">{errorMessage}</p></div><Button className="mt-4" onClick={() => void fetchReadAloud()}>Thử lại</Button></Card>
          ) : filteredItems.length === 0 ? (
            <Card className="py-10 text-center"><Search size={28} className="mx-auto mb-4 rs-accent" aria-hidden="true" /><h3 className="text-lg font-semibold">Chưa tìm thấy đoạn phù hợp</h3><p className="mt-2 text-sm leading-6 text-white/80">Thử từ khóa khác hoặc chuyển nhóm chia cụm.</p>{searchText && <Button variant="secondary" className="mt-4" onClick={() => setSearchText('')}>Xóa tìm kiếm</Button>}</Card>
          ) : (
            <div className="space-y-4">{filteredItems.map((item, index) => (
              <article key={item.id} className="rs-sentence">
                <div className="rs-sentence-meta"><span className="rs-sentence-number">{String(index + 1).padStart(2, '0')}</span><span className="rs-badge">{item.ID || 'Read Aloud'}</span>{item.questionType && <span className="rs-badge">{item.questionType}</span>}<span className="ml-auto text-xs text-white/80">{item.text.replace(/\//g, ' ').trim().split(/\s+/).filter(Boolean).length} từ</span></div>
                <p className={largeText ? 'rs-sentence-text rs-text-large' : 'rs-sentence-text'} lang="en">{isHighlightEnabled ? <HighlightedReadAloudText text={item.text} rules={highlightRules} /> : item.text}</p>
                {item.vietnameseTranslation && <details className="rs-translation"><summary>Nghĩa tiếng Việt <span className="rs-chevron" aria-hidden="true">⌄</span></summary><p lang="vi" className="pb-4 text-base leading-7 text-white/80">{item.vietnameseTranslation}</p></details>}
                <div className="ra-card-footer"><span className="text-xs text-white/80">{hasChunking(item.text) ? 'Luyện đọc theo cụm ý' : 'Luyện đọc liền mạch'}</span><Link className="ui-button-primary accent-ring ra-open-lesson" href={{ pathname: '/readaloud/[id]', query: { id: item.id, chunking: chunkingFilter, ...(searchText.trim() ? { search: searchText.trim() } : {}) } }} aria-label={'Mở bài luyện ' + (item.ID || item.id)}>Mở bài luyện<ArrowRight size={16} aria-hidden="true" /></Link></div>
              </article>
            ))}</div>
          )}
        </section>
      </main>
    </AppShellBackground>
  );
};

export default ReadAloudPage;
