import React, { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import Button from "../ui/Button";
import Input from "../ui/Input";

export interface HighlightRule {
  id: string;
  pattern: string;
  color: string;
}

const ENABLED_STORAGE_KEY = "readAloudHighlightEnabled";
const FIRESTORE_COLLECTION = "appConfig";
const FIRESTORE_DOC_ID = "readAloudHighlightRules";

const DEFAULT_RULES: HighlightRule[] = [
  { id: "default-s", pattern: "s", color: "#ff4d4d" },
  { id: "default-ed", pattern: "ed", color: "#38bdf8" },
  { id: "default-th", pattern: "th", color: "#facc15" },
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createRuleId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeRules = (rules: HighlightRule[]) =>
  rules
    .map((rule) => ({
      ...rule,
      pattern: rule.pattern.trim(),
      color: rule.color || "#ff4d4d",
    }))
    .filter((rule) => rule.pattern.length > 0)
    .sort((a, b) => b.pattern.length - a.pattern.length);

export const useReadAloudHighlightRules = () => {
  const [rules, setRules] = useState<HighlightRule[]>(DEFAULT_RULES);
  const [isHighlightEnabled, setIsHighlightEnabled] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedEnabled = window.localStorage.getItem(ENABLED_STORAGE_KEY);
      if (storedEnabled !== null) {
        setIsHighlightEnabled(storedEnabled === "true");
      }
    } catch {
      setRules(DEFAULT_RULES);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID),
      (snapshot) => {
        const firebaseRules = snapshot.data()?.rules;
        if (Array.isArray(firebaseRules)) {
          setRules(
            firebaseRules
              .map((rule) => ({
                id: typeof rule.id === "string" ? rule.id : createRuleId(),
                pattern: typeof rule.pattern === "string" ? rule.pattern : "",
                color: typeof rule.color === "string" ? rule.color : "#ff4d4d",
              }))
              .filter((rule) => rule.pattern.trim().length > 0)
          );
        }
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    window.localStorage.setItem(ENABLED_STORAGE_KEY, String(isHighlightEnabled));
  }, [hasHydrated, isHighlightEnabled]);

  const updateRules: React.Dispatch<React.SetStateAction<HighlightRule[]>> = (nextRulesAction) => {
    setRules((currentRules) => {
      const nextRules =
        typeof nextRulesAction === "function"
          ? nextRulesAction(currentRules)
          : nextRulesAction;

      void setDoc(
        doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID),
        {
          rules: nextRules,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return nextRules;
    });
  };

  return { rules, setRules: updateRules, isHighlightEnabled, setIsHighlightEnabled };
};

interface HighlightedReadAloudTextProps {
  text: string;
  rules: HighlightRule[];
}

export const HighlightedReadAloudText: React.FC<HighlightedReadAloudTextProps> = ({
  text,
  rules,
}) => {
  const activeRules = useMemo(() => normalizeRules(rules), [rules]);

  if (activeRules.length === 0) {
    return <>{text}</>;
  }

  const combinedRegex = new RegExp(
    activeRules.map((rule) => escapeRegExp(rule.pattern)).join("|"),
    "gi"
  );

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  text.replace(combinedRegex, (match, offset: number) => {
    if (offset > lastIndex) {
      parts.push(text.slice(lastIndex, offset));
    }

    const matchedRule = activeRules.find(
      (rule) => rule.pattern.toLowerCase() === match.toLowerCase()
    );

    parts.push(
      <span
        key={`${offset}-${match}`}
        style={{
          color: matchedRule?.color ?? "#ff4d4d",
        }}
      >
        {match}
      </span>
    );

    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
};

interface HighlightToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export const HighlightToggle: React.FC<HighlightToggleProps> = ({
  enabled,
  onEnabledChange,
}) => (
  <div className="flex flex-col gap-3 rounded-[22px] border border-white/12 bg-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-base font-semibold text-white sm:text-lg">Tô màu âm cần chú ý</h2>
      <p className="mt-1 text-sm text-white/60">
        Bật/tắt highlight ending sounds và âm khó trong đoạn Read Aloud.
      </p>
    </div>

    <button
      type="button"
      onClick={() => onEnabledChange(!enabled)}
      aria-pressed={enabled}
      className={`min-h-[44px] rounded-2xl border px-4 py-2 text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc5d01]/60 ${
        enabled
          ? "border-[#fc5d01]/55 bg-[#fc5d01]/20 text-[#ffd2b5] shadow-[0_0_18px_-8px_rgba(252,93,1,0.8)]"
          : "border-white/15 bg-white/5 text-white/65 hover:border-white/25 hover:text-white"
      }`}
    >
      {enabled ? "Đang bật" : "Đang tắt"}
    </button>
  </div>
);

interface HighlightRulesMenuProps {
  rules: HighlightRule[];
  onRulesChange: React.Dispatch<React.SetStateAction<HighlightRule[]>>;
}

export const HighlightRulesMenu: React.FC<HighlightRulesMenuProps> = ({
  rules,
  onRulesChange,
}) => {
  const [pattern, setPattern] = useState("");
  const [color, setColor] = useState("#ff4d4d");

  const addRule = () => {
    const trimmedPattern = pattern.trim();
    if (!trimmedPattern) return;

    onRulesChange((currentRules) => [
      ...currentRules,
      { id: createRuleId(), pattern: trimmedPattern, color },
    ]);
    setPattern("");
  };

  const updateRule = (id: string, nextRule: Partial<HighlightRule>) => {
    onRulesChange((currentRules) =>
      currentRules.map((rule) => (rule.id === id ? { ...rule, ...nextRule } : rule))
    );
  };

  const removeRule = (id: string) => {
    onRulesChange((currentRules) => currentRules.filter((rule) => rule.id !== id));
  };

  const resetRules = () => {
    onRulesChange(DEFAULT_RULES);
  };

  return (
    <div className="space-y-4 rounded-[22px] border border-white/12 bg-white/[0.06] p-4">
      <div>
        <h2 className="text-base font-semibold text-white sm:text-lg">Menu tô màu âm cần chú ý</h2>
        <p className="mt-1 text-sm text-white/60">
          Thêm chữ/cụm chữ và chọn màu. Ví dụ: nhập <span className="font-bold text-white">s</span>,
          chọn màu đỏ để tất cả chữ “s” trong đoạn RA được tô đỏ.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_88px_auto]">
        <Input
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
          placeholder="Nhập ending sound / âm khó, ví dụ: s, ed, th..."
        />
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          aria-label="Chọn màu highlight"
          className="h-[44px] w-full cursor-pointer rounded-2xl border border-white/20 bg-white/10 p-1 accent-ring"
        />
        <Button onClick={addRule} disabled={!pattern.trim()} className="w-full md:w-auto">
          Thêm
        </Button>
      </div>

      <div className="space-y-2">
        {rules.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
            Chưa có rule tô màu nào.
          </p>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:grid-cols-[1fr_72px_auto] sm:items-center"
            >
              <Input
                value={rule.pattern}
                onChange={(event) => updateRule(rule.id, { pattern: event.target.value })}
                aria-label="Pattern highlight"
              />
              <input
                type="color"
                value={rule.color}
                onChange={(event) => updateRule(rule.id, { color: event.target.value })}
                aria-label={`Màu cho ${rule.pattern}`}
                className="h-[44px] w-full cursor-pointer rounded-2xl border border-white/20 bg-white/10 p-1 accent-ring"
              />
              <button
                type="button"
                onClick={() => removeRule(rule.id)}
                className="min-h-[44px] rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/65 transition-all hover:-translate-y-0.5 hover:border-rose-300/40 hover:text-rose-200 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc5d01]/60"
              >
                Xóa
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {rules.map((rule) => (
          <span
            key={`preview-${rule.id}`}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold"
            style={{ color: rule.color }}
          >
            {rule.pattern || "(trống)"}
          </span>
        ))}
      </div>

      <Button variant="secondary" onClick={resetRules} className="w-full sm:w-auto">
        Reset ví dụ mặc định
      </Button>
    </div>
  );
};