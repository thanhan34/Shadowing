export const RS_AUDIO_VOICES = ["Ryan"] as const;
export type RepeatSentenceVoice = (typeof RS_AUDIO_VOICES)[number];

export interface RepeatSentenceAudioTarget {
  id: string;
  text: string;
  ID?: string;
  audio?: Record<string, string>;
  vietnameseTranslation?: string;
}

export const buildMissingRepeatSentenceAudioRows = (items: RepeatSentenceAudioTarget[]) =>
  items
    .filter((item) => !item.audio?.Ryan?.trim())
    .map((item) => ({
      ID: item.ID ?? "",
      "Document ID": item.id,
      "English Text": item.text.replace(/\//g, " ").replace(/\s+/g, " ").trim(),
      "Vietnamese Translation": item.vietnameseTranslation ?? "",
      "Has Ryan Audio": "No",
      Missing: "Audio",
      Visible: "Yes",
    }));

export interface RepeatSentenceUploadResult {
  name: string;
  status: "success" | "skipped" | "error";
  message: string;
}

export const normalizeRepeatSentenceAudioText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.,!?;:'"“”]/g, "")
    .replace(/[/_\s]+/g, " ")
    .trim();

export function parseRepeatSentenceAudioFilename(filename: string) {
  if (!/\.mp3$/i.test(filename)) return null;
  const parts = filename.replace(/\.mp3$/i, "").replace(/^\d+_/, "").split("_");
  const voice = RS_AUDIO_VOICES.find((name) => name.toLowerCase() === parts[0].toLowerCase());
  const text = parts.slice(1).join(" ").trim();
  return voice && normalizeRepeatSentenceAudioText(text) ? { voice, text } : null;
}

interface UploadDependencies {
  readAudio: (id: string) => Promise<Record<string, string>>;
  upload: (file: File, id: string, voice: RepeatSentenceVoice) => Promise<string>;
  save: (id: string, voice: RepeatSentenceVoice, url: string) => Promise<void>;
  onResult: (result: RepeatSentenceUploadResult, processed: number) => void;
}

export async function uploadRepeatSentenceAudioFiles(
  files: File[],
  items: RepeatSentenceAudioTarget[],
  dependencies: UploadDependencies
): Promise<RepeatSentenceUploadResult[]> {
  const targets = new Map<string, RepeatSentenceAudioTarget[]>();
  items.forEach((item) => {
    const key = normalizeRepeatSentenceAudioText(item.text);
    targets.set(key, [...(targets.get(key) ?? []), item]);
  });
  const results: RepeatSentenceUploadResult[] = [];

  // Sequential processing ensures duplicate files in one selection cannot overwrite a voice.
  for (const file of files) {
    let result: RepeatSentenceUploadResult;
    try {
      const parsed = parseRepeatSentenceAudioFilename(file.name);
      const matches = parsed ? targets.get(normalizeRepeatSentenceAudioText(parsed.text)) ?? [] : [];
      if (!parsed || file.size === 0) {
        result = { name: file.name, status: "error", message: "File rỗng hoặc tên file không hợp lệ. Dùng number_Ryan_Text.mp3 (chỉ hỗ trợ Ryan)." };
      } else if (matches.length !== 1) {
        result = {
          name: file.name,
          status: "skipped",
          message: matches.length === 0 ? "Không tìm thấy câu RS khớp nội dung." : "Nhiều câu RS trùng nội dung; bỏ qua để tránh gán nhầm.",
        };
      } else {
        const item = matches[0];
        const audio = await dependencies.readAudio(item.id);
        if (audio[parsed.voice]?.trim()) {
          result = { name: file.name, status: "skipped", message: `${parsed.voice} đã có audio; giữ nguyên.` };
        } else {
          const url = await dependencies.upload(file, item.id, parsed.voice);
          await dependencies.save(item.id, parsed.voice, url);
          result = { name: file.name, status: "success", message: `Đã lưu audio ${parsed.voice}.` };
        }
      }
    } catch (error) {
      result = { name: file.name, status: "error", message: error instanceof Error ? error.message : "Không thể upload hoặc lưu audio." };
    }
    results.push(result);
    dependencies.onResult(result, results.length);
  }
  return results;
}