export const ADMIN_NAV_GROUPS = [
  { label: 'Tài khoản & Shadowing', items: [
    { href: '/admin/students', label: 'Duyệt học viên & vai trò' },
    { href: '/admin', label: 'Thêm bài Shadowing' },
    { href: '/sentence', label: 'Xử lý câu Shadowing' },
  ] },
  { label: 'Write From Dictation', items: [
    { href: '/add-audio-sample', label: 'Thêm mẫu WFD' },
    { href: '/admin/wfd-challenges', label: 'WFD Weekly Challenge' },
    { href: '/AddAudioSample', label: 'Nhập mẫu WFD (bản khác)' },
    { href: '/AudioSampleList', label: 'Danh sách mẫu audio' },
    { href: '/EditAudioSamplePage', label: 'Chỉnh sửa mẫu WFD' },
  ] },
  { label: 'Read Aloud & Repeat Sentence', items: [
    { href: '/AddReadAloud', label: 'Thêm Read Aloud' },
    { href: '/EditReadAloudList', label: 'Chỉnh sửa Read Aloud' },
    { href: '/AddRepeatSentence', label: 'Thêm Repeat Sentence' },
    { href: '/EditRepeatSentenceList', label: 'Chỉnh sửa Repeat Sentence' },
  ] },
  { label: 'Nội dung & công cụ', items: [
    { href: '/essays-admin', label: 'Quản lý Essay' },
    { href: '/manage-questions', label: 'Quản lý câu hỏi' },
    { href: '/scraper', label: 'Công cụ lấy nội dung' },
  ] },
];