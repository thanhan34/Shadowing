import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import AppShellBackground from "../components/ui/AppShellBackground";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Tabs from "../components/ui/Tabs";
import { BookOpen, Search, RefreshCw, Sliders, ArrowRight } from "react-feather";

interface RepeatSentenceItem {
  id: string;
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

const RepeatSentence: React.FC = () => {
  const [repeatSentences, setRepeatSentences] = useState<RepeatSentenceItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [chunkingFilter, setChunkingFilter] = useState<ChunkingFilter>("with");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [largeText, setLargeText] = useState(false);

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
    <AppShellBackground className="rs-page rs-library">
      <Head><title>Repeat Sentence | Thư viện luyện tập</title></Head>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-12 pt-24 sm:px-6 lg:pt-28">
        <Card strong className="rs-hero">
          <div className="min-w-0">
            <p className="rs-eyebrow"><BookOpen size={16} aria-hidden="true" /> PTE / SPEAKING LIBRARY</p>
            <p className="rs-studio-label">YOUR DAILY SPEAKING STUDIO</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Repeat <span className="rs-accent">Sentence.</span></h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-white/80">Nhớ theo cụm. Nói trọn câu.<br />Một không gian gọn gàng để đọc, ghi nhớ và luyện nói mỗi ngày.</p>
            <a href="#rs-practice" className="rs-start-link accent-ring">Khám phá câu luyện tập <ArrowRight size={18} aria-hidden="true" /></a>
            <div className="rs-library-stats" aria-label="Thống kê thư viện">
              <div><strong>{isLoading || errorMessage ? '—' : stats.total}</strong><span>Tổng số câu</span></div>
              <div><strong>{isLoading || errorMessage ? '—' : stats.withChunking}</strong><span>Có chia cụm</span></div>
              <div><strong>{isLoading || errorMessage ? '—' : stats.withoutChunking}</strong><span>Không chia cụm</span></div>
            </div>
          </div>
          <div className="rs-hero-visual">
            <div className="rs-rhythm-art" aria-hidden="true"><span>FIND YOUR RHYTHM</span><div className="rs-rhythm-bars">{Array.from({ length: 24 }, (_, index) => <i key={index} />)}</div><p>Remember the meaning.<br /><strong>Repeat with confidence.</strong></p><div className="rs-demo-chunks"><span>Listen closely</span><b>/</b><span>remember the idea</span></div></div>
          <div className="rs-hero-note">
            <span className="rs-eyebrow">MỖI CÂU, MỘT BƯỚC TIẾN</span>
            <div className="my-4 flex items-center gap-3 text-sm font-semibold"><span>Đọc</span><ArrowRight size={16} aria-hidden="true" /><span>Ghi nhớ</span><ArrowRight size={16} aria-hidden="true" /><span>Nói lại</span></div>
            <p className="text-sm leading-6 text-white/80">Dấu <span className="rs-accent font-bold">/</span> chia câu thành các cụm ý để bạn luyện từng phần dễ hơn.</p>
          </div>
          </div>
        </Card>

        <div id="rs-practice" className="rs-practice-anchor">
        <Card className="space-y-4 rs-practice-tools">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="rs-eyebrow">CHỌN CÂU · LUYỆN THEO NHỊP CỦA BẠN</p><h2 className="mt-2 text-xl font-semibold">Góc luyện tập</h2></div>
            <span className="rs-badge">{isLoading ? 'Đang tải thư viện…' : errorMessage ? 'Chưa tải được thư viện' : stats.total + ' câu trong thư viện'}</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="rs-search" className="mb-2 block text-sm font-medium text-white/80">Tìm câu luyện tập</label>
              <div className="relative"><Search className="rs-search-icon" size={18} aria-hidden="true" /><Input id="rs-search" type="search" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Nhập nội dung hoặc mã câu…" className="rs-search" /></div>
            </div>
            <Button variant="secondary" disabled={isLoading} onClick={() => void fetchRepeatSentences()} className="rs-refresh"><RefreshCw size={16} aria-hidden="true" />{isLoading ? 'Đang tải…' : 'Tải lại'}</Button>
          </div>
          <div className="rs-filter-row"><Tabs items={[{ key: 'with', label: 'Có chia cụm' }, { key: 'without', label: 'Không chia cụm' }]} activeKey={chunkingFilter} onChange={key => setChunkingFilter(key as ChunkingFilter)} /><p>{chunkingFilter === 'with' ? 'Chia nhỏ ý để ghi nhớ dễ hơn.' : 'Luyện ghi nhớ câu liền mạch.'}</p></div>
          <details className="rs-settings">
            <summary><span className="flex items-center gap-2"><Sliders size={16} aria-hidden="true" />Cài đặt hiển thị</span><span className="rs-chevron" aria-hidden="true">⌄</span></summary>
            <div className="space-y-3 border-t border-white/15 p-4">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={largeText} onChange={e => setLargeText(e.target.checked)} className="h-5 w-5 accent-[#fc5d01]" />Chữ lớn để luyện đọc</label>
              <p className="text-sm leading-6 text-white/80">{stats.withChunking} câu có chia cụm · {stats.withoutChunking} câu không chia cụm. Mở “Nghĩa tiếng Việt” ở từng câu khi cần gợi ý.</p>
            </div>
          </details>
        </Card>
        </div>

        <section aria-labelledby="rs-results-heading" aria-busy={isLoading}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
            <h2 id="rs-results-heading" className="text-lg font-semibold">Danh sách câu <span className="ml-2 text-sm font-normal text-white/80">/ {chunkingFilter === 'with' ? 'Có chia cụm' : 'Không chia cụm'}</span></h2>
            <p role="status" className="text-sm text-white/80">{isLoading ? 'Đang tải…' : errorMessage ? 'Tải dữ liệu thất bại' : stats.filtered + ' kết quả'}</p>
          </div>
          {isLoading ? (
            <div className="space-y-4"><span className="sr-only">Đang tải câu Repeat Sentence</span>{[0, 1, 2].map(i => <Card key={i} className="rs-skeleton" aria-hidden="true"><div className="h-5 w-24 rounded bg-white/10" /><div className="mt-6 h-5 w-full rounded bg-white/10" /><div className="mt-3 h-5 w-2/3 rounded bg-white/10" /></Card>)}</div>
          ) : errorMessage ? (
            <Card><div role="alert"><h3 className="text-lg font-semibold">Chưa thể tải thư viện</h3><p className="mt-2 break-words text-sm leading-6 text-white/80">{errorMessage}</p></div><Button className="mt-4" onClick={() => void fetchRepeatSentences()}>Thử lại</Button></Card>
          ) : filteredRepeatSentences.length === 0 ? (
            <Card className="py-10 text-center"><Search size={28} className="mx-auto mb-4 rs-accent" aria-hidden="true" /><h3 className="text-lg font-semibold">Chưa tìm thấy câu phù hợp</h3><p className="mt-2 text-sm leading-6 text-white/80">Thử từ khóa khác hoặc chuyển nhóm chia cụm.</p>{searchText && <Button variant="secondary" className="mt-4" onClick={() => setSearchText('')}>Xóa tìm kiếm</Button>}</Card>
          ) : (
              <div className="space-y-4 rs-sentence-list">
              {filteredRepeatSentences.map((sentence, index) => (
                <article key={sentence.id} className="rs-sentence">
                  <div className="rs-sentence-meta"><span className="rs-sentence-number">{String(index + 1).padStart(2, '0')}</span><span className="rs-badge">{sentence.ID || 'Repeat Sentence'}</span><span className="ml-auto text-xs text-white/80">{hasChunking(sentence.text) ? 'Có chia cụm' : 'Câu liền mạch'}</span></div>
                  <p className={largeText ? 'rs-sentence-text rs-text-large' : 'rs-sentence-text'} lang="en">{renderChunkedText(sentence.text)}</p>
                  <div className="rs-sentence-footer"><span>{sentence.text.replace(/\//g, ' ').trim().split(/\s+/).filter(Boolean).length} từ</span><span>Đọc rõ · Nhớ ý · Nói trọn câu</span></div>
                  {sentence.vietnameseTranslation && <details className="rs-translation"><summary>Nghĩa tiếng Việt <span className="rs-chevron" aria-hidden="true">⌄</span></summary><p lang="vi" className="pb-4 text-base leading-7 text-white/80">{sentence.vietnameseTranslation}</p></details>}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShellBackground>
  );
};

export default RepeatSentence;
