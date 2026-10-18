import React, { useRef, useState } from "react";
import { ExternalLink, Headphones, Play, Pause, RotateCcw } from "react-feather";
import Button from "./ui/Button";

interface RepeatSentenceActionsProps {
  sentenceId?: string;
  audio?: string;
  practiceUrl?: string;
}

export function getRepeatSentencePracticeUrl(practiceUrl?: string, sentenceId?: string): string | null {
  const match = sentenceId?.trim().match(/^#?(\d+)\s*(?:RS)?$/i);
  const number = match ? Number(match[1]) : 0;
  const fallback = Number.isSafeInteger(number) && number > 0
    ? `https://www.apeuni.com/practice/repeat_sentences/${number}`
    : null;
  const savedUrl = practiceUrl?.trim();
  // Only render APEUni RS links, never arbitrary URLs from stored data.
  if (savedUrl && /^https:\/\/www\.apeuni\.com\/practice\/repeat_sentences\/[1-9]\d*$/.test(savedUrl)) {
    return savedUrl;
  }
  return fallback;
}

export const formatAudioTime = (seconds: number) => {
  const value = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
};

const RepeatSentenceActions: React.FC<RepeatSentenceActionsProps> = ({ sentenceId, audio, practiceUrl }) => {
  const [audioError, setAudioError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const source = audio?.trim();
  const link = getRepeatSentencePracticeUrl(practiceUrl, sentenceId);
  const label = sentenceId || "câu Repeat Sentence";

  const togglePlayback = async () => {
    const element = audioRef.current;
    if (!element) return;
    if (!element.paused) {
      element.pause();
      return;
    }
    setAudioError(false);
    try {
      if (element.error) element.load();
      await element.play();
    } catch (error) {
      if ((error as Error).name !== "AbortError") setAudioError(true);
    }
  };

  return (
    <div className="rs-practice-actions">
      <div className="rs-audio-block">
        <div className="rs-audio-heading"><p className="rs-audio-label"><Headphones size={14} aria-hidden="true" />NGHE CÂU MẪU</p><span className="rs-voice-badge">Ryan</span></div>
        {source ? (
          <>
            <audio
              key={source}
              ref={audioRef}
              preload="none"
              src={source}
              aria-label={`Nghe audio Ryan — ${label}`}
              className="rs-sentence-audio"
              onPlay={(event) => {
                const current = event.currentTarget;
                setIsPlaying(true);
                document.querySelectorAll<HTMLAudioElement>(".rs-sentence-audio").forEach((element) => {
                  if (element !== current) element.pause();
                });
              }}
              onPlaying={() => setAudioError(false)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
              onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
              onError={() => { setAudioError(true); setIsPlaying(false); }}
            />
            <div className="rs-audio-controls">
              <button type="button" className="rs-audio-play accent-ring" onClick={() => void togglePlayback()} aria-label={`${isPlaying ? "Tạm dừng" : "Phát"} audio Ryan — ${label}`} aria-pressed={isPlaying}>
                {isPlaying ? <Pause size={20} fill="currentColor" aria-hidden="true" /> : <Play size={20} fill="currentColor" aria-hidden="true" />}
              </button>
              <div className="rs-audio-timeline">
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  value={Math.min(currentTime, duration || 0)}
                  disabled={!duration}
                  aria-label={`Tua audio — ${label}`}
                  aria-valuetext={`${formatAudioTime(currentTime)} / ${formatAudioTime(duration)}`}
                  className="rs-audio-seek accent-ring"
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (audioRef.current) audioRef.current.currentTime = value;
                    setCurrentTime(value);
                  }}
                />
                <div className="rs-audio-time"><span>{formatAudioTime(currentTime)}</span><span>{formatAudioTime(duration)}</span></div>
              </div>
              <button type="button" className="rs-audio-restart accent-ring" disabled={!duration} aria-label={`Nghe lại từ đầu — ${label}`} onClick={() => {
                if (audioRef.current) { audioRef.current.currentTime = 0; setCurrentTime(0); }
              }}><RotateCcw size={16} aria-hidden="true" /></button>
            </div>
            {audioError && (
              <div className="space-y-2">
                <p role="status" className="text-sm text-white/80">Không tải được audio. Hãy thử lại hoặc Refresh danh sách.</p>
                <Button variant="secondary" onClick={() => {
                  audioRef.current?.load();
                  void togglePlayback();
                }}>Thử lại audio</Button>
              </div>
            )}
          </>
        ) : <p className="text-sm text-white/70">Câu này chưa có audio Ryan.</p>}
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="accent-ring rs-practice-link" aria-label={`Luyện tập ${label} trên APEUni (mở tab mới)`}>
          <span className="rs-practice-icon"><ExternalLink size={18} aria-hidden="true" /></span>
          <span className="rs-practice-copy"><strong>Luyện tập trên APEUni</strong><span>{sentenceId || "Repeat Sentence"} · Mở tab mới</span></span>
        </a>
      ) : <p className="text-sm text-white/70">Chưa có link luyện tập cho câu này.</p>}
    </div>
  );
};

export default RepeatSentenceActions;