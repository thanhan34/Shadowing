import React, { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { ArrowLeft, ArrowRight, BarChart2, Check, ChevronLeft, ChevronRight, GitMerge, Headphones, Image, Info, Map, Mic, PieChart, Repeat, TrendingUp, Grid } from "react-feather";
import RetellParagraph from "./RetellParagraph";
import RetellSentence from "./RetellSentence";
import type { DescribeImageData } from "@/pages/describe-image-shadowing/[name]";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { describeImageTypes, DescribeImageType } from "../lib/describe-image-template";

const typeIcons = { line_chart: TrendingUp, bar_chart: BarChart2, pie_chart: PieChart, map: Map, process: GitMerge, picture: Image, table: Grid };

export default function DescribeImageShadowingComponent({ describeImageData }: { describeImageData: DescribeImageData }) {
  const [mode, setMode] = useState<"paragraph" | "sentence">("paragraph");
  const [count, setCount] = useState(0);
  const [imageType, setImageType] = useState<DescribeImageType>("line_chart");
  const content = describeImageData.variants[imageType];
  const selectedType = describeImageTypes.find(item => item.key === imageType)!;
  const SelectedIcon = typeIcons[imageType];

  return (
    <main className="di-main">
      <Head>
        <title>{describeImageData.name} - Describe Image Shadowing</title>
        <meta name="description" content="Luyện Describe Image với một template chung cho 7 loại hình. Nghe giọng Ryan, luyện từng câu hoặc cả đoạn và ghi nhớ với chế độ ẩn từ." />
      </Head>

      <Link href="/describe-image-shadowing" className="di-back"><ArrowLeft size={16} aria-hidden="true" /> Thư viện Describe Image</Link>
      <header className="di-header">
        <div>
          <p className="di-eyebrow"><Headphones size={16} aria-hidden="true" /> SPEAKING PRACTICE</p>
          <h1>Describe Image <span>Shadowing</span></h1>
          <p className="di-intro">Một template, mọi loại hình. Nghe mẫu, nói theo và từng bước làm chủ bài mô tả của bạn.</p>
        </div>
        <div className="di-meta" aria-label="Thông tin bài luyện">
          <span><Mic size={16} aria-hidden="true" /> Giọng Ryan</span>
          <span><Repeat size={16} aria-hidden="true" /> {content.sentences.length} câu luyện tập</span>
        </div>
      </header>

      <div className="di-layout">
        <aside className="di-sidebar" aria-label="Thiết lập bài luyện">
          <Card className="di-picker">
            <div className="di-section-title"><span className="di-step">01</span><div><h2>Chọn loại hình</h2><p>Lời và audio sẽ đổi tương ứng</p></div></div>
            <div className="di-type-grid" role="group" aria-label="Loại hình mô tả">
              {describeImageTypes.map(item => {
                const Icon = typeIcons[item.key];
                const active = imageType === item.key;
                return <Button key={item.key} variant="secondary" aria-pressed={active} className="di-type" onClick={() => { setImageType(item.key); setCount(0); }}>
                  <Icon size={20} aria-hidden="true" /><span>{item.label}</span>{active && <Check size={16} className="di-type-check" aria-hidden="true" />}
                </Button>;
              })}
            </div>
            <div className="di-opening" aria-live="polite"><span>CÂU MỞ ĐẦU</span><p>{content.sentences[0].text}</p></div>
          </Card>
          <Card className="di-guide">
            <h2><Headphones size={18} aria-hidden="true" /> Luyện tập hiệu quả</h2>
            <ol><li><span>1</span>Nghe mẫu để làm quen nhịp điệu.</li><li><span>2</span>Nói theo, giữ tốc độ và cách ngắt câu.</li><li><span>3</span>Ẩn dần từ để luyện ghi nhớ.</li></ol>
            <details><summary>Lưu ý khi áp dụng template</summary><p>Thay Topic, A, B, C, số liệu và keywords bằng thông tin thực tế. Chỉ dùng câu so sánh hoặc thay đổi theo thời gian khi hình có thông tin tương ứng.</p><p>Câu 2, 3, 4 và 9 dùng đúng map, process, picture hoặc table theo loại hình đã chọn. Ba loại biểu đồ dùng từ “chart”.</p></details>
          </Card>
        </aside>

        <section className="di-workspace" aria-labelledby="di-practice-title">
          <div className="di-workspace-heading"><div className="di-section-title"><span className="di-step">02</span><div><h2 id="di-practice-title">Nghe & nói theo</h2><p>Chọn cách luyện phù hợp với bạn</p></div></div><span className="di-current-type"><SelectedIcon size={16} aria-hidden="true" />{selectedType.label}</span></div>
          <div className="di-modebar">
            <div className="di-modes" role="group" aria-label="Chế độ luyện tập">
              <Button variant="tab" active={mode === "paragraph"} aria-pressed={mode === "paragraph"} onClick={() => { setMode("paragraph"); setCount(0); }}><Headphones size={16} aria-hidden="true" />Cả đoạn</Button>
              <Button variant="tab" active={mode === "sentence"} aria-pressed={mode === "sentence"} onClick={() => { setMode("sentence"); setCount(0); }}><Repeat size={16} aria-hidden="true" />Từng câu</Button>
            </div>
            <span className="di-mode-note">{mode === "paragraph" ? "Phát nối tiếp toàn bộ bài" : "Lặp lại một câu để luyện kỹ"}</span>
          </div>
          {mode === "sentence" && <nav className="di-sentence-nav" aria-label="Chuyển câu">
            <Button variant="secondary" disabled={count === 0} onClick={() => setCount(value => Math.max(0, value - 1))}><ChevronLeft size={18} aria-hidden="true" /><span>Câu trước</span></Button>
            <span role="status">Câu <strong>{count + 1}</strong> / {content.sentences.length}</span>
            <Button variant="secondary" disabled={count === content.sentences.length - 1} onClick={() => setCount(value => Math.min(content.sentences.length - 1, value + 1))}><span>Câu tiếp</span><ChevronRight size={18} aria-hidden="true" /></Button>
          </nav>}
          <div className="di-player">
            {mode === "paragraph" ? <RetellParagraph key={imageType} sentences={content.sentences} fullText={content.fullText} selectedVoice="ryan" /> : <RetellSentence key={`${imageType}-${count}`} sentence={content.sentences[count]} selectedVoice="ryan" />}
          </div>
          <p className="di-footnote"><Info size={16} aria-hidden="true" /> Đổi loại hình sẽ dừng audio cũ và đưa bài về câu đầu.</p>
          {mode === "paragraph" && <Button variant="secondary" className="di-start-sentence" onClick={() => { setMode("sentence"); setCount(0); }}>Muốn luyện chậm hơn? Thử từng câu <ArrowRight size={16} aria-hidden="true" /></Button>}
        </section>
      </div>
    </main>
  );
}