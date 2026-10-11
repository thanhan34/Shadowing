import Head from "next/head";
import { getNextImage } from "../utils/background";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, ExternalLink, Headphones, Layers, Mic, Target } from 'react-feather';
import Card from '../components/ui/Card';
import { HOME_COMMUNITY_LINKS, HOME_PRACTICE_ITEMS } from '../lib/homeNavigation';

const Home: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState("/rung.jpg");
  useEffect(() => {
    setBackgroundImage(getNextImage());
  }, []);

  return (
    <div className="home-page relative min-h-screen">
      <div className="home-photo-background" style={{ backgroundImage: `url(${backgroundImage})` }} aria-hidden="true" />
      <Head>
        <title>Bộ Công Cụ Luyện Tập PTE - Nâng Cao Kỹ Năng, Đạt Điểm Số Mơ Ước</title>
        <meta
          name="description"
          content="Sử dụng bộ công cụ luyện tập PTE hiệu quả nhất, với các bài tập đa dạng, tài liệu cập nhật và lộ trình cá nhân hóa. Nâng cao kỹ năng nghe, nói, đọc, viết và đạt điểm số mơ ước với PTE Intensive."
        />
        <meta
          name="keywords"
          content="bộ công cụ PTE, luyện tập PTE, công cụ PTE, luyện thi PTE, bài tập PTE, tài liệu PTE, luyện PTE hiệu quả, nâng cao kỹ năng PTE, thi PTE đạt điểm cao"
        />
        <meta name="author" content="PTE Intensive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="home-main">
        <section id="home" aria-labelledby="home-title" className="home-hero">
          <div className="home-hero-copy">
            <span className="home-eyebrow"><span className="home-accent-dot" /> KHÔNG GIAN LUYỆN TẬP PTE</span>
            <h1 id="home-title">Luyện tập mỗi ngày.<br /><span>Tự tin hơn từng bước.</span></h1>
            <p className="home-intro">Rèn kỹ năng nghe, nói, đọc và viết trong một không gian. Chọn bài luyện phù hợp và bắt đầu hành trình của bạn cùng PTE Intensive.</p>
            <div className="home-hero-actions">
              <Link href="/shadow" className="ui-button-primary accent-ring home-cta">Bắt đầu luyện tập <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link href="#home-practice" className="ui-button-secondary accent-ring home-cta">Khám phá bài luyện <ArrowDown size={18} aria-hidden="true" /></Link>
            </div>
            <div className="home-skill-chips" aria-label="Kỹ năng luyện tập">{['Listening', 'Speaking', 'Reading', 'Writing'].map(skill => <span key={skill}><Check size={14} aria-hidden="true" />{skill}</span>)}</div>
            <p className="home-brand-motto">DẠY THỰC TÂM <span>·</span> HỌC THỰC CHẤT <span>·</span> THI THỰC TẾ</p>
          </div>
          <Card className="home-feature">
            <div className="home-feature-heading"><Image src="/logo1.png" alt="PTE Intensive" width={72} height={72} priority className="home-logo" /><span className="home-badge">GỢI Ý BẮT ĐẦU</span></div>
            <div className="home-feature-icon"><Headphones size={28} aria-hidden="true" /></div>
            <p className="home-eyebrow mt-6">SHADOWING STUDIO</p>
            <h2>Nghe kỹ hơn.<br />Nói tự nhiên hơn.</h2>
            <p className="home-feature-description">Luyện theo từng câu để làm quen với phát âm, ngữ điệu và nhịp nói tiếng Anh.</p>
            <div className="home-waveform" aria-hidden="true">{Array.from({ length: 32 }, (_, index) => <i key={index} />)}</div>
            <div className="home-feature-process"><span><Headphones size={16} aria-hidden="true" />Lắng nghe</span><ArrowRight size={14} aria-hidden="true" /><span><Mic size={16} aria-hidden="true" />Lặp lại</span><ArrowRight size={14} aria-hidden="true" /><span><Check size={16} aria-hidden="true" />Luyện tập</span></div>
            <Link href="/shadow" className="ui-button-secondary accent-ring home-cta mt-6 w-full">Khám phá Shadowing <ArrowRight size={18} aria-hidden="true" /></Link>
          </Card>
        </section>

        <section id="home-practice" aria-labelledby="home-practice-title" className="home-practice-section">
          <div className="home-section-heading"><div><p className="home-eyebrow">YOUR PRACTICE SPACE</p><h2 id="home-practice-title">Hôm nay, bạn muốn luyện gì?</h2><p>Chọn một kỹ năng. Bắt đầu từ một bài luyện.</p></div><span className="home-badge">8 công cụ luyện tập</span></div>
          <div className="home-practice-grid">{HOME_PRACTICE_ITEMS.map(item => <Link key={item.href} href={item.href} className={`home-practice-card accent-ring ${item.featured ? 'home-practice-featured' : ''}`}>
            <div className="home-card-top"><span className="home-card-icon"><item.icon size={22} aria-hidden="true" /></span><span className="home-card-category">{item.category}</span></div>
            <h3>{item.label}</h3><p>{item.description}</p><span className="home-card-link">Mở bài luyện <ArrowRight size={16} aria-hidden="true" /></span>
          </Link>)}</div>
        </section>

        <section aria-labelledby="home-steps-title" className="home-steps-section">
          <div className="home-section-heading"><div><p className="home-eyebrow">MAKE IT A HABIT</p><h2 id="home-steps-title">Một bước nhỏ. Một thói quen tốt.</h2><p>Không cần bắt đầu với tất cả. Hãy chọn điều bạn muốn cải thiện.</p></div></div>
          <div className="home-steps-grid">{[
            { icon: Target, title: 'Chọn kỹ năng', description: 'Xác định kỹ năng bạn muốn tập trung trong buổi luyện hôm nay.' },
            { icon: Headphones, title: 'Luyện có tập trung', description: 'Mở một bài luyện, lắng nghe hướng dẫn và thực hành từng phần.' },
            { icon: Layers, title: 'Lặp lại mỗi ngày', description: 'Quay lại những phần còn khó và duy trì nhịp luyện tập phù hợp.' },
          ].map((step, index) => <Card key={step.title} className="home-step"><div className="home-card-top"><step.icon size={22} className="text-primary" aria-hidden="true" /><span className="home-step-number">0{index + 1}</span></div><h3>{step.title}</h3><p>{step.description}</p></Card>)}</div>
        </section>

        <section aria-labelledby="home-community-title" className="home-community-section">
          <div className="home-section-heading"><div><p className="home-eyebrow">BETTER TOGETHER</p><h2 id="home-community-title">Bạn không học một mình.</h2><p>Kết nối với cộng đồng và khám phá thêm tài nguyên luyện PTE.</p></div></div>
          <div className="home-community-grid">{HOME_COMMUNITY_LINKS.map(item => <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="home-community-link accent-ring"><span><span className="block text-sm font-semibold">{item.label}</span><span className="mt-1 block text-xs text-textGlass-secondary">{item.description}</span></span><ExternalLink size={18} aria-hidden="true" /><span className="sr-only"> (mở tab mới)</span></a>)}</div>
        </section>
      </main>
      <footer className="home-footer"><span className="font-bold tracking-wide">PTE INTENSIVE</span><span>Dạy thực tâm · Học thực chất · Thi thực tế</span><a href="#home" className="accent-ring home-back-top">Về đầu trang <ArrowRight size={14} className="-rotate-90" aria-hidden="true" /></a></footer>
    </div>
  );
};

export default Home;
