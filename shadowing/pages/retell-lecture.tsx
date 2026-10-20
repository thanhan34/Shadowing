import type { GetServerSideProps } from "next";
import Link from "next/link";
import Head from "next/head";
import { ArrowLeft, ArrowRight, BookOpen, Check, EyeOff, Headphones, List, Mic, Repeat, Sliders } from "react-feather";
import { loadAudioData } from "../lib/retell-lecture";
import AppShellBackground from "../components/ui/AppShellBackground";
import Card from "../components/ui/Card";

interface RetellLectureLibraryProps {
  sentenceCount: number;
  preview: { number: number; text: string }[];
}

const practiceHref = "/retell-lecture/practice";
const learningSteps = [
  { icon: Headphones, title: "Nghe để làm quen", description: "Nghe giọng Ryan, chú ý nhịp điệu và cách ngắt câu. Bắt đầu với cả đoạn để nắm khung bài." },
  { icon: Repeat, title: "Nói theo từng câu", description: "Lặp lại từng câu chưa vững và điều chỉnh tốc độ. Tập nối các ý một cách rõ ràng, liền mạch." },
  { icon: EyeOff, title: "Ẩn từ, luyện ghi nhớ", description: "Giảm dần gợi ý với chế độ ẩn từ. Khi tự nói, thay A–H bằng chủ đề và ý chính trong bài giảng." },
];
const templateParts = [
  { icon: Mic, title: "Mở bài", description: "Giới thiệu chủ đề người nói đề cập." },
  { icon: List, title: "Triển khai ý chính", description: "Nối các thông tin quan trọng bằng từ chuyển ý." },
  { icon: Check, title: "Kết luận", description: "Khép lại bằng điểm chính của bài giảng." },
];

export default function RetellLecture({ sentenceCount, preview }: RetellLectureLibraryProps) {
  return (
    <AppShellBackground className="di-library rl-library">
      <Head>
        <title>Retell Lecture Shadowing - PTE Intensive</title>
        <meta name="description" content="Luyện Retell Lecture với một template chung và giọng Ryan. Nghe cả đoạn, lặp từng câu và ẩn từ để ghi nhớ cách kể lại bài giảng." />
      </Head>
      <main className="di-library-main">
        <Link href="/" className="di-back"><ArrowLeft size={16} aria-hidden="true" /> Trang chủ</Link>
        <header className="di-library-hero">
          <div className="di-library-copy">
            <p className="di-eyebrow"><Mic size={16} aria-hidden="true" /> PTE SPEAKING · RETELL LECTURE</p>
            <h1>Một template.<br /><span>Tự tin kể lại bài giảng.</span></h1>
            <p className="di-library-intro">Luyện Retell Lecture bằng cách nghe và nói theo. Làm quen với khung bài, cách nối ý và nhịp nói cùng một giọng đọc Ryan xuyên suốt.</p>
            <div className="di-library-actions">
              <Link href={practiceHref} className="ui-button-primary accent-ring di-library-cta">Bắt đầu luyện tập <ArrowRight size={18} aria-hidden="true" /></Link>
              <a href="#rl-how-to" className="ui-button-secondary accent-ring di-library-cta"><BookOpen size={16} aria-hidden="true" /> Cách luyện tập</a>
            </div>
            <dl className="di-library-stats" aria-label="Thông tin bài luyện">
              <div><dt>Template chung</dt><dd>01</dd></div>
              <div><dt>Câu luyện tập</dt><dd>{String(sentenceCount).padStart(2, "0")}</dd></div>
              <div><dt>Giọng đọc</dt><dd>Ryan</dd></div>
            </dl>
          </div>
          <Card className="di-library-preview">
            <div className="di-library-preview-heading"><span><Headphones size={18} aria-hidden="true" /> Xem trước template</span><span className="di-library-badge"><Mic size={12} aria-hidden="true" /> Ryan</span></div>
            <div className="rl-library-audio-art" aria-hidden="true"><span><Headphones size={16} /> RETELL LECTURE</span><div className="rl-library-wave">{Array.from({ length: 32 }, (_, index) => <i key={index} />)}</div><p>Nghe mẫu · Nói theo · Ghi nhớ</p></div>
            <ol className="di-library-preview-lines" aria-label="Trích đoạn template Retell Lecture">{preview.map(sentence => <li key={sentence.number}><span>{String(sentence.number).padStart(2, "0")}</span><p>{sentence.text}</p></li>)}</ol>
            <div className="di-library-preview-footer"><span><Check size={14} aria-hidden="true" /> Một khung bài xuyên suốt</span><span>{sentenceCount} câu / bài</span></div>
          </Card>
        </header>

        <Card>
          <div className="di-library-section-heading"><div><p className="di-eyebrow">MỘT KHUNG BÀI RÕ RÀNG</p><h2>Từ chủ đề đến các ý chính</h2></div><p>Ghi nhớ cấu trúc, rồi thay các chỗ điền A–H bằng thông tin thực tế bạn nghe được.</p></div>
          <ul className="rl-library-structure" aria-label="Cấu trúc template">{templateParts.map(part => <li key={part.title}><part.icon size={20} aria-hidden="true" /><div><h3>{part.title}</h3><p>{part.description}</p></div></li>)}</ul>
        </Card>

        <section id="rl-how-to" className="di-library-how" aria-labelledby="rl-how-title">
          <div className="di-library-section-heading"><div><p className="di-eyebrow">BẮT ĐẦU THẬT ĐƠN GIẢN</p><h2 id="rl-how-title">Từ nghe mẫu đến tự nói</h2></div><span className="di-library-badge"><Sliders size={14} aria-hidden="true" /> Chủ động tốc độ & mức gợi ý</span></div>
          <div className="di-library-step-grid">{learningSteps.map((step, index) => <Card key={step.title} className="di-library-step"><div className="di-library-step-top"><step.icon size={22} aria-hidden="true" /><span>0{index + 1}</span></div><h3>{step.title}</h3><p>{step.description}</p></Card>)}</div>
        </section>
        <Card className="di-library-ready"><div><h2>Sẵn sàng luyện nói cùng Ryan?</h2><p>Bật audio, bắt đầu từ câu đầu và luyện theo nhịp của bạn.</p></div><Link href={practiceHref} className="ui-button-primary accent-ring di-library-cta">Vào phòng luyện tập <ArrowRight size={18} aria-hidden="true" /></Link></Card>
        <p className="di-library-note">Đây là audio luyện template, không phải bài giảng thi thử. Khi tự kể lại, chỉ dùng thông tin có trong bài giảng và thay các chữ cái A–H bằng nội dung phù hợp.</p>
      </main>
    </AppShellBackground>
  );
}

export const getServerSideProps: GetServerSideProps<RetellLectureLibraryProps> = async () => {
  try {
    const data = loadAudioData();
    const selectedNumbers = [1, 2, data.sentences.length];
    return { props: {
      sentenceCount: data.sentences.length,
      preview: data.sentences.filter(sentence => selectedNumbers.includes(sentence.number)).map(({ number, text }) => ({ number, text })),
    } };
  } catch (error) {
    console.error("Error loading Retell Lecture library:", error);
    return { notFound: true };
  }
};