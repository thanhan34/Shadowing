import React, { useEffect, useMemo, useRef, useState } from "react";
import { PracticeMode } from "../../data/essayTemplates";

interface TypingAreaProps {
  mode: PracticeMode;
  templateText: string;
  displayText: string;
  sectionLabels: string[];
  persistedText: string;
  persistedErrors: number;
  persistedStartedAt: number | null;
  onProgressChange: (typedText: string, errorCount: number) => void;
  onStartChange: (startedAt: number | null) => void;
  onComplete: (durationSeconds: number) => void;
}

const TypingArea: React.FC<TypingAreaProps> = ({
  mode,
  templateText,
  displayText,
  sectionLabels,
  persistedText,
  persistedErrors,
  persistedStartedAt,
  onProgressChange,
  onStartChange,
  onComplete
}) => {
  const typedText = persistedText;
  const errorCount = persistedErrors;
  const [hasError, setHasError] = useState(false);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [mismatchChar, setMismatchChar] = useState<string | null>(null);
  const [displayInput, setDisplayInput] = useState("");
  const [currentWordBuffer, setCurrentWordBuffer] = useState("");
  const startedAt = persistedStartedAt;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (typedText.length === 0 && (hasError || mismatchChar)) {
      setHasError(false);
      setMismatchChar(null);
      setErrorIndex(null);
    }
  }, [typedText, hasError, mismatchChar]);


  useEffect(() => {
    if (typedText.length < templateText.length) {
      hasCompletedRef.current = false;
      return;
    }

    if (typedText.length === templateText.length && !hasError && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      const durationSeconds = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
      onComplete(durationSeconds);
    }
  }, [typedText, templateText, hasError, startedAt, onComplete]);

  // Strict typing validation:
  // - Compare character-by-character with templateText
  // - Wrong character shows in red, correct character advances and turns orange
  // - Enter must match line breaks (\n)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      return;
    }

    if (mismatchChar && event.key !== "Backspace") {
      event.preventDefault();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      if (mismatchChar) {
        setMismatchChar(null);
        setHasError(false);
        setErrorIndex(null);
        setDisplayInput(currentWordBuffer);
        return;
      }
      if (typedText.length > 0) {
        onProgressChange(typedText.slice(0, -1), errorCount);
      }
      setDisplayInput("");
      setCurrentWordBuffer("");
      return;
    }

    if (event.key.length !== 1 && event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const expectedChar = templateText[typedText.length];
    const incomingChar = event.key === "Enter" ? "\n" : event.key;

    if (incomingChar !== expectedChar) {
      setHasError(true);
      setErrorIndex(typedText.length);
      setMismatchChar(incomingChar);
      setDisplayInput(`${currentWordBuffer}${incomingChar}`);
      onProgressChange(typedText, errorCount + 1);
      return;
    }

    setHasError(false);
    setErrorIndex(null);
    setMismatchChar(null);
    const isWordBoundary = incomingChar === " " || incomingChar === "\n";
    if (isWordBoundary) {
      setDisplayInput("");
      setCurrentWordBuffer("");
    } else {
      const nextWord = `${currentWordBuffer}${incomingChar}`;
      setCurrentWordBuffer(nextWord);
      setDisplayInput(nextWord);
    }
    const nextText = typedText + incomingChar;
    if (!startedAt && nextText.length > 0) {
      onStartChange(Date.now());
    }
    onProgressChange(nextText, errorCount);
  };

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.selectionStart = typedText.length;
      inputRef.current.selectionEnd = typedText.length;
    }
  };

  const renderedText = useMemo(() => {
    const visibleSource = mode === "blind" ? "" : displayText;
    const chars = templateText.split("");
    return chars.map((char, index) => {
      const typedChar = typedText[index];
      const isTyped = index < typedText.length;
      const isCorrect = typedChar === char;
      const isCurrent = index === typedText.length;
      const isErrorPosition = errorIndex === index;
      const shouldShowGhost = mode === "copy" || mode === "missing";

      let ghostChar = "";
      if (shouldShowGhost && visibleSource) {
        ghostChar = visibleSource[index] ?? "";
      }

      if (char === "\n") {
        const lineClass = isErrorPosition ? "border-l-2 border-red-500" : "";
        return (
          <span
            key={`br-${index}`}
            className={`block h-6 ${lineClass}`}
          >
            {isCurrent && mismatchChar ? mismatchChar : isTyped ? "" : ghostChar}
          </span>
        );
      }

      const placeholderChar = "\u00A0";

      const displayChar = isCurrent && mismatchChar ? mismatchChar : null;

      return (
        <span
          key={`${char}-${index}`}
          className={`relative ${
            isTyped
              ? isCorrect
                ? "text-[#fc5d01]"
                : "text-red-600"
              : isErrorPosition
                ? "text-red-600"
                : "text-gray-400"
          }`}
        >
          {isTyped
            ? char
            : displayChar
              ? displayChar
              : shouldShowGhost
                ? ghostChar || placeholderChar
                : placeholderChar}
        </span>
      );
    });
  }, [templateText, typedText, mode, displayText, errorIndex, mismatchChar]);

  return (
    <div className="w-full">
      {mode === "blind" ? (
        <div className="mb-4 space-y-2">
          {sectionLabels.map(label => (
            <div
              key={label}
              className="rounded-lg border border-[#fedac2] bg-[#fedac2] px-4 py-2 text-sm font-semibold text-[#fc5d01]"
            >
              {label}
            </div>
          ))}
        </div>
      ) : null}
      <div
        className={`max-h-[260px] overflow-y-auto whitespace-pre-wrap rounded-lg border bg-white p-4 text-lg leading-relaxed tracking-wide ${
          hasError ? "border-red-500" : "border-[#fedac2]"
        }`}
      >
        {renderedText}
      </div>
      <textarea
        ref={inputRef}
        value={displayInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleFocus}
        onChange={() => undefined}
        className="mt-4 h-20 w-full rounded-lg border border-[#fedac2] bg-white p-3 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
        placeholder="Bắt đầu gõ tại đây..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onPaste={event => event.preventDefault()}
        onCopy={event => event.preventDefault()}
        onCut={event => event.preventDefault()}
      />
      {hasError && (
        <p className="mt-2 text-sm font-semibold text-red-600">
          Sai ký tự! Hãy gõ đúng ký tự để tiếp tục.
        </p>
      )}
    </div>
  );
};

export default TypingArea;