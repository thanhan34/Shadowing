import React, { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Copy, Headphones, Info, Mic, Repeat } from "react-feather";
import RetellParagraph from "./RetellParagraph";
import RetellSentence from "./RetellSentence";
import type { RetellLectureData } from "@/pages/retell-lecture/[name]";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { useStaffAccess } from "../hooks/useStaffAccess";

export default function RetellLectureShadowing({ retellData }: { retellData: RetellLectureData }) {
  const [mode, setMode] = useState<"paragraph" | "sentence">("paragraph");
  const [count, setCount] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");
  const isAdmin = useStaffAccess("admin");

  const copyTemplate = async () => {
    try {
      const template = retellData.sentences
        .map(sentence => sentence.text.trim())
        .filter(Boolean)
        .map(text => /[.!?]$/.test(text) ? text : `${text}.`)
        .join(" ");
      await navigator.clipboard.writeText(template);
      setCopyStatus("Đã sao chép template.");
    } catch {
      setCopyStatus("Không thể sao chép. Vui lòng kiểm tra quyền truy cập clipboard.");
    }
  };

  return (
    <main className="di-main">
      <Head>
        <title>{retellData.name} - Retell Lecture Shadowing</title>
        <meta name="description" content="Luyện Retell Lecture với giọng Ryan. Nghe cả đoạn, lặp từng câu, điều chỉnh tốc độ và ẩn từ để ghi nhớ template." />
      </Head>
      <Link href="/retell-lecture" className="di-back"><ArrowLeft size={16} aria-hidden="true" /> Thư viện Retell Lecture</Link>
      <header className="di-header">
        <div>
          <p className="di-eyebrow"><Headphones size={16} aria-hidden="true" /> SPEAKING PRACTICE</p>
          <h1>Retell Lecture <span>Shadowing</span></h1>
          <p className="di-intro">Nghe mẫu, nói theo và làm chủ khung bài kể lại bài giảng. Một template chung, một giọng đọc Ryan xuyên suốt.</p>
        </div>
        <div className="di-meta" aria-label="Thông tin bài luyện"><span><Mic size={16} aria-hidden="true" /> Giọng Ryan</span><span><Repeat size={16} aria-hidden="true" /> {retellData.sentences.length} câu luyện tập</span></div>
      </header>

      <div className="di-layout">
        <aside className="di-sidebar" aria-label="Hướng dẫn luyện Retell Lecture">
          <Card>
            <div className="di-section-title"><span className="di-step">01</span><div><h2>Template Retell Lecture</h2><p>Nghe và ghi nhớ cùng giọng Ryan</p></div></div>
            <div className="di-opening"><span>CÂU MỞ ĐẦU</span><p>{retellData.sentences[0].text}</p></div>
            <div className="rl-template-summary"><BookOpen size={18} aria-hidden="true" /><p>{retellData.sentences.length} câu nối tiếp: giới thiệu chủ đề, triển khai các ý chính và kết luận.</p></div>
            {isAdmin && <div className="rl-copy-template"><Button variant="secondary" onClick={copyTemplate}><Copy size={16} aria-hidden="true" /> Sao chép template</Button><p role="status">{copyStatus}</p></div>}
            <div className="rl-keywords"><span>CHỖ ĐIỀN THÔNG TIN</span><p>A · B · C · D · E · F · G · H</p><small>Thay các chữ cái bằng chủ đề và ý chính bạn nghe được trong bài giảng.</small></div>
          </Card>
          <Card className="di-guide">
            <h2><Headphones size={18} aria-hidden="true" /> Luyện tập hiệu quả</h2>
            <ol><li><span>1</span>Nghe cả đoạn để nắm nhịp và cách nối ý.</li><li><span>2</span>Lặp từng câu, chú ý phát âm và ngắt nghỉ.</li><li><span>3</span>Ẩn dần từ, tập kể lại bằng thông tin thực tế.</li></ol>
            <details><summary>Lưu ý khi áp dụng template</summary><p>Audio đọc các chữ cái A–H như chỗ điền. Khi tự nói, thay chúng bằng thông tin có trong bài giảng; không thêm ý không nghe được.</p><p>Đây là audio luyện template, không phải bản ghi bài giảng để làm bài thi thử.</p></details>
          </Card>
        </aside>

        <section className="di-workspace" aria-labelledby="rl-practice-title">
          <div className="di-workspace-heading"><div className="di-section-title"><span className="di-step">02</span><div><h2 id="rl-practice-title">Nghe & nói theo</h2><p>Chọn cách luyện phù hợp với bạn</p></div></div><span className="di-current-type"><Mic size={16} aria-hidden="true" /> Ryan</span></div>
          <div className="di-modebar">
            <div className="di-modes" role="group" aria-label="Chế độ luyện tập">
              <Button variant="tab" active={mode === "paragraph"} aria-pressed={mode === "paragraph"} onClick={() => { setMode("paragraph"); setCount(0); }}><Headphones size={16} aria-hidden="true" />Cả đoạn</Button>
              <Button variant="tab" active={mode === "sentence"} aria-pressed={mode === "sentence"} onClick={() => { setMode("sentence"); setCount(0); }}><Repeat size={16} aria-hidden="true" />Từng câu</Button>
            </div>
            <span className="di-mode-note">{mode === "paragraph" ? "Phát nối tiếp toàn bộ bài" : "Lặp lại một câu để luyện kỹ"}</span>
          </div>
          {mode === "sentence" && <nav className="di-sentence-nav" aria-label="Chuyển câu">
            <Button variant="secondary" disabled={count === 0} onClick={() => setCount(value => Math.max(0, value - 1))}><ChevronLeft size={18} aria-hidden="true" /><span>Câu trước</span></Button>
            <span role="status">Câu <strong>{count + 1}</strong> / {retellData.sentences.length}</span>
            <Button variant="secondary" disabled={count === retellData.sentences.length - 1} onClick={() => setCount(value => Math.min(retellData.sentences.length - 1, value + 1))}><span>Câu tiếp</span><ChevronRight size={18} aria-hidden="true" /></Button>
          </nav>}
          <div className="di-player">
            {mode === "paragraph" ? <RetellParagraph key={`${retellData.id}-paragraph`} sentences={retellData.sentences} fullText={retellData.fullText} selectedVoice="ryan" /> : <RetellSentence key={`${retellData.id}-${count}`} sentence={retellData.sentences[count]} selectedVoice="ryan" />}
          </div>
          <p className="di-footnote"><Info size={16} aria-hidden="true" /> Cả đoạn phát nối tiếp; từng câu lặp lại để bạn luyện đến khi thành thạo.</p>
          {mode === "paragraph" && <Button variant="secondary" className="di-start-sentence" onClick={() => { setMode("sentence"); setCount(0); }}>Muốn luyện chậm hơn? Thử từng câu <ArrowRight size={16} aria-hidden="true" /></Button>}
        </section>
      </div>
    </main>
  );
}