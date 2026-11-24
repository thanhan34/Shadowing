export type Word = { term: string; meaning: string; example: string; translation?: string; part?: string; imageUrl?: string; imageCaption?: string; definition?: string; ipaUK?: string; ipaUS?: string };
export type Deck = { topic: string; words: Word[] };

export const decks: Deck[] = [
  { topic: 'Education', words: [
    { term: 'campus', part: 'n.', meaning: 'khuôn viên trường', example: 'The new library is at the centre of the campus.', translation: 'Thư viện mới nằm ở trung tâm khuôn viên trường.' },
    { term: 'tuition', part: 'n.', meaning: 'sự giảng dạy', example: 'The college offers individual tuition in mathematics.', translation: 'Trường có các buổi dạy toán riêng cho từng học viên.' },
    { term: 'lecture', part: 'n.', meaning: 'bài giảng', example: 'The lecture introduced three ways to measure progress.', translation: 'Bài giảng giới thiệu ba cách đo lường sự tiến bộ.' },
    { term: 'scholarship', part: 'n.', meaning: 'học bổng', example: 'A scholarship covered her first year of study.', translation: 'Một suất học bổng đã chi trả chi phí cho năm học đầu tiên của cô ấy.' },
    { term: 'deadline', part: 'n.', meaning: 'hạn chót', example: 'The deadline for submitting the essay is Friday.', translation: 'Hạn chót nộp bài luận là thứ Sáu.' },
    { term: 'semester', part: 'n.', meaning: 'học kỳ', example: 'Students complete two projects each semester.', translation: 'Sinh viên hoàn thành hai dự án mỗi học kỳ.' },
  ] },
  { topic: 'Environment', words: [
    { term: 'habitat', part: 'n.', meaning: 'môi trường sống', example: 'The wetland provides a habitat for migrating birds.', translation: 'Vùng đất ngập nước là môi trường sống cho các loài chim di cư.' },
    { term: 'erosion', part: 'n.', meaning: 'sự xói mòn', example: 'Tree roots help prevent soil erosion.', translation: 'Rễ cây giúp ngăn đất bị xói mòn.' },
    { term: 'conservation', part: 'n.', meaning: 'sự bảo tồn', example: 'Local residents support forest conservation.', translation: 'Người dân địa phương ủng hộ việc bảo tồn rừng.' },
    { term: 'renewable', part: 'adj.', meaning: 'có thể tái tạo', example: 'The city is investing in renewable energy.', translation: 'Thành phố đang đầu tư vào năng lượng tái tạo.' },
    { term: 'drought', part: 'n.', meaning: 'hạn hán', example: 'The prolonged drought reduced crop yields.', translation: 'Đợt hạn hán kéo dài đã làm giảm năng suất cây trồng.' },
    { term: 'emission', part: 'n.', meaning: 'sự phát thải', example: 'The policy aims to reduce the emission of greenhouse gases.', translation: 'Chính sách này nhằm giảm sự phát thải khí nhà kính.' },
  ] },
];