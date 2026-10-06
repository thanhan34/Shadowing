import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft, ArrowRight, Check, CheckCircle, Clock, HelpCircle, Lock, RefreshCw, Shield, Users } from 'react-feather';
import AppShellBackground from '../components/ui/AppShellBackground';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function PendingApproval() {
  const router = useRouter();
  const [access, setAccess] = useState<{ approved: boolean; admin: boolean } | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  async function check() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/access', { cache: 'no-store' });
      if (!response.ok) throw new Error('Không thể kiểm tra quyền truy cập. Vui lòng thử lại.');
      const result = await response.json();
      if (result.approved === true) {
        await router.replace(result.staff === true ? '/admin/students' : '/shadow');
        return;
      }
      setAccess(result);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  useEffect(() => { void check(); }, []);
  return <PendingApprovalView access={access} busy={busy} error={error} onCheck={check} />;
}

export function PendingApprovalView({ access, busy, error, onCheck }: {
  access: { approved: boolean; admin: boolean } | null;
  busy: boolean; error: string; onCheck: () => void;
}) {
  const approved = access?.approved === true;
  const known = access !== null;
  const StatusIcon = approved ? CheckCircle : known ? Clock : Shield;
  const steps = [
    { title: 'Tạo tài khoản', description: 'Bạn đã hoàn tất đăng ký.', complete: true },
    { title: 'Phê duyệt truy cập', description: approved ? 'Tài khoản đã được cấp quyền.' : 'Quản trị viên xác nhận quyền học tập.', complete: approved },
    { title: 'Bắt đầu luyện tập', description: approved ? 'Các bài luyện tập đã sẵn sàng.' : 'Nội dung sẽ mở sau khi được duyệt.', complete: false },
  ];
  return <AppShellBackground>
    <Head><title>Trạng thái tài khoản | PTE Intensive</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-40 text-textGlass-primary sm:px-6 sm:pt-48">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="ui-button-secondary accent-ring inline-flex items-center gap-2 text-sm"><ArrowLeft size={16} aria-hidden="true" /> Về trang chủ</Link>
        <span className="text-xs font-semibold uppercase tracking-widest text-textGlass-muted">PTE Intensive · Học viên</span>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card strong className="approval-status-card relative overflow-hidden lg:col-span-2">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary"><StatusIcon size={28} strokeWidth={1.5} aria-hidden="true" /></div>
            <span className="rounded-full border border-glass-border bg-white/5 px-3 py-2 text-xs font-medium text-textGlass-secondary">{approved ? (access?.admin ? 'Quản trị viên' : 'Đã được duyệt') : known ? 'Chờ phê duyệt' : 'Tài khoản học tập'}</span>
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">{approved ? 'Chào mừng trở lại' : 'Chào mừng đến với PTE Intensive'}</p>
          <h1 className="max-w-lg text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">{approved ? 'Sẵn sàng cho buổi luyện tập tiếp theo' : known ? 'Chỉ còn một bước để bắt đầu' : 'Không gian học tập của bạn'}</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-textGlass-secondary sm:text-base">{approved ? 'Tài khoản của bạn đã được cấp quyền truy cập. Khám phá các bài luyện tập và tiếp tục hành trình chinh phục PTE.' : known ? 'Tài khoản của bạn đã được tạo. Nội dung luyện tập sẽ mở sau khi quản trị viên phê duyệt quyền truy cập.' : 'Theo dõi trạng thái tài khoản và truy cập các nội dung luyện tập tại PTE Intensive.'}</p>
          <div className="my-8 rounded-2xl border border-glass-border bg-white/5 p-4">
            <div className="flex items-start gap-3">
              <Lock className="mt-1 shrink-0 text-textGlass-muted" size={18} aria-hidden="true" />
              <div><h2 className="text-sm font-semibold">{approved ? 'Quyền truy cập đã sẵn sàng' : 'Dành riêng cho học viên được duyệt'}</h2><p className="mt-1 text-sm leading-6 text-textGlass-secondary">{approved ? 'Bạn có thể vào luyện tập ngay bằng tài khoản này.' : 'Bạn không cần tạo tài khoản mới. Sau khi được duyệt, hãy cập nhật trạng thái để tiếp tục.'}</p></div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {approved && <Link href="/shadow" className="ui-button-primary accent-ring accent-glow inline-flex items-center justify-center gap-2">Vào luyện tập <ArrowRight size={18} aria-hidden="true" /></Link>}
            <Button variant={approved ? 'secondary' : 'primary'} disabled={busy} onClick={onCheck} className="inline-flex items-center justify-center gap-2"><RefreshCw size={16} aria-hidden="true" className={busy ? 'motion-safe:animate-spin' : ''} />{busy ? 'Đang tải…' : 'Cập nhật trạng thái'}</Button>
            {access?.admin && <Link href="/admin/students" className="ui-button-secondary accent-ring inline-flex items-center justify-center gap-2"><Users size={16} aria-hidden="true" /> Duyệt học viên</Link>}
          </div>
          <div className="mt-4 min-h-[24px] text-xs leading-6">{error ? <p role="alert">{error}</p> : <p role="status" aria-live="polite" className="text-textGlass-muted">{known && !busy ? 'Trạng thái tài khoản vừa được cập nhật.' : <span className="sr-only">Đang tải…</span>}</p>}</div>
        </Card>
        <aside className="space-y-6" aria-label="Hướng dẫn truy cập">
          <Card>
            <h2 className="text-base font-semibold">Hành trình bắt đầu</h2><p className="mt-2 text-sm leading-6 text-textGlass-secondary">Ba bước đến không gian luyện tập của bạn.</p>
            <ol className="mt-6 space-y-6">{steps.map((step, index) => {
              const current = known && (approved ? index === 2 : index === 1);
              return <li key={step.title} className="flex gap-3" aria-current={current ? 'step' : undefined}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${step.complete || current ? 'border-primary/30 bg-primary/10 text-primary' : 'border-glass-border bg-white/5 text-textGlass-muted'}`}>{step.complete ? <Check size={16} aria-label="Hoàn tất" /> : index + 1}</span>
                <div className="min-w-0 pt-1"><h3 className="text-sm font-medium">{step.title}</h3><p className="mt-1 text-xs leading-5 text-textGlass-secondary">{step.description}</p></div>
              </li>;
            })}</ol>
          </Card>
          <Card>
            <div className="flex items-center gap-2"><HelpCircle size={18} className="text-textGlass-muted" aria-hidden="true" /><h2 className="text-sm font-semibold">Cần hỗ trợ?</h2></div>
            <p className="mt-3 text-sm leading-6 text-textGlass-secondary">Nếu bạn đã đăng ký học hoặc quyền truy cập có thay đổi, hãy liên hệ trung tâm qua kênh hỗ trợ hiện có.</p>
            <p className="mt-3 border-t border-glass-border pt-3 text-xs leading-5 text-textGlass-muted">Cung cấp email đăng ký để quản trị viên tìm đúng tài khoản. Không chia sẻ mật khẩu hoặc mã đăng nhập.</p>
          </Card>
        </aside>
      </div>
      <p className="mt-8 text-center text-xs leading-6 text-textGlass-muted">PTE Intensive Practice · Luyện từng kỹ năng, vững từng dạng bài.</p>
    </main>
  </AppShellBackground>;
}