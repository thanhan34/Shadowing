import Head from 'next/head';
import { useMemo, useState } from 'react';
import { BookOpen, Search } from 'react-feather';
import AppShellBackground from '../components/ui/AppShellBackground';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Tabs from '../components/ui/Tabs';
import { grammarSections, grammarTopics, GrammarTopic } from '../data/grammar';
import { filterGrammarSections } from '../lib/grammar';

const topicGroups: { title: string; keys: GrammarTopic[] }[] = [
  { title: '01 · Nền tảng từ loại', keys: ['nouns', 'verbs', 'adjectives', 'adverbs'] },
  { title: '02 · Tạo từ & mạo từ', keys: ['word-family', 'prefixes', 'articles'] },
  { title: '03 · Liên kết & cấu trúc câu', keys: ['conjunctions', 'parallelism', 'clause-markers', 'conjunctive-adverbs', 'relative-clauses'] },
];

const topicDetails: Record<GrammarTopic, { marker: string; description: string }> = {
  nouns: { marker: 'N', description: 'Vị trí · Hậu tố · Số ít & số nhiều' },
  verbs: { marker: 'V', description: 'Dạng động từ · Modal · Linking verbs' },
  adjectives: { marker: 'Adj', description: 'Tính chất · So sánh · Collocation' },
  adverbs: { marker: 'Adv', description: 'Mức độ · Cách thức · Chuyển ý' },
  'word-family': { marker: 'Wf', description: 'Biến đổi từ · Họ từ · Cách viết' },
  prefixes: { marker: 'Pre', description: 'Tiền tố · Nghĩa của từ gốc' },
  articles: { marker: 'The', description: 'Mạo từ xác định · Ngữ cảnh' },
  conjunctions: { marker: '&', description: 'FANBOYS · Logic giữa hai vế' },
  parallelism: { marker: '∥', description: 'Cấu trúc cân bằng · Thành phần tương ứng' },
  'clause-markers': { marker: 'Cl', description: 'Thời gian · Lý do · Điều kiện' },
  'conjunctive-adverbs': { marker: '→', description: 'Chuyển ý · Dấu câu · Liên kết' },
  'relative-clauses': { marker: 'Rel', description: 'Who / which / that · Rút gọn' },
};

export default function GrammarPage() {
  const [topic, setTopic] = useState<GrammarTopic>('nouns');
  const [query, setQuery] = useState('');
  const sections = useMemo(() => filterGrammarSections(grammarSections, topic, query), [topic, query]);
  const currentTopic = grammarTopics.find(item => item.key === topic)!;
  const topicSectionCount = grammarSections.filter(section => section.topic === topic).length;

  return (
    <AppShellBackground className="grammar-page">
      <Head>
        <title>Ngữ pháp PTE Reading | PTE Intensive</title>
        <meta name="description" content="Tra cứu từ loại, Word Family, FANBOYS, Parallelism, Clause Markers, Conjunctive Adverbs, mệnh đề quan hệ và mạo từ bằng tiếng Việt cho PTE Reading RWFIB & RFIB." />
      </Head>
      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-28 sm:px-6" lang="vi">
        <Card className="grammar-hero">
          <div className="grammar-hero-copy">
          <div className="flex items-center gap-2 text-sm font-semibold text-primaryHover">
            <BookOpen size={20} aria-hidden="true" /> PTE READING · RWFIB & RFIB
          </div>
          <span className="grammar-studio-label">YOUR GRAMMAR STUDIO</span>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Hiểu cấu trúc.<br /><span className="text-primaryHover">Tự tin điền từ.</span></h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-textGlass-secondary">Từ quy tắc đến từng ô trống. Chọn chủ đề, tra cứu ví dụ và nắm vững cấu trúc cho PTE Reading.</p>
          <a href="#grammar-library" className="grammar-hero-cta accent-ring">Khám phá thư viện <span aria-hidden="true">↗</span></a>
          <div className="grammar-hero-caption"><span /> Quy tắc dễ hiểu. Ví dụ thực tế. Tra cứu nhanh.</div>
          </div>
          <div className="grammar-hero-visual">
            <div className="grammar-orbit" aria-hidden="true" />
            <div className="grammar-example-card" aria-hidden="true">
              <div className="grammar-example-top"><span>GRAMMAR IN CONTEXT</span><span>01 / 12</span></div>
              <p>The key to success<br />is <strong>consistent</strong> practice.</p>
              <div className="grammar-example-annotation"><span>Adj</span><span>Tính từ bổ nghĩa cho danh từ</span></div>
              <div className="grammar-example-line" /><div className="grammar-example-line grammar-example-line-short" />
            </div>
          <div className="grammar-hero-stats" aria-label="Tổng quan thư viện">
            <div><strong>{grammarTopics.length}</strong><span>Chủ đề</span></div>
            <div><strong>{grammarSections.length}</strong><span>Mục kiến thức</span></div>
            <p>Quy tắc · Ví dụ · Mẹo làm bài</p>
          </div>
          </div>
        </Card>

        <div id="grammar-library" className="grammar-library-heading"><span className="grammar-eyebrow">HỌC THEO CHỦ ĐỀ</span><p>Một thư viện nhỏ. Nền tảng vững vàng.</p></div>
        <Card className="grammar-topic-picker">
          <details open className="grammar-topic-disclosure">
            <summary className="accent-ring">
              <span><span className="grammar-eyebrow">THƯ VIỆN NGỮ PHÁP</span><span className="grammar-picker-title">Chọn chủ đề học</span></span>
              <span className="grammar-picker-current">{currentTopic.label}</span>
              <span className="grammar-disclosure-arrow" aria-hidden="true">⌄</span>
            </summary>
            <div className="grammar-topic-groups">
              {topicGroups.map(group => <div key={group.title} className="grammar-topic-group">
                <h2>{group.title}</h2>
                <Tabs items={group.keys.map(key => ({ ...grammarTopics.find(item => item.key === key)!, ...topicDetails[key] }))} activeKey={topic} onChange={key => { setTopic(key as GrammarTopic); setQuery(''); }} className="grammar-topic-tabs" />
              </div>)}
            </div>
          </details>
        </Card>

        <Card className="grammar-search-panel">
          <div className="grammar-current-heading">
            <span className="grammar-eyebrow">GÓC HỌC TẬP / ĐANG TRA CỨU</span>
            <h2>{currentTopic.label}</h2>
            <span className="grammar-chip">{topicSectionCount} mục kiến thức</span>
          </div>
          <div className="grammar-search-fields">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="grammar-search" className="mb-2 block text-sm font-medium">Tìm trong {currentTopic.label.toLowerCase()}</label>
              <div className="relative">
                <Search size={18} className="grammar-search-icon" aria-hidden="true" />
                <Input id="grammar-search" type="search" className="grammar-search" placeholder="Nhập quy tắc, từ khóa hoặc ví dụ…" value={query} onChange={event => setQuery(event.target.value)} aria-describedby="grammar-search-hint" />
              </div>
            </div>
            {query && <Button variant="secondary" onClick={() => setQuery('')}>Xóa tìm kiếm</Button>}
          </div>
          <p id="grammar-search-hint" className="text-xs text-textGlass-secondary">Có thể tìm bằng tiếng Việt không dấu hoặc bằng ví dụ tiếng Anh. Chuyển nhóm sẽ xóa tìm kiếm.</p>
          </div>
        </Card>

        <div className="grammar-layout">
          <aside className="grammar-contents" aria-label="Mục lục ngữ pháp">
            <Card className="grammar-contents-card">
              <h2 className="font-bold">Trong chủ đề này</h2>
              <p className="mt-2 text-sm text-textGlass-secondary" role="status" aria-live="polite">{sections.length} mục kiến thức</p>
              <nav className="mt-4 grid gap-2" aria-label="Các mục kiến thức">
                {sections.map((section, index) => <a key={section.id} href={`#${section.id}`} className="grammar-toc-link accent-ring"><span className="grammar-toc-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{section.title.replace(/^[IVX]+\.\s*/, '')}</span></a>)}
              </nav>
              <p className="mt-6 border-t border-glass-border pt-4 text-sm leading-relaxed text-textGlass-secondary">Mẹo học: xác định từ loại → kiểm tra số ít / số nhiều → đối chiếu nghĩa và ngữ cảnh.</p>
            </Card>
          </aside>

          <div className="min-w-0 space-y-6" role="tabpanel" aria-label={currentTopic.label}>
            {sections.length === 0 ? (
              <Card className="grammar-empty-state">
                <Search size={32} aria-hidden="true" className="mx-auto mb-4 text-primaryHover" />
                <h2 className="text-xl font-bold">Không tìm thấy nội dung phù hợp</h2>
                <p className="my-4 text-textGlass-secondary">Thử từ khóa khác hoặc xóa tìm kiếm để xem toàn bộ chủ đề.</p>
                <Button onClick={() => setQuery('')}>Xem toàn bộ chủ đề</Button>
              </Card>
            ) : sections.map((section, index) => (
              <article key={section.id} id={section.id} className="grammar-section" aria-labelledby={`${section.id}-title`}>
                <Card className="grammar-lesson-card">
                  <div className="grammar-section-heading"><span className="grammar-section-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h2 id={`${section.id}-title`} className="text-xl font-bold sm:text-2xl">{section.title.replace(/^[IVX]+\.\s*/, '')}</h2></div>
                  <p className="mt-3 text-sm leading-relaxed text-textGlass-secondary">{section.description}</p>
                  {section.rows && section.headers && (
                    <div className="grammar-table-wrap accent-ring" tabIndex={0} role="region" aria-label={`Bảng ${section.title}`}>
                      <table className="grammar-table">
                        <caption className="sr-only">{section.title}</caption>
                        <thead><tr>{section.headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead>
                        <tbody>{section.rows.map((row, index) => (
                          <tr key={index}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row">{cell}</th> : <td key={cellIndex} data-label={section.headers![cellIndex]}>{cell}</td>)}</tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                  {section.notes && <div className="grammar-note">
                    <h3 className="mb-3 text-sm font-bold text-primaryHover">Ghi nhớ & lưu ý</h3>
                    <ul className="list-disc space-y-3 pl-4 text-sm leading-relaxed">{section.notes.map(note => <li key={note}>{note}</li>)}</ul>
                  </div>}
                </Card>
              </article>
            ))}
          </div>
        </div>
      </main>
    </AppShellBackground>
  );
}