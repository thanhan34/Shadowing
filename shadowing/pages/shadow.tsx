import { GetServerSideProps } from 'next';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Head from 'next/head';
import { ArrowRight, Headphones, Mic, Search, RefreshCw } from 'react-feather';
import { getNextImage } from '../utils/background';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface Paragraph {
  id: string;
  text: string;
  url: string;
  name: string;
}

interface ShadowProps {
  initialData: Paragraph[];
}

const Shadow: React.FC<ShadowProps> = ({ initialData }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [arrayParagraph, setArrayParagraph] = useState<Paragraph[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [librarySize, setLibrarySize] = useState(initialData.length);
  const [reloadKey, setReloadKey] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [backgroundImage, setBackgroundImage] = useState('/rung.jpg');

  useEffect(() => {
    setBackgroundImage(getNextImage());
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchFilteredData = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
      const res = await fetch(`/api/shadowing`, { signal: controller.signal });
      if (!res.ok) throw new Error('Không thể kết nối thư viện. Vui lòng thử lại.');
      const data: Paragraph[] = await res.json();
      if (!Array.isArray(data)) throw new Error('Dữ liệu thư viện không hợp lệ.');
      // Filter data locally based on search query
      const filteredData = debouncedSearchQuery
        ? data.filter(item => item.name.toLowerCase().includes(debouncedSearchQuery.trim().toLowerCase()))
        : data;
      if (!controller.signal.aborted) {
        setArrayParagraph(filteredData);
        setLibrarySize(data.length);
      }
      } catch (error) {
        if (!controller.signal.aborted) setErrorMessage(error instanceof Error ? error.message : 'Không thể tải thư viện.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchFilteredData();
    return () => controller.abort();
  }, [debouncedSearchQuery, reloadKey]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchQuery = e.target.value;
    setSearchQuery(newSearchQuery);
  };

  return (
    <div className="shadow-library relative min-h-screen">
    <div className="shadow-photo-background" style={{ backgroundImage: `url(${backgroundImage})` }} aria-hidden="true" />
    <div className="relative z-10">
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <Head>
        <title>Shadowing - Bộ Công Cụ Luyện Tập PTE - Nâng Cao Kỹ Năng, Đạt Điểm Số Mơ Ước</title>
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
      <Card className="shadow-hero">
        <div>
          <span className="shadow-eyebrow"><Headphones size={16} aria-hidden="true" /> LISTEN & SPEAK / SHADOWING STUDIO</span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Nghe từng nhịp.<br /><span className="shadow-accent">Nói thật tự nhiên.</span></h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/70 sm:text-base">Luyện shadowing theo từng bài: lắng nghe, bắt nhịp và nhại lại. Tập trung vào cách nối âm, nhấn trọng âm và ngữ điệu của người nói.</p>
          <a href="#shadow-library" className="ui-button-primary accent-ring shadow-library-link mt-6 inline-flex items-center gap-3">Khám phá bài luyện<ArrowRight size={18} aria-hidden="true" /></a>
          <div className="shadow-hero-meta"><span><strong>{librarySize}</strong> bài trong thư viện</span><span>Nghe · Bắt nhịp · Nhại lại</span></div>
        </div>
        <div className="shadow-demo" role="img" aria-label="Minh họa luyện shadowing: nghe mẫu, bắt nhịp và nhại lại">
          <div className="shadow-demo-header"><span><Headphones size={16} /> NGHE MẪU</span><span className="shadow-demo-tag">01 / LISTEN</span></div>
          <div className="shadow-wave" aria-hidden="true">{Array.from({ length: 29 }, (_, i) => <i key={i} />)}</div>
          <p lang="en">Listen closely.<br /><strong>Find your rhythm.</strong></p>
          <div className="shadow-demo-footer"><span><Mic size={18} /> NHẠI LẠI</span><span>Nhịp điệu → Ngữ điệu</span></div>
        </div>
      </Card>
      <div className="shadow-steps" aria-label="Các bước luyện tập">{[['01', 'Lắng nghe', 'Chú ý nhịp và trọng âm.'], ['02', 'Bắt nhịp', 'Theo sát từng cụm ý.'], ['03', 'Nhại lại', 'Lặp lại và điều chỉnh.']].map(([number, title, description]) => <div key={number}><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></div>)}</div>
      <section id="shadow-library" aria-labelledby="shadow-library-heading" className="shadow-library-anchor">
        <Card className="shadow-tools">
          <div><span className="shadow-eyebrow">YOUR PRACTICE LIBRARY</span><h2 id="shadow-library-heading" className="mt-2 text-2xl font-semibold">Chọn bài. Bắt đầu luyện.</h2><p className="mt-2 text-sm text-white/70">Tìm bài theo tên và mở không gian luyện tập riêng.</p></div>
          <div className="shadow-search-controls"><label htmlFor="shadow-search" className="sr-only">Tìm bài Shadowing theo tên</label><div className="relative min-w-0 flex-1"><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/55" aria-hidden="true" /><Input id="shadow-search" type="search" value={searchQuery} onChange={handleSearchInputChange} placeholder="Tìm tên bài luyện…" className="w-full pl-12" /></div><Button variant="secondary" disabled={isLoading} onClick={() => setReloadKey(key => key + 1)} aria-label="Tải lại thư viện"><RefreshCw size={18} aria-hidden="true" /></Button></div>
        </Card>
        <div className="my-4 flex flex-wrap items-center justify-between gap-2 px-1"><h3 className="text-sm font-medium text-white/70">Bài luyện Shadowing</h3><p role="status" className="text-sm text-white/70">{isLoading || searchQuery !== debouncedSearchQuery ? 'Đang cập nhật…' : `${arrayParagraph.length} bài luyện`}</p></div>
        {errorMessage && <Card className="mb-4"><p role="alert" className="text-sm leading-6">{errorMessage}{arrayParagraph.length > 0 && ' Các bài đã tải vẫn có thể mở bên dưới.'}</p><Button variant="secondary" className="mt-4" disabled={isLoading} onClick={() => setReloadKey(key => key + 1)}>Thử lại</Button></Card>}
        <div aria-busy={isLoading || searchQuery !== debouncedSearchQuery}>
          {isLoading && arrayParagraph.length === 0 ? <div className="shadow-grid">{[0, 1, 2].map(i => <Card key={i} className="shadow-skeleton" aria-hidden="true"><div className="h-12 w-12 rounded-xl bg-white/10" /><div className="mt-6 h-5 w-2/3 rounded bg-white/10" /><div className="mt-4 h-4 w-full rounded bg-white/10" /></Card>)}</div> : arrayParagraph.length === 0 ? <Card className="py-12 text-center"><Search size={28} className="shadow-accent mx-auto mb-4" aria-hidden="true" /><h3 className="text-lg font-semibold">{debouncedSearchQuery ? 'Chưa tìm thấy bài phù hợp' : 'Chưa có bài luyện để hiển thị'}</h3><p className="mt-2 text-sm text-white/70">Thử tên bài khác hoặc tải lại thư viện.</p>{searchQuery && <Button variant="secondary" className="mt-4" onClick={() => setSearchQuery('')}>Xóa tìm kiếm</Button>}</Card> : <div className="shadow-grid">{arrayParagraph.map((item, index) => <Link key={item.id} href={`/shadowing/${encodeURIComponent(item.name)}`} className="shadow-lesson accent-ring"><div className="shadow-lesson-top"><span className="shadow-lesson-icon"><Headphones size={22} aria-hidden="true" /></span><span className="shadow-lesson-number">{String(index + 1).padStart(2, '0')}</span></div><h3>{item.name}</h3><p>Lắng nghe và luyện nói theo nhịp.</p><div className="shadow-lesson-bottom"><span>SHADOWING</span><span className="shadow-open">Mở bài luyện<ArrowRight size={18} aria-hidden="true" /></span></div></Link>)}</div>}
        </div>
      </section>
    </main>
    </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const { firebaseAdmin } = await import('../lib/firebaseAdmin');
  const snapshot = await firebaseAdmin().db.collection('shadowing').orderBy('name').get();
  const data = snapshot.docs.map(doc => ({ id: doc.id, text: doc.get('text') || '', url: doc.get('url') || '', name: doc.get('name') || '' }));
  return {
    props: {
      initialData: data,
    },
  };
};

export default Shadow;
