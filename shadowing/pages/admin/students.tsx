import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { AlertCircle, Check, CheckCircle, ChevronLeft, ChevronRight, Clock, Lock, RefreshCw, Search, Shield, Users } from 'react-feather';
import AppShellBackground from '../../components/ui/AppShellBackground';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';

type Student = { id: string; name: string; email: string; approved: boolean; admin: boolean; support: boolean };
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
const hasAccess = (student: Student) => student.admin || student.support || student.approved;
export default function Students() {
  const [users, setUsers] = useState<Student[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isError, setIsError] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [canManageRoles, setCanManageRoles] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`/api/admin/students?offset=${offset}`, { cache: 'no-store', signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tải học viên.');
    if (signal?.aborted) return;
    setUsers(data.users); setTotal(data.total); setLoaded(true); setLoadError('');
    setCanManageRoles(data.canManageRoles === true);
  }, [offset]);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true); setLoadError('');
    load(controller.signal).catch(err => { if (!controller.signal.aborted) setLoadError(err.message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [load]);
  async function refresh() {
    setBusy(true); setLoadError('');
    try { await load(); } catch (err) { setLoadError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function review(student: Student, approved: boolean) {
    if (!window.confirm(`${approved ? 'Duyệt' : 'Thu hồi quyền của'} ${student.email}?`)) return;
    setBusy(true); setMessage(''); setIsError(false);
    try {
      const response = await fetch('/api/admin/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: student.id, approved }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể cập nhật quyền học viên.');
      await load(); setMessage('Đã cập nhật quyền học viên.');
    } catch (err) { setMessage((err as Error).message); setIsError(true); }
    finally { setBusy(false); }
  }
  async function changeRole(student: Student) {
    const role = student.support ? 'student' : 'support';
    if (!window.confirm(`${student.support ? 'Gỡ vai trò hỗ trợ (giữ quyền học viên)' : 'Cấp vai trò hỗ trợ admin'} cho ${student.email}?`)) return;
    setBusy(true); setMessage(''); setIsError(false);
    try {
      const response = await fetch('/api/admin/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: student.id, role }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể cập nhật vai trò.');
      await load(); setMessage('Đã cập nhật vai trò.');
    } catch (err) { setMessage((err as Error).message); setIsError(true); }
    finally { setBusy(false); }
  }
  const approvedCount = users.filter(hasAccess).length;
  const visibleUsers = users.filter(student => normalize(`${student.name} ${student.email}`).includes(normalize(query)) && (filter === 'all' || (filter === 'approved' ? hasAccess(student) : !hasAccess(student))));
  const page = Math.floor(offset / 20) + 1;
  const stats = [
    { label: 'Tổng tài khoản', value: loaded ? total.toLocaleString('vi-VN') : '—', hint: 'Trên toàn hệ thống', icon: Users },
    { label: 'Có quyền truy cập', value: busy || loadError ? '—' : approvedCount, hint: 'Trong trang hiện tại', icon: CheckCircle },
    { label: 'Chưa có quyền', value: busy || loadError ? '—' : users.length - approvedCount, hint: 'Trong trang hiện tại', icon: Clock },
  ];
  return <AppShellBackground>
    <Head><title>Quản lý học viên | Quản trị</title></Head>
    <main className="students-admin mx-auto max-w-7xl px-4 pb-16 pt-32 text-textGlass-primary sm:px-6 lg:pt-40">
      <header className="mb-8">
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-textGlass-muted"><Shield size={14} aria-hidden="true" /> Không gian quản trị <ChevronRight size={12} aria-hidden="true" /> Học viên</p>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Quản lý học viên</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-textGlass-secondary">Quản lý tài khoản, duyệt quyền luyện tập và phân quyền hỗ trợ tại một nơi.</p></div>
          <Button variant="secondary" disabled={busy} onClick={() => void refresh()} className="inline-flex shrink-0 items-center justify-center gap-2 self-start text-sm"><RefreshCw size={16} className={busy ? 'motion-safe:animate-spin' : ''} aria-hidden="true" />{busy ? 'Đang xử lý…' : 'Tải lại danh sách'}</Button>
        </div>
      </header>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">{stats.map(({ label, value, hint, icon: Icon }, index) => <Card key={label} className={index === 0 ? 'students-stat-primary' : ''}>
        <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-textGlass-secondary">{label}</p><span className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${index === 0 ? 'border-primary/25 bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-textGlass-secondary'}`}><Icon size={20} aria-hidden="true" /></span></div><p className="mt-2 text-3xl font-bold tabular-nums">{value}</p><p className="mt-2 text-xs text-textGlass-muted">{hint}</p>
      </Card>)}</div>
      {message && <div role={isError ? 'alert' : 'status'} className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm">{isError ? <AlertCircle size={20} className="shrink-0 text-primary" aria-hidden="true" /> : <CheckCircle size={20} className="shrink-0 text-primary" aria-hidden="true" />}<p>{message}</p></div>}
      <Card className="students-directory">
        <div className="border-b border-white/10 p-4 sm:p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div><h2 className="text-lg font-semibold">Danh sách tài khoản</h2><p className="mt-1 text-xs leading-5 text-textGlass-muted">Tài khoản mới nhất được hiển thị trước · 20 tài khoản / trang</p></div>
            <div className="relative w-full lg:max-w-sm"><label htmlFor="student-search" className="sr-only">Tìm tên hoặc email trong trang hiện tại</label><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-textGlass-muted" aria-hidden="true" /><Input id="student-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên hoặc email…" className="students-search text-sm" aria-describedby="student-filter-scope" /></div>
          </div>
          <Tabs items={[{ key: 'all', label: 'Tất cả' }, { key: 'approved', label: 'Có quyền truy cập' }, { key: 'pending', label: 'Chưa có quyền' }]} activeKey={filter} onChange={setFilter} />
          <p id="student-filter-scope" className="mt-4 text-xs text-textGlass-muted">Tìm kiếm và bộ lọc áp dụng trong trang đang xem.</p>
        </div>
        <div aria-busy={busy}>
          {busy ? <div className="p-4 sm:p-6" role="status"><span className="sr-only">Đang tải hoặc cập nhật danh sách học viên…</span><div className="space-y-4 motion-safe:animate-pulse" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <div key={index} className="flex items-center gap-4 rounded-2xl border border-white/5 p-4"><div className="h-12 w-12 rounded-2xl bg-white/10" /><div className="flex-1 space-y-3"><div className="h-3 w-1/3 rounded bg-white/10" /><div className="h-3 w-2/3 rounded bg-white/5" /></div><div className="hidden h-10 w-32 rounded-2xl bg-white/5 sm:block" /></div>)}</div></div>
          : loadError ? <div className="flex flex-col items-center px-6 py-16 text-center" role="alert"><AlertCircle size={32} className="mb-4 text-primary" aria-hidden="true" /><h3 className="font-semibold">Chưa thể tải danh sách</h3><p className="mb-6 mt-2 max-w-md text-sm text-textGlass-secondary">{loadError}</p><Button variant="secondary" onClick={() => void refresh()}>Thử lại</Button></div>
          : !visibleUsers.length ? <div className="flex flex-col items-center px-6 py-16 text-center" role="status"><span className="mb-4 flex h-16 w-16 items-center justify-center rounded-card border border-white/10 bg-white/5"><Users size={28} className="text-textGlass-muted" aria-hidden="true" /></span><h3 className="font-semibold">{users.length ? 'Không tìm thấy tài khoản phù hợp' : 'Chưa có tài khoản trong trang này'}</h3><p className="mb-6 mt-2 max-w-md text-sm leading-6 text-textGlass-secondary">{users.length ? 'Thử từ khóa khác hoặc bỏ bộ lọc để xem lại danh sách.' : 'Tài khoản học viên sẽ xuất hiện tại đây sau khi đăng ký.'}</p>{(query || filter !== 'all') && <Button variant="secondary" onClick={() => { setQuery(''); setFilter('all'); }}>Xóa bộ lọc</Button>}</div>
          : <table className="students-table w-full text-left text-sm"><caption className="sr-only">Tài khoản học viên, vai trò, quyền truy cập và thao tác quản lý</caption>
            <thead><tr><th scope="col">Học viên</th><th scope="col">Vai trò</th><th scope="col">Quyền truy cập</th><th scope="col" className="text-right">Thao tác</th></tr></thead>
            <tbody>{visibleUsers.map(student => <tr key={student.id}>
              <td><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-textGlass-secondary" aria-hidden="true">{(student.name || student.email || 'HV').split(/\s+/).map(part => part.charAt(0)).slice(0, 2).join('').toUpperCase()}</span><div className="min-w-0"><p className="break-words font-semibold text-textGlass-primary">{student.name || 'Học viên'}</p><p className="mt-1 break-all text-xs text-textGlass-muted">{student.email || 'Chưa có email'}</p></div></div></td>
              <td><span className="students-mobile-label">Vai trò</span><span className="inline-flex items-center gap-2 text-xs text-textGlass-secondary">{(student.admin || student.support) && <Shield size={14} className="text-primary" aria-hidden="true" />}{student.admin ? 'Quản trị viên' : student.support ? 'Hỗ trợ admin' : 'Học viên'}</span></td>
              <td><span className="students-mobile-label">Quyền truy cập</span><span className={`students-badge ${hasAccess(student) ? 'students-badge-approved' : ''}`}>{hasAccess(student) ? <CheckCircle size={13} aria-hidden="true" /> : <Clock size={13} aria-hidden="true" />}{hasAccess(student) ? 'Đã cấp quyền' : 'Chưa có quyền'}</span></td>
              <td><div className="flex flex-wrap items-center justify-end gap-2">
                {!student.admin && !student.support && <Button disabled={busy} variant={student.approved ? 'secondary' : 'primary'} onClick={() => void review(student, !student.approved)} aria-label={`${student.approved ? 'Thu hồi quyền của' : 'Duyệt học viên'} ${student.name || student.email}`} className="inline-flex items-center justify-center gap-2 text-xs">{student.approved ? <Lock size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{student.approved ? 'Thu hồi quyền' : 'Duyệt học viên'}</Button>}
                {canManageRoles && !student.admin && <Button disabled={busy} variant="secondary" onClick={() => void changeRole(student)} aria-label={`${student.support ? 'Gỡ' : 'Cấp'} vai trò hỗ trợ cho ${student.name || student.email}`} className="text-xs">{student.support ? 'Gỡ vai trò hỗ trợ' : 'Cấp vai trò hỗ trợ'}</Button>}
                {(student.admin || (student.support && !canManageRoles)) && <span className="inline-flex items-center gap-2 text-xs text-textGlass-muted"><Lock size={13} aria-hidden="true" />{student.admin ? 'Tài khoản quản trị' : 'Admin quản lý vai trò'}</span>}
              </div></td>
            </tr>)}</tbody>
          </table>}
        </div>
        <footer className="flex flex-col justify-between gap-4 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:p-6">
          <p className="text-xs leading-5 text-textGlass-muted" aria-live="polite">{busy ? 'Đang tải dữ liệu…' : loadError ? 'Dữ liệu chưa sẵn sàng' : <>Hiển thị <span className="font-semibold text-textGlass-primary">{visibleUsers.length}</span> / {users.length} tài khoản trong trang {page}<br />Tổng cộng {total.toLocaleString('vi-VN')} tài khoản</>}</p>
          <nav aria-label="Phân trang học viên" className="flex items-center justify-between gap-3"><Button variant="secondary" disabled={busy || offset === 0} onClick={() => { setBusy(true); setOffset(value => Math.max(0, value - 20)); setMessage(''); }} aria-label="Trang trước" className="inline-flex min-w-[44px] items-center justify-center"><ChevronLeft size={18} aria-hidden="true" /></Button><span className="text-xs tabular-nums text-textGlass-secondary">Trang <span className="font-semibold text-white">{page}</span> / {Math.max(1, Math.ceil(total / 20))}</span><Button variant="secondary" disabled={busy || offset + 20 >= total} onClick={() => { setBusy(true); setOffset(value => value + 20); setMessage(''); }} aria-label="Trang sau" className="inline-flex min-w-[44px] items-center justify-center"><ChevronRight size={18} aria-hidden="true" /></Button></nav>
        </footer>
      </Card>
      <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-textGlass-muted"><Shield size={14} className="mt-0.5 shrink-0" aria-hidden="true" />Chỉ học viên được duyệt mới có quyền luyện tập. Vai trò hỗ trợ do quản trị viên cấp và quản lý.</p>
    </main>
  </AppShellBackground>;
}