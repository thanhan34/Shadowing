import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowUpRight, Bell, BookOpen, ChevronDown, Edit3, ExternalLink, Headphones, Home, Image, Menu, Mic, PlayCircle, X } from "react-feather";
import AuthControls from "./AuthControls";
import AdminNavigation from "./AdminNavigation";

type NavItem = { label: string; href: string; icon: typeof Home; description: string };
export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Luyện nói & phát âm", items: [
    { label: "Shadowing", href: "/shadow", icon: Headphones, description: "Nghe, bắt chước và cải thiện phát âm" },
    { label: "Read Aloud", href: "/readaloud", icon: Mic, description: "Luyện đọc thành tiếng" },
    { label: "Repeat Sentence", href: "/RepeatSentence", icon: PlayCircle, description: "Nghe và lặp lại câu" },
    { label: "Retell Lecture", href: "/retell-lecture", icon: Headphones, description: "Nghe và kể lại bài giảng" },
    { label: "Describe Image", href: "/describe-image-shadowing", icon: Image, description: "Luyện mô tả hình ảnh" },
  ] },
  { label: "Luyện viết & kiến thức", items: [
    { label: "Write From Dictation", href: "/writefromdictation", icon: Edit3, description: "Nghe và viết lại chính xác" },
    { label: "Essay Library", href: "/essays", icon: BookOpen, description: "Thư viện bài luận tham khảo" },
    { label: "Ngữ pháp", href: "/grammar", icon: BookOpen, description: "Củng cố kiến thức nền tảng" },
  ] },
];
const USEFUL_LINKS = [
  { label: "YouTube Channel", href: "https://www.youtube.com/@andoan.pteintensive" },
  { label: "Facebook Group", href: "https://www.facebook.com/groups/pteintensive" },
  { label: "Facebook Fanpage", href: "https://www.facebook.com/pteintensive" },
  { label: "TikTok", href: "https://www.tiktok.com/@pteintensive" },
];
export function isNavigationActive(pathname: string, href: string) {
  if (href === "/shadow" && pathname.startsWith("/shadowing/")) return true;
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
export function NavigationGroups({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return <div className="navigation-groups">{NAV_GROUPS.map(group => <section key={group.label}>
    <h2 className="navigation-heading">{group.label}</h2>
    <div className="space-y-1">{group.items.map(item => <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={isNavigationActive(pathname, item.href) ? "page" : undefined} className="navigation-item group">
      <span className="navigation-item-icon"><item.icon size={18} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.label}</span><span className="navigation-description">{item.description}</span></span>
      <ArrowUpRight size={16} className="shrink-0 opacity-40 group-hover:opacity-100" aria-hidden="true" />
    </Link>)}</div>
  </section>)}</div>;
}

export default function Navigation() {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<"practice" | "community" | "mobile" | null>(null);
  const root = useRef<HTMLElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = () => setOpenMenu(null);
  useEffect(() => { setOpenMenu(null); }, [router.asPath]);
  useEffect(() => {
    if (!openMenu) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpenMenu(null); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) { setOpenMenu(null); lastTrigger.current?.focus(); }
    };
    const breakpoint = window.matchMedia("(min-width: 1280px)");
    const resize = () => setOpenMenu(null);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    breakpoint.addEventListener("change", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      breakpoint.removeEventListener("change", resize);
    };
  }, [openMenu]);
  const toggle = (menu: NonNullable<typeof openMenu>, trigger: HTMLButtonElement) => {
    lastTrigger.current = trigger;
    setOpenMenu(value => value === menu ? null : menu);
  };
  const triggerKeys = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" && openMenu) { event.preventDefault(); panel.current?.querySelector<HTMLAnchorElement>("a")?.focus(); }
  };
  const activePractice = NAV_GROUPS.some(group => group.items.some(item => isNavigationActive(router.pathname, item.href)));
  const activeItem = NAV_GROUPS.flatMap(group => group.items).find(item => isNavigationActive(router.pathname, item.href));
  return <nav ref={root} aria-label="Điều hướng chính" className="navigation-shell" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) close(); }}>
    <div className="navigation-bar">
      <Link href="/" onClick={close} className="navigation-brand" aria-label="PTE Intensive — Trang chủ">
        <span className="navigation-monogram">PI</span>
        <span className="hidden sm:block"><span className="block text-sm font-bold tracking-wide">PTE Intensive</span><span className="block text-[10px] uppercase tracking-widest text-textGlass-muted">Practice with purpose</span></span>
      </Link>
      <div className="hidden min-w-0 flex-1 items-center gap-1 xl:flex">
        <Link href="/" onClick={close} aria-current={router.pathname === "/" ? "page" : undefined} className="navigation-link">Trang chủ</Link>
        <button type="button" onClick={event => toggle("practice", event.currentTarget)} onKeyDown={triggerKeys} className={`navigation-link ${activePractice ? "navigation-link-selected" : ""}`} aria-expanded={openMenu === "practice"} aria-controls="practice-navigation"><BookOpen size={16} aria-hidden="true" />Luyện tập<ChevronDown size={14} className={openMenu === "practice" ? "rotate-180" : ""} aria-hidden="true" /></button>
        <Link href="/shadow" onClick={close} className="navigation-link" aria-current={isNavigationActive(router.pathname, "/shadow") ? "page" : undefined}>Shadowing</Link>
        <Link href="/writefromdictation" onClick={close} className="navigation-link" aria-current={isNavigationActive(router.pathname, "/writefromdictation") ? "page" : undefined}>Write From Dictation</Link>
        <button type="button" onClick={event => toggle("community", event.currentTarget)} onKeyDown={triggerKeys} className="navigation-link" aria-expanded={openMenu === "community"} aria-controls="community-navigation">Cộng đồng<ChevronDown size={14} className={openMenu === "community" ? "rotate-180" : ""} aria-hidden="true" /></button>
      </div>
      <span className="ml-auto hidden min-w-0 truncate text-xs text-textGlass-secondary md:block xl:hidden">{activeItem?.label || "Không gian luyện tập PTE"}</span>
      <div className="navigation-actions">
        <Link href="/settings/notifications" onClick={close} className="navigation-link navigation-icon-button hidden sm:inline-flex" aria-label="Thông báo" aria-current={isNavigationActive(router.pathname, "/settings/notifications") ? "page" : undefined}><Bell size={18} aria-hidden="true" /></Link>
        <AdminNavigation /><AuthControls />
        <button type="button" onClick={event => toggle("mobile", event.currentTarget)} className="navigation-link navigation-icon-button xl:hidden" aria-label={openMenu === "mobile" ? "Đóng menu" : "Mở menu"} aria-expanded={openMenu === "mobile"} aria-controls="mobile-navigation">{openMenu === "mobile" ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}</button>
      </div>
    </div>
    {openMenu && <div ref={panel} id={openMenu === "practice" ? "practice-navigation" : openMenu === "community" ? "community-navigation" : "mobile-navigation"} className={`navigation-panel ${openMenu === "community" ? "navigation-community" : ""} ${openMenu === "mobile" ? "xl:hidden" : "hidden xl:block"}`}>
      <div className="navigation-panel-header"><div><p className="text-sm font-semibold text-white">{openMenu === "community" ? "Cùng học, cùng tiến bộ" : "Không gian luyện tập"}</p><p className="mt-1 text-xs text-textGlass-secondary">{openMenu === "community" ? "Kết nối với cộng đồng PTE Intensive" : "Chọn kỹ năng bạn muốn cải thiện hôm nay"}</p></div><span className="hidden text-xs text-textGlass-muted sm:block">Esc để đóng</span></div>
      {openMenu === "mobile" && <Link href="/" onClick={close} className="navigation-link mx-4 mt-3" aria-current={router.pathname === "/" ? "page" : undefined}><Home size={16} aria-hidden="true" />Trang chủ</Link>}
      {openMenu !== "community" && <NavigationGroups pathname={router.pathname} onNavigate={close} />}
      {openMenu === "mobile" && <Link href="/settings/notifications" onClick={close} className="navigation-link mx-4 mb-4" aria-current={isNavigationActive(router.pathname, "/settings/notifications") ? "page" : undefined}><Bell size={16} aria-hidden="true" />Thông báo</Link>}
      {openMenu !== "practice" && <section className="navigation-community-links"><h2 className="navigation-heading">Cộng đồng & tài nguyên</h2><div className="grid gap-1 sm:grid-cols-2">{USEFUL_LINKS.map(item => <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="navigation-link justify-between" onClick={close}><span>{item.label}<span className="sr-only"> (mở tab mới)</span></span><ExternalLink size={14} aria-hidden="true" /></a>)}</div></section>}
    </div>}
  </nav>;
}