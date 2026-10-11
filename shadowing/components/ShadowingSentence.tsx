import React, { useEffect, useState } from "react";
import Paragraph from "./Paragraph";
import Sentence from "./Sentence";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { ShadowingData } from "@/pages/shadowing/[name]";
import { ArrowLeft, Headphones, ChevronLeft, ChevronRight, ExternalLink } from "react-feather";
import Button from "./ui/Button";
import Link from "next/link";
import Head from "next/head";

interface Props {
  shadowingData: ShadowingData[];
}

const ShadowingSentence: React.FC<Props> = ({ shadowingData }) => {
  const [shadowingDocumentID, setShadowingDocumentID] = useState("");
  const [practice, setPractice] = useState("");
  const [arraySen, setArraySen] = useState<
    { id: string; text: string; url: string }[]
  >([]);
  const [mode, setMode] = useState(true);
  const [count, setCount] = useState(0);
  const [videoSource, setVideoSource] = useState("");
  const [sentence, setSentence] = useState("");
 
  useEffect(() => {
    if (!shadowingData.length) return;
    setVideoSource(shadowingData[0].url);
    setSentence(shadowingData[0].text);
    setShadowingDocumentID(shadowingData[0].id);
    setPractice(shadowingData[0].practice);
  }, [shadowingData]);
 
  const handleModeChange = () => {
    if (mode && arraySen.length === 0) {
      return;
    }
    setMode(!mode);
    setCount(0);
  };

  const handleBackClick = () => {
    if (count > 0) {
      setCount(count - 1);
    }
  };

  const handleNextClick = () => {
    if (arraySen.length > 0 && count + 1 < arraySen.length) {
      setCount(count + 1);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!shadowingDocumentID) return;

      try {
        const shadowingRef = collection(db, "shadowing");
        const sentenceRef = collection(
          shadowingRef,
          shadowingDocumentID,
          "sentence"
        );
        const q = query(sentenceRef, orderBy("timestamp"));
        const sentenceSnapshot = await getDocs(q);
        const data = sentenceSnapshot.docs.map((doc) => ({
          id: doc.id,
          text: doc.get("text"),
          url: doc.get("url"),
        }));
        setArraySen(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [shadowingDocumentID]);

  useEffect(() => {
    const selectedParagraphData = shadowingData.find(
      (data) => data.id === shadowingDocumentID
    );

    if (selectedParagraphData) {
      setSentence(selectedParagraphData.text);
      setVideoSource(selectedParagraphData.url);
      setPractice(selectedParagraphData.practice);
    }
  }, [shadowingData, shadowingDocumentID]);

  if (!shadowingData.length) {
    return (
      <div className="glass w-full max-w-5xl rounded-card p-6 text-center">
        <p className="text-sm text-white/70 sm:text-base">Không tìm thấy dữ liệu shadowing cho bài này.</p>
      </div>
    );
  }

  const cleanedName = shadowingData[0].name?.replace(/<!--|-->/g, "") ?? "Shadowing";
  const activeSentence = arraySen[count];
 
  return (
    <div className="shadow-detail-content z-10 w-full max-w-5xl font-mono">
      <Head>
        <title>{cleanedName} - Shadowing</title>
        <meta
          name="description"
          content="Công cụ Shadowing giúp bạn luyện tập hàng ngày nhằm cải thiện phát âm và phát triển thói quen đọc theo cụm từ. Sử dụng công cụ này để nâng cao kỹ năng nói và đạt được kết quả tối ưu với PTE Intensive."
        />
        <meta
          name="keywords"
          content="bộ công cụ PTE, luyện tập PTE, công cụ PTE, luyện thi PTE, bài tập PTE, tài liệu PTE, luyện PTE hiệu quả, nâng cao kỹ năng PTE, thi PTE đạt điểm cao"
        />
        <meta name="author" content="PTE Intensive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

        <Link href="/shadow" className="shadow-detail-back accent-ring">
          <ArrowLeft size={18} aria-hidden="true" />Thư viện Shadowing
        </Link>
      <div className="shadow-detail-header">
        <div className="shadow-detail-heading">
          <span className="shadow-detail-badge"><Headphones size={16} aria-hidden="true" /> SHADOWING STUDIO</span>
          <h1 className="shadow-detail-title">{cleanedName}</h1>
          <p className="shadow-detail-intro">Lắng nghe. Bắt nhịp. Nhại lại.</p>
        </div>
        <div className="shadow-detail-art" aria-hidden="true"><Headphones size={40} /><div>{Array.from({ length: 17 }, (_, index) => <i key={index} />)}</div><span>LISTEN · REPEAT · REFINE</span></div>
      </div>

      <section className="shadow-detail-workspace" aria-label="Không gian luyện Shadowing">
      <div className="shadow-detail-modebar">
        <span>{mode ? 'Toàn bộ đoạn văn' : 'Luyện từng câu'}</span>
        <span className="shadow-detail-badge">{mode ? 'PARAGRAPH MODE' : `Câu ${count + 1} / ${arraySen.length}`}</span>
      </div>

      {mode ? (
        <div className="shadow-detail-actions">
          {arraySen.length === 0 && (
            <p className="shadow-detail-notice">
              Chức năng 1 Sentence Mode chưa thể sử dụng được cho câu này.
            </p>
          )}

          <Button
            onClick={handleModeChange}
            disabled={arraySen.length === 0}
          >
            1 Sentence Mode
          </Button>

          {practice && (
            <a
              href={practice}
              className="ui-button-secondary accent-ring shadow-detail-practice"
              target="_blank"
              rel="noopener noreferrer"
            >
              Practice <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
        </div>
      ) : (
        <div className="shadow-detail-actions">
          <Button variant="secondary"
            onClick={handleModeChange}
          >
            Paragraph
          </Button>
          <Button variant="secondary"
            onClick={handleBackClick}
            disabled={count === 0}
          >
            <ChevronLeft size={18} aria-hidden="true" /> Back
          </Button>
          <Button
            onClick={handleNextClick}
            disabled={arraySen.length === 0 || count + 1 >= arraySen.length}
          >
            Next <ChevronRight size={18} aria-hidden="true" />
          </Button>
          <span className="shadow-detail-progress" role="status">
            {arraySen.length > 0 ? `${count + 1}/${arraySen.length}` : "0/0"}
          </span>
        </div>
      )}

      {mode ? (
        <Paragraph videoSource={videoSource} sentence={sentence} />
      ) : activeSentence ? (
        <Sentence videoSource={activeSentence.url} sentence={activeSentence.text} />
      ) : (
        <p className="text-sm text-white/70">Không có câu để hiển thị.</p>
      )}
      </section>
    </div>
  );
};

export default ShadowingSentence;
