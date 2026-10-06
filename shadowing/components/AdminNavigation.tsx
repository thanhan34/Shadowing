import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, ChevronDown, FileText, Headphones, Search, Shield, Users, X } from 'react-feather';
import { ADMIN_NAV_GROUPS } from '../lib/adminNavigation';

export default function AdminNavigation() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [allowedFor, setAllowedFor] = useState('');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setAllowedFor('');
    if (!isLoaded || !userId) return;
    let current: AbortController | undefined;
    let disposed = false;
    async function refresh() {
      current?.abort();
      const controller = new AbortController();
      current = controller;
      try {
        const response = await fetch('/api/access', { cache: 'no-store', signal: controller.signal });
        const data = response.ok ? await response.json() : null;
        if (!disposed && !controller.signal.aborted) setAllowedFor(data?.staff === true ? userId! : '');
      } catch { if (!disposed && !controller.signal.aborted) setAllowedFor(''); }
    }
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => { disposed = true; current?.abort(); window.removeEventListener('focus', onFocus); };
  }, [isLoaded, userId, router.asPath]);
  useEffect(() => { setOpen(false); }, [router.asPath, allowedFor]);
  useEffect(() => {
    if (!open) return;
    setQuery('');
    search.current?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  if (!isLoaded || !userId || allowedFor !== userId) return null;
  const groups = filterAdminGroups(query);
  const active = ADMIN_NAV_GROUPS.some(group => group.items.some(item => item.href === router.pathname));
  const close = () => { setOpen(false); trigger.current?.focus(); };
  return <div ref={root} className="static sm:relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls="admin-navigation-links" onClick={() => setOpen(value => !value)} className={`admin-nav-trigger ${open || active ? 'admin-nav-trigger-active' : ''}`}>
      <Shield size={16} className="text-primary" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">Quản trị</span>
      <ChevronDown size={14} className={`hidden transition-transform motion-reduce:transition-none sm:block ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>
    {open && <div id="admin-navigation-links" className="admin-nav-panel" aria-labelledby="admin-navigation-title">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary"><Shield size={22} aria-hidden="true" /></span>
          <div><h2 id="admin-navigation-title" className="text-base font-bold text-white">Không gian quản trị</h2><p className="mt-1 text-xs text-textGlass-muted">Học viên, nội dung và công cụ</p></div>
        </div>
        <button type="button" onClick={close} aria-label="Đóng bảng quản trị" className="admin-nav-close"><X size={18} aria-hidden="true" /></button>
      </div>
      <div className="px-4 pt-4 sm:px-6">
        <label className="relative block"><span className="sr-only">Tìm công cụ quản trị</span>
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-textGlass-muted" aria-hidden="true" />
          <input ref={search} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm công cụ, bài học…" className="ui-input min-h-[44px] w-full pl-12 text-sm" />
        </label>
      </div>
      <AdminNavigationLinks groups={groups} pathname={router.pathname} onNavigate={() => setOpen(false)} />
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-textGlass-muted sm:px-6">
        <span className="flex items-center gap-2"><Shield size={12} aria-hidden="true" /> Dành cho đội ngũ quản trị</span>
        <span className="hidden sm:inline">Esc để đóng</span>
      </div>
    </div>}
  </div>;
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
export function filterAdminGroups(query: string) {
  const term = normalize(query);
  return ADMIN_NAV_GROUPS.map(group => ({ ...group, items: group.items.filter(item => normalize(`${group.label} ${item.label}`).includes(term)) })).filter(group => group.items.length > 0);
}

export function AdminNavigationLinks({ groups, pathname, onNavigate }: {
  groups: typeof ADMIN_NAV_GROUPS; pathname: string; onNavigate: () => void;
}) {
  const icons = [Users, Headphones, BookOpen, FileText];
  return <div className="admin-nav-links">
    {!groups.length && <p role="status" className="py-8 text-center text-sm text-textGlass-secondary">Không tìm thấy công cụ. Hãy thử từ khóa khác.</p>}
    <div className="grid gap-6 sm:grid-cols-2">{groups.map(group => {
      const Icon = icons[ADMIN_NAV_GROUPS.findIndex(entry => entry.label === group.label)] || FileText;
      return <section key={group.label}>
        <h3 className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold text-textGlass-muted"><Icon size={14} aria-hidden="true" />{group.label}</h3>
        <div className="space-y-1">{group.items.map(item => <Link key={item.href} href={item.href} prefetch={false} onClick={onNavigate} aria-current={pathname === item.href ? 'page' : undefined} className="admin-nav-link group">
          <span>{item.label}</span><ArrowUpRight size={14} className="shrink-0 opacity-40 group-hover:opacity-100" aria-hidden="true" />
        </Link>)}</div>
      </section>;
    })}</div>
  </div>;
}