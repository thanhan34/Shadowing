import React, { useState, useCallback, useEffect } from "react";
import { AudioSample } from "../../types/writefromdictation";

interface FlashcardModeProps {
  samples: AudioSample[];
  selectedVoice: string;
}

type KnowledgeStatus = "known" | "learning" | "unseen";

interface CardState {
  status: KnowledgeStatus;
}

const FlashcardMode: React.FC<FlashcardModeProps> = ({ samples, selectedVoice }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize card states
  useEffect(() => {
    setCardStates(samples.map(() => ({ status: "unseen" as KnowledgeStatus })));
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionDone(false);
  }, [samples]);

  const currentCard = samples[currentIndex];

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handlePlayAudio = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentCard) return;

      const audioSrc = currentCard.audio[selectedVoice] || Object.values(currentCard.audio)[0];
      if (!audioSrc) return;

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      const newAudio = new Audio(audioSrc);
      newAudio.onended = () => setIsPlaying(false);
      newAudio.onpause = () => setIsPlaying(false);
      newAudio.onplay = () => setIsPlaying(true);
      setAudio(newAudio);
      newAudio.play();
    },
    [currentCard, selectedVoice, audio]
  );

  const stopAudio = useCallback(() => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
  }, [audio]);

  const goToNext = useCallback(() => {
    stopAudio();
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < samples.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionDone(true);
      }
    }, 180);
  }, [currentIndex, samples.length, stopAudio]);

  const goToPrev = useCallback(() => {
    stopAudio();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }, 180);
  }, [stopAudio]);

  const markCard = useCallback(
    (status: KnowledgeStatus) => {
      setCardStates((prev) => {
        const updated = [...prev];
        updated[currentIndex] = { status };
        return updated;
      });
      goToNext();
    },
    [currentIndex, goToNext]
  );

  const restartSession = useCallback(() => {
    setCardStates(samples.map(() => ({ status: "unseen" as KnowledgeStatus })));
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionDone(false);
  }, [samples]);

  const reviewLearning = useCallback(() => {
    // Only keep "learning" cards in state, but for simplicity just restart
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionDone(false);
  }, []);

  const knownCount = cardStates.filter((c) => c.status === "known").length;
  const learningCount = cardStates.filter((c) => c.status === "learning").length;
  const unseenCount = cardStates.filter((c) => c.status === "unseen").length;
  const progress = samples.length > 0 ? ((currentIndex) / samples.length) * 100 : 0;

  if (samples.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/70">
        <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-lg font-medium">No flashcards available</p>
        <p className="text-sm mt-1 opacity-60">Try adjusting your filter options</p>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-6">
        {/* Session complete card */}
        <div
          className="w-full rounded-2xl p-8 text-center"
          style={{
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(22px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.32), 0 1.5px 8px rgba(0,0,0,0.18)",
          }}
        >
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
          <p className="text-white/60 mb-6 text-sm">You reviewed all {samples.length} flashcards</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.3)" }}>
              <div className="text-3xl font-bold text-green-400">{knownCount}</div>
              <div className="text-xs text-green-300 mt-1">Knew it</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(252,93,1,0.18)", border: "1px solid rgba(252,93,1,0.3)" }}>
              <div className="text-3xl font-bold text-[#fc5d01]">{learningCount}</div>
              <div className="text-xs text-orange-300 mt-1">Still Learning</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="text-3xl font-bold text-white/50">{unseenCount}</div>
              <div className="text-xs text-white/40 mt-1">Skipped</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={restartSession}
              className="px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #fc5d01, #fd7f33)",
                boxShadow: "0 0 20px rgba(252,93,1,0.35)",
              }}
            >
              Restart All
            </button>
            {learningCount > 0 && (
              <button
                onClick={reviewLearning}
                className="px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  backdropFilter: "blur(16px)",
                }}
              >
                Review Again ({learningCount})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = cardStates[currentIndex]?.status ?? "unseen";

  return (
    <div className="flex flex-col items-center w-full space-y-5">
      {/* Progress bar + counter */}
      <div className="w-full space-y-2">
        <div className="flex justify-between items-center text-sm text-white/70">
          <span className="font-medium">
            Card <span className="text-white font-bold">{currentIndex + 1}</span> / {samples.length}
          </span>
          <button
            onClick={() => setShowProgress(!showProgress)}
            className="text-xs px-3 py-1 rounded-full transition-all"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            {showProgress ? "Hide Stats" : "Show Stats"}
          </button>
        </div>
        {/* Progress track */}
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.10)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #fc5d01, #fd7f33)",
              boxShadow: "0 0 8px rgba(252,93,1,0.6)",
            }}
          />
        </div>

        {/* Stats badges */}
        {showProgress && (
          <div className="flex gap-2 flex-wrap mt-1">
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }}>
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Knew it: {knownCount}
            </span>
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: "rgba(252,93,1,0.15)", border: "1px solid rgba(252,93,1,0.3)", color: "#fdba74" }}>
              <span className="w-2 h-2 rounded-full bg-[#fc5d01] inline-block" />
              Still learning: {learningCount}
            </span>
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.5)" }}>
              <span className="w-2 h-2 rounded-full bg-white/30 inline-block" />
              Unseen: {unseenCount}
            </span>
          </div>
        )}
      </div>

      {/* Flashcard */}
      <div
        className="w-full cursor-pointer select-none"
        style={{ perspective: "1200px", minHeight: "240px" }}
        onClick={handleFlip}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "240px",
          }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 w-full rounded-2xl flex flex-col items-center justify-center p-8"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(22px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.32), 0 1.5px 8px rgba(0,0,0,0.14)",
              minHeight: "240px",
            }}
          >
          {/* Topic badge */}
            {currentCard?.topic && (
              <span
                className="absolute top-4 left-4 text-xs px-3 py-1 rounded-full"
                style={{
                  background: "rgba(252,93,1,0.18)",
                  border: "1px solid rgba(252,93,1,0.35)",
                  color: "#fdba74",
                }}
              >
                {currentCard.topic}
              </span>
            )}

            {/* Play audio button */}
            <button
              onClick={handlePlayAudio}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5"
              style={{
                background: isPlaying ? "rgba(252,93,1,0.35)" : "rgba(255,255,255,0.10)",
                border: `1px solid ${isPlaying ? "rgba(252,93,1,0.6)" : "rgba(255,255,255,0.22)"}`,
                boxShadow: isPlaying ? "0 0 12px rgba(252,93,1,0.5)" : "none",
              }}
              title="Play audio"
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-[#fc5d01]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              )}
            </button>

            {/* Occurrence badge */}
            {currentCard?.occurrence > 0 && (
              <span
                className="absolute bottom-4 right-4 text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                ×{currentCard.occurrence}
              </span>
            )}

            {/* FRONT: Vietnamese translation */}
            <div className="text-center space-y-3">
              <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "rgba(252,93,1,0.8)" }}>
                Vietnamese Translation
              </p>
              <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed text-center">
                {currentCard?.vietnameseTranslation || (
                  <span className="text-white/40 italic text-base">No translation available</span>
                )}
              </p>
            </div>

            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/30 pointer-events-none">
              Tap to reveal English sentence
            </p>
          </div>

          {/* Back face — English sentence */}
          <div
            className="absolute inset-0 w-full rounded-2xl flex flex-col items-center justify-center p-8"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.20)",
              backdropFilter: "blur(22px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.32), 0 0 24px rgba(252,93,1,0.08)",
              minHeight: "240px",
            }}
          >
            <div className="text-center space-y-4">
              <p className="text-xs font-medium mb-1 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
                English Sentence
              </p>
              {currentCard?.vietnameseTranslation && (
                <>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(252,93,1,0.75)" }}>
                    {currentCard.vietnameseTranslation}
                  </p>
                  <div className="w-12 h-px mx-auto" style={{ background: "rgba(255,255,255,0.2)" }} />
                </>
              )}
              <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed text-center">
                {currentCard?.text || "—"}
              </p>
            </div>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/30 pointer-events-none">
              Tap to flip back
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons: know / learning */}
      <div className="flex gap-3 w-full justify-center">
        <button
          onClick={() => markCard("learning")}
          className="flex-1 max-w-[160px] py-3 rounded-2xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5 flex items-center justify-center gap-2"
          style={{
            background: "rgba(252,93,1,0.14)",
            border: "1px solid rgba(252,93,1,0.35)",
            color: "#fdba74",
            boxShadow: "0 2px 12px rgba(252,93,1,0.18)",
          }}
        >
          <span className="text-base">😅</span> Still Learning
        </button>
        <button
          onClick={() => markCard("known")}
          className="flex-1 max-w-[160px] py-3 rounded-2xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5 flex items-center justify-center gap-2"
          style={{
            background: "rgba(34,197,94,0.14)",
            border: "1px solid rgba(34,197,94,0.35)",
            color: "#86efac",
            boxShadow: "0 2px 12px rgba(34,197,94,0.18)",
          }}
        >
          <span className="text-base">✅</span> Knew It!
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 w-full justify-center">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          ← Previous
        </button>
        <button
          onClick={handleFlip}
          className="px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          🔄 Flip
        </button>
        <button
          onClick={goToNext}
          className="px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          Next →
        </button>
      </div>

      {/* Current card status indicator */}
      {currentStatus !== "unseen" && (
        <div
          className="text-xs px-3 py-1.5 rounded-full"
          style={
            currentStatus === "known"
              ? { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }
              : { background: "rgba(252,93,1,0.15)", border: "1px solid rgba(252,93,1,0.3)", color: "#fdba74" }
          }
        >
          {currentStatus === "known" ? "✅ You marked this as known" : "😅 You marked this as still learning"}
        </div>
      )}
    </div>
  );
};

export default FlashcardMode;
