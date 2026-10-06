import { useState, useEffect, useCallback } from 'react';
import AppShellBackground from '../../components/ui/AppShellBackground';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

type Student = { id: string; name: string; email: string; approved: boolean; admin: boolean; support: boolean };
export default function Students() {
  const [users, setUsers] = useState<Student[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [canManageRoles, setCanManageRoles] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/students?offset=${offset}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tải học viên.');
    setUsers(data.users); setTotal(data.total);
    setCanManageRoles(data.canManageRoles === true);
  }, [offset]);
  useEffect(() => { setBusy(true); load().catch(err => setMessage(err.message)).finally(() => setBusy(false)); }, [load]);
  async function review(student: Student, approved: boolean) {
    if (!window.confirm(`${approved ? 'Duyệt' : 'Thu hồi quyền của'} ${student.email}?`)) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: student.id, approved }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await load(); setMessage('Đã cập nhật quyền học viên.');
    } catch (err) { setMessage((err as Error).message); }
    finally { setBusy(false); }
  }
  async function changeRole(student: Student) {
    const role = student.support ? 'student' : 'support';
    if (!window.confirm(`${student.support ? 'Gỡ vai trò hỗ trợ (giữ quyền học viên)' : 'Cấp vai trò hỗ trợ admin'} cho ${student.email}?`)) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: student.id, role }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể cập nhật vai trò.');
      await load(); setMessage('Đã cập nhật vai trò.');
    } catch (err) { setMessage((err as Error).message); }
    finally { setBusy(false); }
  }
  return <AppShellBackground><main className="mx-auto max-w-4xl px-4 pb-16 pt-48 text-white">
    <Card strong><h1 className="text-3xl font-bold">Duyệt học viên</h1>
      <p className="my-4 text-white/70">Chỉ học viên được duyệt mới có quyền luyện tập. Tổng số tài khoản: {total}.</p>
      <p role="status" className="mb-4">{message || (busy ? 'Đang xử lý…' : '')}</p>
      <div className="space-y-4">{users.map(student => <Card key={student.id}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0"><h2 className="font-semibold">{student.name || 'Học viên'}</h2><p className="break-all text-white/70">{student.email}</p>
            <p className="text-sm text-white/55">{student.admin ? 'Admin' : student.support ? 'Hỗ trợ admin' : student.approved ? 'Đã duyệt' : 'Chưa có quyền truy cập'}</p></div>
          <div className="flex flex-wrap gap-3">
            {!student.admin && !student.support && <Button disabled={busy} variant={student.approved ? 'secondary' : 'primary'} onClick={() => review(student, !student.approved)}>{student.approved ? 'Thu hồi quyền' : 'Duyệt học viên'}</Button>}
            {canManageRoles && !student.admin && <Button disabled={busy} variant="secondary" onClick={() => changeRole(student)}>{student.support ? 'Gỡ vai trò hỗ trợ' : 'Cấp vai trò hỗ trợ'}</Button>}
          </div>
        </div></Card>)}</div>
      {!busy && !users.length && <p>Chưa có học viên.</p>}
      <div className="mt-6 flex gap-3"><Button variant="secondary" disabled={busy || offset === 0} onClick={() => setOffset(offset - 20)}>Trang trước</Button>
        <Button variant="secondary" disabled={busy || offset + 20 >= total} onClick={() => setOffset(offset + 20)}>Trang sau</Button></div>
    </Card></main></AppShellBackground>;
}