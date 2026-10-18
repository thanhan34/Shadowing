export function validateRepeatSentenceResources(audio: string, practiceUrl: string) {
  const audioUrl = audio.trim();
  const link = practiceUrl.trim();
  if (audioUrl) {
    try {
      const parsed = new URL(audioUrl);
      if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error();
    } catch {
      throw new Error("Audio URL phải là đường dẫn HTTPS hợp lệ.");
    }
  }
  if (link && !/^https:\/\/www\.apeuni\.com\/practice\/repeat_sentences\/[1-9]\d*$/.test(link)) {
    throw new Error("Practice link phải có dạng https://www.apeuni.com/practice/repeat_sentences/170.");
  }
  return { audioUrl, practiceUrl: link };
}