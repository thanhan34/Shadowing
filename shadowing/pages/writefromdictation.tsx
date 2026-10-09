import Tabs from "../components/ui/Tabs";
import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";
import Head from "next/head";
import { useRouter } from 'next/router';
import { notificationRequest } from '../lib/notifications/client';
import { useEffect, useRef, useState } from "react";
import { useWfdGamification } from "../hooks/useWfdGamification";
import { useStaffAccess } from '../hooks/useStaffAccess';
import GamificationPanel from "../components/writefromdictation/GamificationPanel";
import { DEFAULT_TOPICS } from "../types/writefromdictation";
import AnswerSummary from "../components/writefromdictation/AnswerSummary";
import FlashcardMode from "../components/writefromdictation/FlashcardMode";
import { useWriteFromDictation } from "../hooks/useWriteFromDictation";
import { useAnswerInputGuards } from "../hooks/useAnswerInputGuards";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Headphones, ArrowUpRight, Target, BookOpen, ChevronLeft, ChevronRight, Play, RotateCcw, Repeat, List, Square, CheckCircle, Download } from 'react-feather';

type PageMode = "practice" | "flashcard";
type ReportIssueType = "Sai audio" | "Sai topic" | "Sai bản dịch" | "Lỗi khác";

const REPORT_ISSUE_OPTIONS: ReportIssueType[] = [
  "Sai audio",
  "Sai topic",
  "Sai bản dịch",
  "Lỗi khác",
];

const WriteFromDictation: React.FC = () => {
  const canExportCSV = useStaffAccess();
  const router = useRouter();
  const reviewMode = router.query.mode === 'review';
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [reviewStatus, setReviewStatus] = useState('');
  useEffect(() => {
    if (!reviewMode) return;
    let active = true;
    setReviewIds([]); setReviewStatus('Đang tải câu đến hạn ôn…');
    notificationRequest('mastery').then(data => {
      if (active) { setReviewIds(data.reviewIds); setReviewStatus(data.reviewIds.length ? `${data.reviewIds.length} câu đến hạn khi bắt đầu phiên ôn.` : 'Bạn đã hoàn thành các câu đến hạn ôn.'); }
    }).catch(e => { if (active) setReviewStatus(e.message); });
    return () => { active = false; };
  }, [reviewMode]);
  const [pageMode, setPageMode] = useState<PageMode>("practice");
  const game = useWfdGamification();
  const [sessionSummary, setSessionSummary] = useState(false);
  const attemptSubmitted = useRef(false);
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<ReportIssueType[]>([]);
  const [reportNote, setReportNote] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportStatus, setReportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    audioRef,
    backgroundImage,
    sortedAudioSamples,
    currentAudioSample,
    currentIndex,
    isAutoplay,
    isRepeatMode,
    showAnswer,
    alwaysShowAnswer,
    inputText,
    score,
    maxScore,
    wordStatuses,
    selectedVoice,
    sortingOption,
    playbackRate,
    loading,
    filterOption,
    topicFilter,
    remainingRandomSentenceCount,
    handleNext,
    handleBack,
    handleRandomSentence,
    handlePlayAll,
    handleAudioEnd,
    handleSelectIndexChange,
    handleAlwaysShowAnswerChange,
    handleInputTextChange,
    handleVoiceChange,
    handleSortingChange,
    handleFilterChange,
    handleTopicFilterChange,
    handlePlaybackRateChange,
    handleAnswerButtonClick,
    handlePlay,
    handleRepeat,
    toggleRepeatMode,
    handleExportCSV
  } = useWriteFromDictation(reviewMode ? reviewIds : undefined);
  const questionId = currentAudioSample?.id;
  const prepareAttempt = game.prepare;
  const resetAttemptTicket = game.resetTicket;
  const preparedContext = useRef('');
  useEffect(() => {
    const context = `${pageMode}:${questionId || ''}`;
    if (preparedContext.current === context) return;
    preparedContext.current = context;
    resetAttemptTicket();
    attemptSubmitted.current = false;
    if (questionId && pageMode === 'practice') prepareAttempt(questionId);
  }, [questionId, pageMode, prepareAttempt, resetAttemptTicket]);
  const submitAnswer = () => {
    // Existing scoring and answer reveal remain available even if the reward API fails.
    handleAnswerButtonClick();
    if (questionId && !attemptSubmitted.current && !alwaysShowAnswer && inputText.trim()) {
      attemptSubmitted.current = true;
      void game.submit(questionId, inputText);
    }
  };
  const {
    handlePreventCopyPaste,
    handlePreventContextMenu,
    handlePreventDragDrop
  } = useAnswerInputGuards();

  const currentQuestionNumber = currentIndex + 1;
  const hasSelectedIssues = selectedIssues.length > 0;

  const toggleIssueType = (issueType: ReportIssueType) => {
    setReportStatus(null);
    setSelectedIssues((prev) =>
      prev.includes(issueType)
        ? prev.filter((item) => item !== issueType)
        : [...prev, issueType]
    );
  };

  const resetReportForm = () => {
    setSelectedIssues([]);
    setReportNote("");
    setReportStatus(null);
  };

  const handleSubmitReport = async () => {
    if (!currentAudioSample || selectedIssues.length === 0) {
      setReportStatus({
        type: "error",
        message: "Vui lòng chọn ít nhất 1 loại lỗi trước khi gửi báo cáo.",
      });
      return;
    }

    try {
      setIsSubmittingReport(true);
      setReportStatus(null);

      const response = await fetch("/api/report-writefromdictation-issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionNumber: currentQuestionNumber,
          sentenceText: currentAudioSample.text,
          topic: currentAudioSample.topic || "General",
          vietnameseTranslation: currentAudioSample.vietnameseTranslation || "",
          selectedVoice,
          audioUrl: currentAudioSample.audio[selectedVoice] || Object.values(currentAudioSample.audio)[0] || "",
          issueTypes: selectedIssues,
          note: reportNote,
          pageMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Không thể gửi báo cáo.");
      }

      setReportStatus({
        type: "success",
        message: "Đã gửi báo cáo lỗi lên Discord thành công.",
      });
      setSelectedIssues([]);
      setReportNote("");
    } catch (error) {
      setReportStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Đã có lỗi xảy ra khi gửi báo cáo.",
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="wfd-page flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #1a0a00 0%, #2d1200 50%, #0d0d0d 100%)" }}>
        <div className="flex flex-col items-center gap-4" role="status">
          <div className="w-12 h-12 rounded-full border-2 border-[#fc5d01] border-t-transparent animate-spin" />
          <p className="text-white/80 text-sm">Đang tải bài luyện Write From Dictation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wfd-background min-h-screen w-full bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }}><main className="wfd-page wfd-studio mx-auto min-h-screen w-full max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:pt-40">
      <Head>
        <title>Write From Dictation - PTE Intensive</title>
        <meta
          name="description"
          content="Sử dụng bộ công cụ luyện tập PTE hiệu quả nhất, với các bài tập đa dạng, tài liệu cập nhật và lộ trình cá nhân hóa. Nâng cao kỹ năng nghe, nói, đọc, viết và đạt điểm số mơ ước với PTE Intensive."
        />
        <meta
          name="keywords"
          content="bộ công cụ PTE, luyện tập PTE, công cụ PTE, luyện thi PTE, bài tập PTE, tài liệu PTE, luyện PTE hiệu quả, nâng cao kỹ năng PTE, thi PTE đạt điểm cao"
        />
        <meta name="author" content="PTE Intensive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="wfd-header w-full">
        <div className="wfd-hero-copy">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-lightBackground"><Headphones size={16} aria-hidden="true" /> PTE Intensive / Listening Studio</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Write From<br /><span className="text-lightBackground">Dictation.</span></h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/80">Một câu nghe. Từng từ chính xác.<br />Không gian riêng để bạn tập trung và tiến bộ mỗi ngày.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3"><span className="wfd-count">{sortedAudioSamples.length} câu trong bộ lọc</span><span className="text-xs text-white/80">Listening + Writing</span></div>
        </div>
        <div className="wfd-sound-art" aria-hidden="true"><span className="wfd-art-label">FOCUS ON EVERY WORD</span><div className="wfd-waveform">{Array.from({ length: 27 }, (_, index) => <span key={index} />)}</div><div className="wfd-art-footer"><span>LISTEN CLOSELY</span><Headphones size={24} /><span>WRITE CLEARLY</span></div></div>
      </header>

      {/* ── Mode Toggle Tabs ── */}
      <aside className="wfd-sidebar" aria-label="Tiến độ và công cụ học tập">
      <Card className="w-full space-y-3 text-textGlass-primary">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Góc học tập của bạn</p>
        <div className="space-y-2"><Link className="wfd-studio-link" href="/writefromdictation/mastery"><BookOpen size={18} aria-hidden="true" /><span>Tiến độ Mastery</span><ArrowUpRight size={16} aria-hidden="true" /></Link><Link className="wfd-studio-link" href={reviewMode ? '/writefromdictation' : '/writefromdictation?mode=review'}><Target size={18} aria-hidden="true" /><span>{reviewMode ? 'Luyện toàn bộ câu' : 'Ôn câu đến hạn'}</span><ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        {reviewMode && <p role="status">{reviewStatus}</p>}
      </Card>
      <GamificationPanel game={game} summary={sessionSummary} onCloseSummary={() => setSessionSummary(false)} />
      {pageMode === 'practice' && game.session.practiced > 0 && <Button variant="secondary" onClick={() => setSessionSummary(true)}>Kết thúc session</Button>}
      <Card className="wfd-studio-tip"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lightBackground">Một chút chiến thuật</p><h2 className="text-lg font-semibold">Nghe ý, nhớ cụm từ.</h2><p className="mt-3 text-sm leading-7 text-white/80">Lượt đầu, nắm ý chính. Lượt tiếp theo, chú ý các cụm từ và đuôi số nhiều. Đọc lại câu trước khi kiểm tra đáp án.</p><div className="mt-4 flex gap-2" aria-hidden="true"><span className="wfd-tip-dot" /><span className="wfd-tip-dot" /><span className="wfd-tip-dot" /></div></Card>
      </aside>
      <section className="wfd-practice-column" aria-label="Bài luyện Write From Dictation">
      <div className="wfd-mode-bar w-full"><Tabs items={[{ key: 'practice', label: 'Luyện nghe & viết' }, { key: 'flashcard', label: 'Ôn bằng flashcard' }]} activeKey={pageMode} onChange={mode => {
        if (mode === 'flashcard' && pageMode === 'practice' && game.session.practiced > 0) setSessionSummary(true);
        setPageMode(mode as PageMode);
      }} /><p className="text-sm text-white/80">{pageMode === 'practice' ? 'Nghe · Viết · Kiểm tra' : 'Lật thẻ · Ghi nhớ · Ôn tập'}</p></div>

      <div className="wfd-workspace w-full">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lightBackground">{pageMode === 'practice' ? 'Your practice desk' : 'Your memory deck'}</p><h2 className="text-xl font-semibold">{pageMode === 'practice' ? 'Lắng nghe. Viết lại. Tiến bộ.' : 'Lật thẻ, nhớ lâu hơn.'}</h2></div>
          {pageMode === 'practice' && currentAudioSample && <span className="wfd-count">Câu {currentQuestionNumber} / {sortedAudioSamples.length}</span>}
        </div>
        <details className="wfd-settings-disclosure mb-6">
          <summary className="wfd-settings-summary"><span><strong>Cài đặt luyện tập</strong><span className="mt-1 block text-xs font-normal text-white/80">Bộ lọc, giọng đọc và hiển thị đáp án</span></span><span className="wfd-disclosure-chevron" aria-hidden="true">⌄</span></summary>
          <div className="wfd-settings-body">
        {/* ── FILTER / SORT controls (shared across both modes) ── */}
        <div
          className={`wfd-filters mb-6 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 ${
            pageMode === "practice"
              ? "lg:grid-cols-2"
              : "lg:grid-cols-3"
          }`}
        >
          <div className="w-full min-w-0">
            <label htmlFor="sorting-select" className="block mb-1 font-medium text-gray-700 dark:text-white/80 text-sm">
              Sắp xếp:
            </label>
            <select
              id="sorting-select"
              value={sortingOption}
              onChange={(event) => handleSortingChange(event.target.value)}
              className="h-11 w-full min-w-0 border border-gray-300 rounded-lg px-3 shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent text-black"
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="occurrence">Occurrence (Highest to Lowest)</option>
              <option value="newest">Newest</option>
              <option value="easyToDifficult">Easy to Difficult (Shortest to Longest Text)</option>
            </select>
          </div>
          <div className="w-full min-w-0">
            <label htmlFor="filter-select" className="block mb-1 font-medium text-gray-700 dark:text-white/80 text-sm">
              Bộ lọc:
            </label>
            <select
              id="filter-select"
              value={filterOption}
              onChange={(event) => handleFilterChange(event.target.value)}
              className="h-11 w-full min-w-0 border border-gray-300 rounded-lg px-3 shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent text-black"
            >
              <option value="All">All</option>
              <option value="New">New</option>
              <option value="Still Important">Still Important</option>
            </select>
          </div>
          <div className="w-full min-w-0">
            <label htmlFor="topic-filter" className="block mb-1 font-medium text-gray-700 dark:text-white/80 text-sm">
              Chủ đề:
            </label>
            <select
              id="topic-filter"
              value={topicFilter}
              onChange={(event) => handleTopicFilterChange(event.target.value)}
              className="h-11 w-full min-w-0 border border-gray-300 rounded-lg px-3 shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent text-black"
            >
              {DEFAULT_TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
          {pageMode === "practice" && (
            <div className="w-full min-w-0 sm:col-span-2 lg:col-span-1 lg:w-auto">
              <div className="mb-1 flex items-center justify-between gap-2 text-sm font-medium text-gray-700 dark:text-white/80">
                <span>Câu ngẫu nhiên:</span>
                <span className="whitespace-nowrap text-xs font-normal text-gray-600 dark:text-white/60">
                  {remainingRandomSentenceCount}/{sortedAudioSamples.length} chưa nghe
                </span>
              </div>
              <Button
                type="button"
                onClick={handleRandomSentence}
                disabled={remainingRandomSentenceCount === 0}
                title={remainingRandomSentenceCount === 0
                  ? "Bạn đã nghe hết các câu trong bộ lọc hiện tại"
                  : `Nghe một câu chưa phát trong ${topicFilter === "All" ? "tất cả chủ đề" : topicFilter}`}
                className="flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm lg:w-auto"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 3h5v5" />
                  <path d="M4 20 21 3" />
                  <path d="M21 16v5h-5" />
                  <path d="m15 15 6 6" />
                  <path d="M4 4 9 9" />
                </svg>
                Nghe ngẫu nhiên
              </Button>
            </div>
          )}
        </div>


            <div className="wfd-settings mb-4 mt-6 grid gap-4 sm:grid-cols-2">
              <div hidden={pageMode !== 'practice'} className="mb-4 md:mb-0 md:mr-4 w-full">
                <label htmlFor="audio-select" className="block mb-1 font-medium text-gray-700">
                  Chọn câu:
                </label>
                <select
                  id="audio-select"
                  value={currentIndex}
                  onChange={(event) => handleSelectIndexChange(parseInt(event.target.value, 10))}
                  className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  disabled={sortedAudioSamples.length === 0}
                >
                  {sortedAudioSamples.map((sample, index) => (
                    <option key={index} value={index}>
                      Audio {index + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4 md:mb-0 md:mr-4 w-full">
                <label htmlFor="voice-select" className="block mb-1 font-medium text-gray-700">
                  Giọng đọc:
                </label>
                <select
                  id="voice-select"
                  value={selectedVoice}
                  onChange={(event) => handleVoiceChange(event.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  {sortedAudioSamples.length > 0 &&
                    Object.keys(sortedAudioSamples[pageMode === 'flashcard' ? 0 : currentIndex]?.audio ?? {}).map((voice, index) => (
                      <option key={index} value={voice}>
                        {voice}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {pageMode === 'practice' && <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="showAnswer"
                checked={alwaysShowAnswer}
                onChange={(event) => handleAlwaysShowAnswerChange(event.target.checked)}
                className="mr-2"
              />
              <label htmlFor="showAnswer" className="text-white">
                Luôn hiện đáp án
              </label>
            </div>}

          </div>
        </details>
        {(filterOption !== 'All' || topicFilter !== 'All' || alwaysShowAnswer) && <p className="mb-4 text-xs leading-6 text-lightBackground">Đang áp dụng: {filterOption !== 'All' ? filterOption + ' · ' : ''}{topicFilter !== 'All' ? topicFilter + ' · ' : ''}{alwaysShowAnswer ? 'Luôn hiện đáp án · ' : ''}Thay đổi trong Cài đặt luyện tập.</p>}

        {/* ══════════════════════════════════════
            FLASHCARD MODE
        ══════════════════════════════════════ */}
        {pageMode === "flashcard" && (
          <div
            className="w-full rounded-2xl p-5"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
            }}
          >
            <FlashcardMode samples={sortedAudioSamples} selectedVoice={selectedVoice} />
          </div>
        )}

        {/* ══════════════════════════════════════
            PRACTICE MODE
        ══════════════════════════════════════ */}
        {pageMode === "practice" && (
          <>
            {!currentAudioSample && <Card><p role="status" className="py-8 text-center">Không có câu phù hợp. Hãy thử thay đổi bộ lọc hoặc chủ đề.</p></Card>}
            {sortedAudioSamples.length > 0 && currentAudioSample && (
              <AudioPlayer
                variant="dictation"
                ref={audioRef}
                occurrence={currentAudioSample.occurrence}
                questionType={currentAudioSample.questionType}
                audio={currentAudioSample.audio[selectedVoice]}
                text={currentAudioSample.text}
                vietnameseTranslation={currentAudioSample.vietnameseTranslation}
                onEnded={handleAudioEnd}
                showAnswer={showAnswer}
                playbackRate={playbackRate}
                onPlaybackRateChange={handlePlaybackRateChange}
              />
            )}

            {currentAudioSample && (
              <>
                <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
                  <button
                    type="button"
                    aria-label={isReportPanelOpen ? "Ẩn báo cáo lỗi" : `Báo cáo lỗi câu ${currentQuestionNumber}`}
                    onClick={() => {
                      setReportStatus(null);
                      setIsReportPanelOpen((prev) => !prev);
                    }}
                    className="wfd-report-trigger accent-ring glass glass-hover relative flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 shadow-[0_12px_30px_rgba(0,0,0,0.35),0_0_22px_rgba(252,93,1,0.18)] backdrop-blur-[20px]"
                  >
                    <svg
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                    {hasSelectedIssues && !isReportPanelOpen && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-[#fc5d01]/50 bg-[#fc5d01] px-1 text-[10px] font-bold text-white shadow-[0_0_14px_rgba(252,93,1,0.5)]">
                        {selectedIssues.length}
                      </span>
                    )}
                  </button>
                </div>

                {isReportPanelOpen && (
                  <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-md sm:bottom-24 sm:right-6">
                    <Card strong className="space-y-4 rounded-[22px] border-white/20 bg-white/10 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85),0_0_24px_rgba(252,93,1,0.14)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white">Báo cáo lỗi câu #{currentQuestionNumber}</p>
                          <p className="text-xs text-white/55">Popup này sẽ gửi trực tiếp sang Discord để bạn tiện sửa nhanh.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsReportPanelOpen(false)}
                          className="accent-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/65 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:text-white active:translate-y-0.5"
                          aria-label="Đóng popup báo lỗi"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex min-h-[32px] items-center rounded-full border border-[#fc5d01]/40 bg-[#fc5d01]/15 px-3 py-1 text-xs font-semibold text-orange-200">
                            Báo cáo lỗi câu #{currentQuestionNumber}
                          </span>
                          <span className="inline-flex min-h-[32px] items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                            Topic: {currentAudioSample.topic || "General"}
                          </span>
                        </div>
                        <p className="text-sm leading-6 text-white/90">
                          <span className="font-semibold text-white">Sentence:</span> {currentAudioSample.text}
                        </p>
                        {currentAudioSample.vietnameseTranslation && (
                          <p className="text-sm leading-6 text-white/70">
                            <span className="font-semibold text-white/85">Bản dịch:</span>{" "}
                            {currentAudioSample.vietnameseTranslation}
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-xs text-white/70">
                        <p><span className="text-white/90 font-semibold">Voice:</span> {selectedVoice}</p>
                        <p className="mt-1"><span className="text-white/90 font-semibold">Audio:</span> {currentAudioSample.audio[selectedVoice] ? "Đúng voice đang chọn" : "Fallback voice"}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-white">Chọn lỗi cần báo cáo</p>
                      <div className="flex flex-wrap gap-2">
                        {REPORT_ISSUE_OPTIONS.map((issue) => {
                          const active = selectedIssues.includes(issue);

                          return (
                            <button
                              key={issue}
                              type="button"
                              onClick={() => toggleIssueType(issue)}
                              className={`accent-ring min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                active
                                  ? "border-[#fc5d01]/60 bg-[#fc5d01]/20 text-orange-100 shadow-[0_0_18px_rgba(252,93,1,0.28)]"
                                  : "border-white/15 bg-white/6 text-white/75 hover:-translate-y-0.5 hover:border-white/30 hover:shadow-lg active:translate-y-0.5"
                              }`}
                            >
                              {issue}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="report-note" className="block text-sm font-semibold text-white">
                        Mô tả chi tiết thêm
                      </label>
                      <Input
                        id="report-note"
                        multiline
                        rows={4}
                        value={reportNote}
                        onChange={(event) => {
                          setReportStatus(null);
                          setReportNote(event.target.value);
                        }}
                        placeholder="Ví dụ: Audio đang phát là câu khác, topic hiển thị chưa đúng, bản dịch bị thiếu nghĩa..."
                        className="bg-white/8 text-sm text-white placeholder:text-white/45"
                      />
                    </div>

                    {reportStatus && (
                      <div
                        className={`rounded-2xl border px-4 py-3 text-sm ${
                          reportStatus.type === "success"
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                            : "border-red-400/30 bg-red-400/10 text-red-200"
                        }`}
                      >
                        {reportStatus.message}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs leading-5 text-white/55">
                        Báo cáo sẽ gửi kèm câu số, sentence, topic, bản dịch, voice và audio URL để tiện chỉnh sửa nhanh.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={resetReportForm}
                          disabled={isSubmittingReport}
                          className="px-4"
                        >
                          Xóa chọn
                        </Button>
                        <Button
                          variant="primary"
                          onClick={async () => {
                            await handleSubmitReport();
                          }}
                          disabled={isSubmittingReport || !currentAudioSample}
                          className="px-4"
                        >
                          {isSubmittingReport ? "Đang gửi..." : "Gửi báo cáo lỗi"}
                        </Button>
                      </div>
                    </div>
                    </Card>
                  </div>
                )}
              </>
            )}

            <div className="wfd-writing mt-6 w-full">
              <label htmlFor="txtInput" className="mb-2 block text-lg font-semibold">02 · Viết lại câu bạn nghe được</label>
              <p id="wfd-input-hint" className="mb-4 text-sm text-white/80">Nhập đầy đủ câu bằng tiếng Anh, sau đó chọn “Kiểm tra đáp án”.</p>
              <textarea
                aria-describedby="wfd-input-hint"
                placeholder="Type the sentence you hear…"
                disabled={!currentAudioSample}
                spellCheck={false}
                id="txtInput"
                rows={5}
                className="w-full p-4 border border-gray-300 rounded-lg shadow-sm bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                value={inputText}
                onChange={(event) => handleInputTextChange(event.target.value)}
                onCopy={handlePreventCopyPaste}
                onCut={handlePreventCopyPaste}
                onPaste={handlePreventCopyPaste}
                onContextMenu={handlePreventContextMenu}
                onDrop={handlePreventDragDrop}
                onDragOver={handlePreventDragDrop}
              ></textarea>
            </div>
            <AnswerSummary
              score={score}
              maxScore={maxScore}
              showAnswer={showAnswer}
              wordStatuses={wordStatuses}
            />
            <section className="wfd-actions mt-6" aria-label="Điều khiển luyện tập">
              <div className="wfd-controls-heading"><span className="flex items-center gap-2"><Headphones size={16} aria-hidden="true" /> LISTENING CONSOLE</span><span className="wfd-console-counter">{currentAudioSample ? `Câu ${currentQuestionNumber} / ${sortedAudioSamples.length}` : 'Chưa có câu'}</span></div>
              <div className="wfd-transport" role="group" aria-label="Phát audio và chuyển câu">
                <Button variant="secondary" className="wfd-control" onClick={handleBack} disabled={!sortedAudioSamples.length}><ChevronLeft size={18} aria-hidden="true" /><span>Câu trước</span></Button>
                <Button variant="secondary" className="wfd-control wfd-play-control" disabled={!currentAudioSample} onClick={handlePlay}><span className="wfd-play-disc"><Play size={24} aria-hidden="true" /></span><span>Phát audio</span></Button>
                <Button variant="secondary" className="wfd-control" onClick={handleNext} disabled={!sortedAudioSamples.length}><span>Câu tiếp</span><ChevronRight size={18} aria-hidden="true" /></Button>
              </div>
              <details className="wfd-settings-disclosure mt-3">
                <summary className="wfd-settings-summary"><span>Chế độ nghe thêm{isRepeatMode || isAutoplay ? ' · Đang bật' : ''}</span><span className="wfd-disclosure-chevron" aria-hidden="true">⌄</span></summary>
              <div className="wfd-listening-options" role="group" aria-label="Tùy chọn nghe">
                <Button variant="secondary" className="wfd-control" disabled={!currentAudioSample} onClick={() => { attemptSubmitted.current = false; game.resetTicket(); if (questionId) game.prepare(questionId); void handleRepeat(); }}><RotateCcw size={16} aria-hidden="true" /><span>Luyện lại</span></Button>
                <Button variant="secondary" className="wfd-control" aria-pressed={isRepeatMode} disabled={!currentAudioSample} onClick={toggleRepeatMode}><Repeat size={16} aria-hidden="true" /><span>Lặp câu</span><span className="wfd-toggle-state">{isRepeatMode ? 'Bật' : 'Tắt'}</span></Button>
                <Button variant="secondary" className="wfd-control" aria-pressed={isAutoplay} disabled={!currentAudioSample} onClick={handlePlayAll}>{isAutoplay ? <Square size={16} aria-hidden="true" /> : <List size={16} aria-hidden="true" />}<span>{isAutoplay ? 'Dừng phát tất cả' : 'Phát tất cả'}</span></Button>
              </div>
              </details>
              <div className="wfd-submit-row">
                <Button className="wfd-control wfd-submit-control" disabled={!currentAudioSample} onClick={submitAnswer}><CheckCircle size={19} aria-hidden="true" /><span>Kiểm tra đáp án</span><ChevronRight size={18} aria-hidden="true" /></Button>
              </div>
              {canExportCSV && <div className="wfd-staff-tools"><span className="text-xs text-white/80">Công cụ quản trị</span><Button variant="secondary" className="wfd-control wfd-export-control" disabled={!currentAudioSample} onClick={() => { if (canExportCSV) handleExportCSV(); }}><Download size={16} aria-hidden="true" /><span>Xuất CSV</span></Button></div>}
            </section>
          </>
        )}
      </div>
      </section>
    </main></div>
  );
};

export default WriteFromDictation;
