import type { GetServerSideProps } from "next";
import Link from "next/link";
import Head from "next/head";
import { ArrowLeft, ArrowRight, BarChart2, BookOpen, Check, EyeOff, GitMerge, Grid, Headphones, Image, Map, Mic, PieChart, Repeat, Sliders, TrendingUp } from "react-feather";
import { loadAudioData } from "../lib/describe-image-shadowing";
import { describeImageTypes } from "../lib/describe-image-template";
import AppShellBackground from "../components/ui/AppShellBackground";
import Card from "../components/ui/Card";

interface DescribeImageLibraryProps {
  sentenceCount: number;
  preview: { number: number; text: string }[];
}

const typeIcons = { line_chart: TrendingUp, bar_chart: BarChart2, pie_chart: PieChart, map: Map, process: GitMerge, picture: Image, table: Grid };
const practiceHref = "/describe-image-shadowing/practice";
const learningSteps = [
  { icon: Headphones, title: "Nghe để làm quen", description: "Nghe giọng Ryan, chú ý nhịp điệu và cách ngắt câu. Bắt đầu với cả đoạn để nắm khung bài." },
  { icon: Repeat, title: "Nói theo từng câu", description: "Chuyển sang từng câu để lặp lại phần chưa vững. Điều chỉnh tốc độ theo khả năng của bạn." },
  { icon: EyeOff, title: "Ẩn từ, luyện ghi nhớ", description: "Giảm dần gợi ý với chế độ ẩn từ, rồi tự thay chủ đề và thông tin phù hợp với hình." },
];

export default function DescribeImageShadowing({ sentenceCount, preview }: DescribeImageLibraryProps) {
  return (
    <AppShellBackground className="di-library">
      <Head>
        <title>Describe Image Shadowing - PTE Intensive</title>
        <meta name="description" content="Một template chung cho 7 loại hình Describe Image. Luyện shadowing với giọng Ryan, nghe cả đoạn, lặp từng câu và ẩn từ để ghi nhớ." />
      </Head>
      <main className="di-library-main">
        <Link href="/" className="di-back"><ArrowLeft size={16} aria-hidden="true" /> Trang chủ</Link>

        <header className="di-library-hero">
          <div className="di-library-copy">
            <p className="di-eyebrow"><Mic size={16} aria-hidden="true" /> PTE SPEAKING · DESCRIBE IMAGE</p>
            <h1>Một template.<br /><span>Tự tin mô tả mọi loại hình.</span></h1>
            <p className="di-library-intro">Luyện Describe Image bằng cách nghe và nói theo. Cùng một khung bài, audio phù hợp với từng loại hình và một giọng đọc Ryan xuyên suốt.</p>
            <div className="di-library-actions">
              <Link href={practiceHref} className="ui-button-primary accent-ring di-library-cta">Bắt đầu luyện tập <ArrowRight size={18} aria-hidden="true" /></Link>
              <a href="#di-how-to" className="ui-button-secondary accent-ring di-library-cta"><BookOpen size={16} aria-hidden="true" /> Cách luyện tập</a>
            </div>
            <dl className="di-library-stats" aria-label="Thông tin bài luyện">
              <div><dt>Template chung</dt><dd>01</dd></div>
              <div><dt>Loại hình</dt><dd>{String(describeImageTypes.length).padStart(2, "0")}</dd></div>
              <div><dt>Câu trong mỗi bài</dt><dd>{String(sentenceCount).padStart(2, "0")}</dd></div>
            </dl>
          </div>

          <Card className="di-library-preview">
            <div className="di-library-preview-heading"><span><Headphones size={18} aria-hidden="true" /> Xem trước template</span><span className="di-library-badge"><Mic size={12} aria-hidden="true" /> Ryan</span></div>
            <div className="di-library-chart" aria-hidden="true">
              <div className="di-library-chart-label"><TrendingUp size={16} /> LINE CHART</div>
              <svg viewBox="0 0 320 100" fill="none" focusable="false"><path className="di-library-gridline" d="M0 20H320M0 50H320M0 80H320" /><path className="di-library-chart-fill" d="M8 78L58 60L108 66L158 35L208 44L258 18L312 8V100H8Z" /><path className="di-library-chart-line" d="M8 78L58 60L108 66L158 35L208 44L258 18L312 8" /></svg>
            </div>
            <ol className="di-library-preview-lines" aria-label="Trích đoạn template Line chart">
              {preview.map(sentence => <li key={sentence.number}><span>{String(sentence.number).padStart(2, "0")}</span><p>{sentence.text}</p></li>)}
            </ol>
            <div className="di-library-preview-footer"><span><Check size={14} aria-hidden="true" /> Một khung bài xuyên suốt</span><span>{sentenceCount} câu / bài</span></div>
          </Card>
        </header>

        <Card className="di-library-types">
          <div className="di-library-section-heading"><div><p className="di-eyebrow">7 LOẠI HÌNH · 1 TEMPLATE</p><h2>Giữ khung bài, đổi đúng loại hình</h2></div><p>Chọn loại hình ngay trong trang luyện tập. Lời và audio sẽ đổi tương ứng.</p></div>
          <ul className="di-library-type-list" aria-label="Các loại hình được hỗ trợ">{describeImageTypes.map(item => {
            const Icon = typeIcons[item.key];
            return <li key={item.key}><Icon size={20} aria-hidden="true" /><span>{item.label}</span></li>;
          })}</ul>
        </Card>

        <section id="di-how-to" className="di-library-how" aria-labelledby="di-how-title">
          <div className="di-library-section-heading"><div><p className="di-eyebrow">BẮT ĐẦU THẬT ĐƠN GIẢN</p><h2 id="di-how-title">Từ nghe mẫu đến tự nói</h2></div><span className="di-library-badge"><Sliders size={14} aria-hidden="true" /> Chủ động tốc độ & mức gợi ý</span></div>
          <div className="di-library-step-grid">{learningSteps.map((step, index) => <Card key={step.title} className="di-library-step"><div className="di-library-step-top"><step.icon size={22} aria-hidden="true" /><span>0{index + 1}</span></div><h3>{step.title}</h3><p>{step.description}</p></Card>)}</div>
        </section>

        <Card className="di-library-ready"><div><h2>Sẵn sàng luyện nói cùng Ryan?</h2><p>Chọn loại hình, bật audio và bắt đầu từ câu đầu tiên.</p></div><Link href={practiceHref} className="ui-button-primary accent-ring di-library-cta">Vào phòng luyện tập <ArrowRight size={18} aria-hidden="true" /></Link></Card>
        <p className="di-library-note">Template là khung gợi ý. Khi tự nói, hãy thay chủ đề, số liệu và chi tiết bằng thông tin thực tế trong hình.</p>
      </main>
    </AppShellBackground>
  );
}

export const getServerSideProps: GetServerSideProps<DescribeImageLibraryProps> = async () => {
  try {
    const data = loadAudioData();
    return { props: {
      sentenceCount: data.sentences.length,
      preview: data.sentences.filter(sentence => [1, 2, 9].includes(sentence.number)).map(({ number, text }) => ({ number, text })),
    } };
  } catch (error) {
    console.error("Error loading Describe Image library:", error);
    return { notFound: true };
  }
};
