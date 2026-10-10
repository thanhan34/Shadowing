import { useEffect, useState } from 'react';
import Head from 'next/head';
import AppShellBackground from '../../components/ui/AppShellBackground';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import type { MasteryDetail, MasteryStudent } from '../../lib/wfd/adminMastery';

const date = (time: number) => time ? new Date(time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa có dữ liệu';
const filters = [{ key: 'all', label: 'Tất cả' }, { key: 'new', label: 'Chưa luyện' }, { key: 'due', label: 'Đến hạn ôn' }, { key: 'overdue', label: 'Quá hạn ôn' }];

export default function AdminWfdMastery() {
  const [users, setUsers] = useState<MasteryStudent[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState<MasteryDetail | null>(null);
  const [questionFilter, setQuestionFilter] = useState('all');
  const [questionQuery, setQuestionQuery] = useState('');
  const [questionPage, setQuestionPage] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true); setError(''); setDetail(null);
    const params = selected ? `userId=${encodeURIComponent(selected)}` : `offset=${offset}&query=${encodeURIComponent(query)}`;
    fetch(`/api/admin/wfd-mastery?${params}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Không thể tải mastery.');
        if (controller.signal.aborted) return;
        if (selected) setDetail(data);
        else { setUsers(data.users); setTotal(data.total); }
      }).catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [offset, query, selected, revision]);
  const visible = users.filter(user => filter === 'all' || (filter === 'new' ? !user.stats.practicedCount : filter === 'due' ? user.stats.dueReviewCount > 0 : user.stats.overdueReviewCount > 0));
  const questions = (detail?.questions || []).filter(question => {
    const p = question.progress;
    const matches = questionFilter === 'all' || (questionFilter === 'new' ? !p : questionFilter === 'mastered' ? p?.mastered : questionFilter === 'learning' ? p && !p.mastered : questionFilter === 'due' ? p && p.nextReviewAt <= detail!.now : p && p.nextReviewAt + 86400000 <= detail!.now);
    return matches && `${question.id} ${question.text}`.toLowerCase().includes(questionQuery.toLowerCase().trim());
  }).sort((a, b) => (a.progress?.nextReviewAt ?? Infinity) - (b.progress?.nextReviewAt ?? Infinity) || a.id.localeCompare(b.id));
  function openStudent(id: string) { setBusy(true); setSelected(id); setQuestionPage(0); setQuestionFilter('all'); setQuestionQuery(''); }
  return <AppShellBackground><Head><title>WFD Mastery học viên · PTE Intensive</title></Head>
    <main className="mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-32 text-textGlass-primary sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="mb-2 text-sm font-semibold text-primary">QUẢN TRỊ · WRITE FROM DICTATION</p><h1 className="text-2xl font-bold sm:text-3xl">WFD Mastery học viên</h1><p className="mt-2 text-sm text-textGlass-secondary">Theo dõi mức thành thạo và lịch ôn. Chỉ xem, không thay đổi tiến độ học viên.</p></div>
        <Button variant="secondary" disabled={busy} onClick={() => { setBusy(true); setRevision(value => value + 1); }}>Làm mới</Button>
      </header>
      {selected && <Button variant="secondary" onClick={() => { setBusy(true); setSelected(''); }}>← Danh sách học viên</Button>}
      {!selected && <Card className="space-y-4 p-4 sm:p-6">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={event => { event.preventDefault(); setBusy(true); setOffset(0); setQuery(search.trim()); setRevision(value => value + 1); }}>
          <label className="flex-1"><span className="sr-only">Tìm theo tên hoặc email</span><Input type="search" maxLength={200} value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm tên hoặc email trong toàn bộ tài khoản…" className="w-full" /></label>
          <Button type="submit" disabled={busy}>Tìm kiếm</Button>
        </form>
        <Tabs items={filters} activeKey={filter} onChange={setFilter} />
        <p className="text-xs text-textGlass-secondary">Bộ lọc trạng thái áp dụng cho 20 tài khoản trên trang hiện tại. Bao gồm tài khoản quản trị/hỗ trợ, có ghi rõ vai trò.</p>
      </Card>}
      <section aria-busy={busy} aria-label="Dữ liệu mastery">
        {busy ? <Card className="p-6"><p role="status">Đang tải mastery…</p></Card> : error ? <Card className="space-y-4 p-6"><p role="alert">{error}</p><Button onClick={() => { setBusy(true); setRevision(value => value + 1); }}>Thử lại</Button></Card> : selected && detail ? <div className="space-y-6">
          <Card className="space-y-4 p-4 sm:p-6">
            <div><h2 className="break-words text-xl font-bold">{detail.student.name}</h2><p className="break-all text-sm text-textGlass-secondary">{detail.student.email} · {detail.student.role}</p></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
              ['Mastery', `${detail.student.stats.masteryRate.toFixed(1)}%`],
              ['Mastered / tổng câu', `${detail.student.stats.masteredCount} / ${detail.student.stats.total}`],
              ['Đã luyện / chưa luyện', `${detail.student.stats.practicedCount} / ${detail.student.stats.total - detail.student.stats.practicedCount}`],
              ['Đến hạn / quá hạn ≥ 24h', `${detail.student.stats.dueReviewCount} / ${detail.student.stats.overdueReviewCount}`],
            ].map(([label, value]) => <div key={label} className="mastery-metric"><p className="text-xs text-textGlass-secondary">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div>
            <progress className="wfd-progress" max={100} value={detail.student.stats.masteryRate} aria-label="Tỷ lệ mastery" />
            <p className="text-sm text-textGlass-secondary">Mastered chưa quá hạn: {detail.student.stats.retentionRate === null ? 'Chưa có dữ liệu' : `${detail.student.stats.retentionRate.toFixed(1)}%`} · Luyện gần nhất: {date(detail.student.stats.lastPracticedAt)}</p>
          </Card>
          <Card className="space-y-4 p-4 sm:p-6">
            <h2 className="text-xl font-semibold">Chi tiết từng câu</h2>
            <Input aria-label="Tìm mã hoặc nội dung câu" placeholder="Tìm mã hoặc nội dung câu…" value={questionQuery} onChange={event => { setQuestionQuery(event.target.value); setQuestionPage(0); }} className="w-full" />
            <Tabs items={[...filters, { key: 'learning', label: 'Đang học' }, { key: 'mastered', label: 'Mastered' }]} activeKey={questionFilter} onChange={key => { setQuestionFilter(key); setQuestionPage(0); }} />
            <p className="text-xs text-textGlass-secondary">{questions.length} câu phù hợp · Thời gian Việt Nam · Câu đến hạn sớm nhất hiển thị trước.</p>
            {!questions.length && <p role="status" className="py-6">Không có câu phù hợp.</p>}
            <div className="space-y-4">{questions.slice(questionPage * 20, questionPage * 20 + 20).map(question => <article key={question.id} className="mastery-metric space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3"><span className="break-all text-xs text-textGlass-secondary">#{question.id}</span><span className="students-badge">{!question.progress ? 'Chưa luyện' : question.progress.mastered ? 'Mastered' : 'Đang học'}</span></div>
              <p className="break-words leading-7">{question.text || 'Chưa có nội dung câu'}</p>
              {question.progress && <div className="grid gap-2 text-xs text-textGlass-secondary sm:grid-cols-3"><p>Bậc ôn: {question.progress.stage + 1}/5</p><p>Luyện gần nhất: {date(question.progress.lastPracticedAt)}</p><p>Ôn tiếp: {date(question.progress.nextReviewAt)}{question.progress.nextReviewAt <= detail.now && <span className="block text-primary">{question.progress.nextReviewAt + 86400000 <= detail.now ? 'Quá hạn ít nhất 24 giờ' : 'Đến hạn ôn'}</span>}</p></div>}
            </article>)}</div>
            <div className="flex items-center justify-between gap-3"><Button variant="secondary" disabled={questionPage === 0} onClick={() => setQuestionPage(value => value - 1)}>Trước</Button><span className="text-sm">Trang {questionPage + 1} / {Math.max(1, Math.ceil(questions.length / 20))}</span><Button variant="secondary" disabled={(questionPage + 1) * 20 >= questions.length} onClick={() => setQuestionPage(value => value + 1)}>Sau</Button></div>
          </Card>
        </div> : <Card className="space-y-4 p-4 sm:p-6">
          <h2 className="text-xl font-semibold">Tổng quan học viên</h2>
          {!visible.length ? <p role="status" className="py-6">Không có tài khoản phù hợp trong trang này.</p> : <div className="overflow-x-auto"><table className="mastery-table"><caption className="sr-only">Mastery WFD theo tài khoản</caption><thead><tr>{['Học viên', 'Mastery', 'Đã luyện', 'Đến hạn / quá hạn', 'Luyện gần nhất', 'Chi tiết'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{visible.map(user => <tr key={user.id}>
            <td><p className="font-semibold">{user.name}</p><p className="break-all text-xs text-textGlass-secondary">{user.email}</p><p className="text-xs text-textGlass-secondary">{user.role}</p></td>
            <td><p className="font-semibold text-primary">{user.stats.masteryRate.toFixed(1)}%</p><p className="text-xs">{user.stats.masteredCount}/{user.stats.total} câu</p><progress className="wfd-progress mt-2" max={100} value={user.stats.masteryRate} aria-label={`Mastery của ${user.name}`} /></td>
            <td>{user.stats.practicedCount}</td><td>{user.stats.dueReviewCount} / {user.stats.overdueReviewCount}</td><td className="text-xs">{date(user.stats.lastPracticedAt)}</td>
            <td><Button variant="secondary" aria-label={`Xem mastery của ${user.name}`} onClick={() => openStudent(user.id)}>Xem</Button></td>
          </tr>)}</tbody></table></div>}
          <footer className="flex flex-wrap items-center justify-between gap-4"><p className="text-xs text-textGlass-secondary">Hiển thị {visible.length}/{users.length} tài khoản trên trang · {total} kết quả tìm kiếm</p><div className="flex items-center gap-3"><Button variant="secondary" disabled={!offset} onClick={() => { setBusy(true); setOffset(value => Math.max(0, value - 20)); }}>Trước</Button><span className="text-sm">Trang {offset / 20 + 1}</span><Button variant="secondary" disabled={offset + 20 >= total} onClick={() => { setBusy(true); setOffset(value => value + 20); }}>Sau</Button></div></footer>
        </Card>}
      </section>
      <Card className="space-y-2 p-4 text-sm text-textGlass-secondary sm:p-6"><h2 className="font-semibold text-textGlass-primary">Cách đọc mastery</h2><p>Mastery = số câu Mastered / tổng số câu WFD đang hiển thị. Câu ẩn hoặc đã xóa không được tính.</p><p>Đúng 100%, sau đó vượt qua hai lượt ôn đến hạn để đạt Mastered. Lịch ôn: 1, 3, 7, 14, 30 ngày. Luyện sớm không tăng bậc; sai đưa về Learning.</p><p>“Mastered chưa quá hạn” là tỷ lệ câu Mastered chưa quá hạn ít nhất 24 giờ, không phải xác suất nhớ. Chỉ tính các lượt luyện hợp lệ được lưu bởi tính năng mastery, không suy diễn từ XP cũ. Dữ liệu cập nhật khi tải trang hoặc bấm Làm mới.</p></Card>
    </main>
  </AppShellBackground>;
}