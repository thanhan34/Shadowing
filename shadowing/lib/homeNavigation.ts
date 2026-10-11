import { BookOpen, Edit3, Headphones, Image, Mic, PlayCircle } from 'react-feather';

export const HOME_PRACTICE_ITEMS = [
  { label: 'Shadowing', href: '/shadow', icon: Headphones, category: 'NGHE & NÓI', description: 'Lắng nghe, bắt chước ngữ điệu và luyện nói theo từng câu.', featured: true },
  { label: 'Read Aloud', href: '/readaloud', icon: Mic, category: 'ĐỌC & NÓI', description: 'Luyện đọc thành tiếng, phát âm rõ ràng và giữ nhịp nói tự nhiên.' },
  { label: 'Repeat Sentence', href: '/RepeatSentence', icon: PlayCircle, category: 'NGHE & NÓI', description: 'Rèn khả năng ghi nhớ và lặp lại câu sau khi nghe.' },
  { label: 'Write From Dictation', href: '/writefromdictation', icon: Edit3, category: 'NGHE & VIẾT', description: 'Luyện nghe chi tiết, chính tả và viết lại câu chính xác.' },
  { label: 'Retell Lecture', href: '/retell-lecture', icon: Headphones, category: 'NGHE & NÓI', description: 'Nắm bắt ý chính và luyện kể lại nội dung bài giảng.' },
  { label: 'Describe Image', href: '/describe-image-shadowing', icon: Image, category: 'QUAN SÁT & NÓI', description: 'Luyện cách tổ chức ý và mô tả thông tin trong hình ảnh.' },
  { label: 'Essay Library', href: '/essays', icon: BookOpen, category: 'ĐỌC & VIẾT', description: 'Khám phá bài luận tham khảo để học cách triển khai ý tưởng.' },
  { label: 'Ngữ pháp', href: '/grammar', icon: BookOpen, category: 'KIẾN THỨC NỀN', description: 'Củng cố cấu trúc câu và kiến thức nền tảng cho bài thi.' },
];

export const HOME_COMMUNITY_LINKS = [
  { label: 'Nhóm học PTE', description: 'Kết nối và trao đổi cùng cộng đồng.', href: 'https://www.facebook.com/groups/pteintensive' },
  { label: 'YouTube', description: 'Khám phá nội dung hướng dẫn luyện thi.', href: 'https://www.youtube.com/@andoan.pteintensive?sub_confirmation=1' },
  { label: 'Facebook', description: 'Theo dõi nội dung từ PTE Intensive.', href: 'https://www.facebook.com/pteintensive' },
];