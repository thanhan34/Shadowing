import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '../components/Navigation';
import { getNextImage } from '../utils/background';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';

interface Keyword {
  slot: string;
  value: string;
}

const EssaysAdminPage: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState('');
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [questionLink, setQuestionLink] = useState('');
  const [sampleEssayLink, setSampleEssayLink] = useState('');
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState<Keyword[]>([
    { slot: 'Topic', value: '' },
    { slot: 'Key 1', value: '' },
    { slot: 'Point 1', value: '' },
    { slot: 'Explanation 1', value: '' },
    { slot: 'Point 2', value: '' },
    { slot: 'Explanation 2', value: '' },
    { slot: 'Point 3', value: '' },
    { slot: 'Explanation 3', value: '' },
    { slot: 'Point 4', value: '' },
    { slot: 'Explanation 4', value: '' },
  ]);
  const [successMessage, setSuccessMessage] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [allEssays, setAllEssays] = useState<any[]>([]);

  useEffect(() => {
    setBackgroundImage(getNextImage());
    loadAllEssays();
  }, []);

  useEffect(() => {
    // Check if we're in edit mode whenever URL changes
    const urlParams = new URLSearchParams(window.location.search);
    const editEssayId = urlParams.get('edit');
    
    if (editEssayId) {
      loadEssayForEdit(editEssayId);
      // Scroll to top when editing
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [typeof window !== 'undefined' ? window.location.search : '']);

  const loadAllEssays = async () => {
    try {
      const essaysSnapshot = await getDocs(collection(db, 'essays'));
      const essaysList = essaysSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllEssays(essaysList);
    } catch (error) {
      console.error('Error loading essays:', error);
    }
  };

  const handleDeleteEssay = async (essayId: string) => {
    if (confirm('Bạn có chắc muốn xóa essay này?')) {
      try {
        await deleteDoc(doc(db, 'essays', essayId));
        setSuccessMessage('✅ Essay đã được xóa thành công!');
        loadAllEssays();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting essay:', error);
        setSuccessMessage('❌ Lỗi khi xóa essay.');
      }
    }
  };

  const loadEssayForEdit = async (essayId: string) => {
    try {
      const essayDoc = await getDoc(doc(db, 'essays', essayId));
      if (essayDoc.exists()) {
        const essayData = essayDoc.data();
        setEditId(essayId);
        setIsEditMode(true);
        setTitle(essayData.title);
        setQuestion(essayData.question || '');
        setQuestionLink(essayData.questionLink || '');
        setSampleEssayLink(essayData.sampleEssayLink || '');
        setContent(essayData.content);
        setKeywords(essayData.keywords);
      }
    } catch (error) {
      console.error('Error loading essay for edit:', error);
    }
  };

  const addKeywordRow = () => {
    setKeywords([...keywords, { slot: '', value: '' }]);
  };

  const removeKeywordRow = (index: number) => {
    const newKeywords = keywords.filter((_, i) => i !== index);
    setKeywords(newKeywords);
  };

  const updateKeyword = (index: number, field: 'slot' | 'value', value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index][field] = value;
    setKeywords(newKeywords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const essayData = {
      title,
      question,
      questionLink,
      sampleEssayLink,
      content,
      keywords: keywords.filter(k => k.slot && k.value),
      createdAt: new Date().toISOString(),
    };
    
    try {
      if (isEditMode && editId) {
        // Update existing essay in Firebase
        const essayRef = doc(db, 'essays', editId);
        await updateDoc(essayRef, {
          ...essayData,
          updatedAt: new Date().toISOString(),
        });
        
        setSuccessMessage('✅ Essay đã được cập nhật thành công!');
        
        // Redirect to essays list after 1 second
        setTimeout(() => {
          window.location.href = '/essays';
        }, 1000);
      } else {
        // Create new essay in Firebase
        await addDoc(collection(db, 'essays'), essayData);
        
        setSuccessMessage('✅ Essay đã được thêm thành công!');
        
        // Reload essays list
        await loadAllEssays();
        
        // Reset form
        setTitle('');
        setQuestion('');
        setQuestionLink('');
        setSampleEssayLink('');
        setContent('');
        setKeywords([
          { slot: 'Topic', value: '' },
          { slot: 'Key 1', value: '' },
          { slot: 'Point 1', value: '' },
          { slot: 'Explanation 1', value: '' },
          { slot: 'Point 2', value: '' },
          { slot: 'Explanation 2', value: '' },
          { slot: 'Point 3', value: '' },
          { slot: 'Explanation 3', value: '' },
          { slot: 'Point 4', value: '' },
          { slot: 'Explanation 4', value: '' },
        ]);
      }
    } catch (error) {
      console.error('Error saving essay:', error);
      setSuccessMessage('❌ Lỗi khi lưu essay. Vui lòng thử lại.');
    }

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const loadSampleData = () => {
    setTitle('The Benefits of Remote Work');
    setQuestion('Some people believe that working from home is more productive than working in an office. Others think that office environments are better for collaboration and productivity. Discuss both views and give your own opinion.');
    setQuestionLink('https://example.com/question-remote-work');
    setSampleEssayLink('https://example.com/sample-essay-remote-work');
    setContent(`Remote work has become increasingly prevalent in modern professional environments. Many organizations have adopted flexible work arrangements that allow employees to perform their duties from home or other locations outside traditional office settings.

One of the primary benefits is improved work-life balance. Employees can better manage personal responsibilities while maintaining professional productivity, leading to higher job satisfaction and reduced stress levels.

Additionally, remote work eliminates commuting time, which saves money and reduces environmental impact. Workers can reclaim hours previously spent in traffic, using that time for productive activities or personal wellness.

However, social isolation remains a concern for remote workers. Limited face-to-face interaction with colleagues can lead to feelings of disconnection from the company culture and team dynamics.

Furthermore, home distractions can impact productivity. Without proper boundaries between work and personal spaces, some employees struggle to maintain focus and achieve their professional goals.

In conclusion, while remote work offers significant advantages in terms of flexibility and cost savings, organizations must address challenges related to social connection and work environment optimization.`);
    setKeywords([
      { slot: 'topic', value: 'remote work' },
      { slot: 'key1', value: 'professional environments' },
      { slot: 'point 1', value: 'improved work-life balance' },
      { slot: 'explanation 1', value: 'better manage personal responsibilities' },
      { slot: 'point 2', value: 'eliminates commuting time' },
      { slot: 'explanation 2', value: 'saves money and reduces environmental impact' },
      { slot: 'point 3', value: 'social isolation' },
      { slot: 'explanation 3', value: 'limited face-to-face interaction' },
      { slot: 'point 4', value: 'home distractions' },
      { slot: 'explanation 4', value: 'impact productivity' },
    ]);
  };

  return (
    <main
      className="bg-cover bg-center bg-fixed flex mx-auto min-h-screen flex-col items-center w-full p-4 sm:p-6 space-y-5"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Head>
        <title>Add Essay - Essay Library Admin</title>
        <meta name="description" content="Add new essays to the library" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <Link href="/" className="flex justify-center">
        <Image
          src="/logo1.png"
          alt="Logo"
          width={150}
          height={150}
          className="sm:w-32 sm:h-32 lg:w-40 lg:h-40"
        />
      </Link>

      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Chỉnh Sửa Essay' : 'Thêm Essay Mới'}
          </h1>
          <Link
            href="/essays"
            className="px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors"
          >
            ← Quay lại Essay Library
          </Link>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-green-800 font-semibold">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white bg-opacity-90 backdrop-blur-lg rounded-lg shadow-lg p-6 sm:p-8 dark:bg-gray-800 dark:bg-opacity-90">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-gray-900 dark:text-white font-semibold mb-2">
              Tiêu đề Essay <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ví dụ: The Role of Formal Written Examinations in Education"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#fc5d01] focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Question */}
          <div className="mb-6">
            <label className="block text-gray-900 dark:text-white font-semibold mb-2">
              Câu hỏi đề bài (Essay Question)
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Some people think that formal written examinations are the best way to assess students. Others believe continuous assessment through coursework is more effective. Discuss both views and give your own opinion."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#fc5d01] focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Question Link */}
          <div className="mb-6">
            <label className="block text-gray-900 dark:text-white font-semibold mb-2">
              Link đến đề bài (Question Link)
            </label>
            <input
              type="url"
              value={questionLink}
              onChange={(e) => setQuestionLink(e.target.value)}
              placeholder="https://example.com/question-link"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#fc5d01] focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Sample Essay Link */}
          <div className="mb-6">
            <label className="block text-gray-900 dark:text-white font-semibold mb-2">
              Link bài mẫu (Sample Essay Link)
            </label>
            <input
              type="url"
              value={sampleEssayLink}
              onChange={(e) => setSampleEssayLink(e.target.value)}
              placeholder="https://example.com/sample-essay-link"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#fc5d01] focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-gray-900 dark:text-white font-semibold mb-2">
              Nội dung Essay <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              💡 Tip: Tách các đoạn văn bằng 2 dòng trống (nhấn Enter 2 lần)
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={15}
              placeholder="Nhập nội dung essay... Mỗi đoạn văn cách nhau bởi 2 dòng trống."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#fc5d01] focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
            />
          </div>

          {/* Keywords Table */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-gray-900 dark:text-white font-semibold">
                Keywords (Từ khóa) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addKeywordRow}
                className="px-3 py-1 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors text-sm"
              >
                + Thêm keyword
              </button>
            </div>
            
            <div className="overflow-x-auto border-2 border-gray-300 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#fdbc94]">
                    <th className="px-3 py-2 text-left font-semibold text-gray-900">Slot</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900">Value</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-900 w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((keyword, index) => (
                    <tr key={index} className="border-t border-gray-300">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={keyword.slot}
                          onChange={(e) => updateKeyword(index, 'slot', e.target.value)}
                          placeholder="topic, key1, point 1..."
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:border-[#fc5d01] focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={keyword.value}
                          onChange={(e) => updateKeyword(index, 'value', e.target.value)}
                          placeholder="keyword value..."
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:border-[#fc5d01] focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        {keywords.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeKeywordRow(index)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-[#fc5d01] text-white font-semibold rounded-lg hover:bg-[#fd7f33] transition-colors"
            >
              {isEditMode ? '✏️ Cập Nhật Essay' : '💾 Lưu Essay'}
            </button>
            
            {!isEditMode && (
              <button
                type="button"
                onClick={loadSampleData}
                className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
              >
                📝 Load Sample Data
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm('Bạn có chắc muốn xóa toàn bộ form?')) {
                  setTitle('');
                  setQuestion('');
                  setQuestionLink('');
                  setSampleEssayLink('');
                  setContent('');
                  setKeywords([
                    { slot: 'Topic', value: '' },
                    { slot: 'Key 1', value: '' },
                    { slot: 'Point 1', value: '' },
                    { slot: 'Explanation 1', value: '' },
                    { slot: 'Point 2', value: '' },
                    { slot: 'Explanation 2', value: '' },
                    { slot: 'Point 3', value: '' },
                    { slot: 'Explanation 3', value: '' },
                    { slot: 'Point 4', value: '' },
                    { slot: 'Explanation 4', value: '' },
                  ]);
                  setIsEditMode(false);
                  setEditId(null);
                  window.history.pushState({}, '', '/essays-admin');
                }
              }}
              className="px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
            >
              🗑️ Clear Form
            </button>
            
            {isEditMode && (
              <Link
                href="/essays"
                className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors inline-flex items-center"
              >
                ✕ Hủy
              </Link>
            )}
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-[#fedac2] bg-opacity-90 backdrop-blur-lg rounded-lg">
          <h3 className="font-bold text-gray-900 mb-2">📌 Hướng dẫn:</h3>
          <ul className="text-sm text-gray-800 space-y-1 list-disc list-inside">
            <li>Các keywords sẽ tự động được in đậm trong nội dung essay</li>
            <li>Tách đoạn văn bằng cách nhấn Enter 2 lần (để có dòng trống giữa các đoạn)</li>
            <li>Slot mặc định: Topic, Key 1, Point 1-4, Explanation 1-4</li>
            <li>Essay được lưu vào Firebase Firestore</li>
          </ul>
        </div>

        {/* Danh sách Essays hiện có */}
        {allEssays.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📚 Danh sách Essays ({allEssays.length})
            </h2>
            <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden dark:bg-gray-800 dark:bg-opacity-90">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#fdbc94]">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Tiêu đề</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Keywords</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allEssays.map((essay, index) => (
                      <tr key={essay.id} className={`border-t border-gray-300 ${index % 2 === 0 ? 'bg-[#fedac2] bg-opacity-10' : ''}`}>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                          {essay.title}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-sm">
                          {essay.keywords?.length || 0} keywords
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                window.location.href = `/essays-admin?edit=${essay.id}`;
                              }}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEssay(essay.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default EssaysAdminPage;
