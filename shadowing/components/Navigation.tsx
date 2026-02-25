import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronDown, ExternalLink, Menu, X } from "react-feather";

type NavItem = {
  label: string;
  href: string;
};

const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Shadowing", href: "/shadow" },
  { label: "Retell Lecture", href: "/retell-lecture" },
  { label: "Describe Image", href: "/describe-image-shadowing" },
  { label: "Essay Library", href: "/essays" },
  { label: "Write From Dictation", href: "/writefromdictation" },
  { label: "Repeat Sentence", href: "/RepeatSentence" },
];

const USEFUL_LINKS: NavItem[] = [
  {
    label: "YouTube Channel",
    href: "https://www.youtube.com/@andoan.pteintensive",
  },
  {
    label: "Facebook Group",
    href: "https://www.facebook.com/groups/pteintensive",
  },
  {
    label: "Facebook Fanpage",
    href: "https://www.facebook.com/pteintensive",
  },
  {
    label: "Tiktok",
    href: "https://www.tiktok.com/@pteintensive",
  },
];

const Navigation: React.FC = () => {
  const router = useRouter();
  const [isUsefulMenuOpen, setIsUsefulMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const usefulMenuRef = useRef<HTMLDivElement | null>(null);

  const currentPath = useMemo(() => router.pathname, [router.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        usefulMenuRef.current &&
        !usefulMenuRef.current.contains(event.target as Node)
      ) {
        setIsUsefulMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsUsefulMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [router.asPath]);

  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  const desktopLinkClass = (href: string) =>
    `relative rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive(href)
        ? "text-white"
        : "text-white/60 hover:text-white hover:-translate-y-0.5"
    }`;

  const mobileLinkClass = (href: string) =>
    `flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 active:translate-y-0.5 ${
      isActive(href)
        ? "border-[#fc5d01]/50 bg-[#fc5d01]/10 text-white shadow-[0_0_16px_-4px_rgba(252,93,1,0.4)]"
        : "border-white/8 bg-white/[0.04] text-white/60 hover:border-white/15 hover:bg-white/[0.07] hover:text-white"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#fc5d01]/70 to-transparent" />

      {/* Ambient glow from top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(252,93,1,0.06),transparent)]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-3">
        {/* Floating pill */}
        <div className="relative overflow-visible rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_2px_24px_-8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]">
          {/* Inner highlight */}
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="flex items-center gap-3 px-3 py-2">
            {/* ── Logo ── */}
            <Link
              href="/"
              className="group inline-flex shrink-0 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#fc5d01]/35 hover:bg-[#fc5d01]/8 hover:shadow-[0_0_18px_-6px_rgba(252,93,1,0.55)] active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc5d01]/60"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#fc5d01] to-[#fd7f33] text-xs font-black text-white shadow-[0_2px_10px_rgba(252,93,1,0.55)]">
                PI
              </span>
              <span className="hidden sm:inline tracking-wide">PTE Intensive</span>
            </Link>

            {/* ── Desktop nav ── */}
            <div className="hidden flex-1 items-center lg:flex">
              {MAIN_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={desktopLinkClass(item.href)}
                >
                  {isActive(item.href) && (
                    <>
                      {/* Pill glow bg */}
                      <span className="absolute inset-0 rounded-xl bg-[#fc5d01]/10 ring-1 ring-inset ring-[#fc5d01]/30" />
                      {/* Bottom indicator */}
                      <span className="absolute bottom-[3px] left-1/2 h-[2px] w-1/2 -translate-x-1/2 rounded-full bg-[#fc5d01] shadow-[0_0_6px_2px_rgba(252,93,1,0.5)]" />
                    </>
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Spacer for mobile */}
            <div className="flex-1 lg:hidden" />

            {/* ── Useful Links dropdown ── */}
            <div ref={usefulMenuRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setIsUsefulMenuOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc5d01]/60 ${
                  isUsefulMenuOpen
                    ? "border-[#fc5d01]/40 bg-[#fc5d01]/10 text-white shadow-[0_0_16px_-6px_rgba(252,93,1,0.5)]"
                    : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                Useful Links
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    isUsefulMenuOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {/* Dropdown */}
              {isUsefulMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-white/[0.1] bg-black/40 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-[#fc5d01]/50 to-transparent" />
                  {USEFUL_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between border-b border-white/[0.06] px-4 py-3 text-sm font-medium text-white/65 transition-all duration-150 last:border-b-0 hover:bg-[#fc5d01]/8 hover:text-white"
                    >
                      <span>{item.label}</span>
                      <ExternalLink
                        size={12}
                        className="text-white/25 transition-colors duration-150 group-hover:text-[#fc5d01]"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ── Mobile menu button ── */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-all duration-200 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc5d01]/60 lg:hidden ${
                isMobileMenuOpen
                  ? "border-[#fc5d01]/40 bg-[#fc5d01]/10 text-white"
                  : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:border-white/15 hover:bg-white/[0.07] hover:text-white"
              }`}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {isMobileMenuOpen && (
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-4 lg:hidden">
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#fc5d01]/40 to-transparent" />

            <div className="p-3">
              <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-white/30">
                Navigation
              </p>

              <div className="grid gap-1">
                {MAIN_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={mobileLinkClass(item.href)}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`text-xs transition-colors ${
                        isActive(item.href) ? "text-[#fc5d01]" : "text-white/20"
                      }`}
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-3 border-t border-white/[0.06] pt-3">
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Useful Links
                </p>
                <div className="grid gap-0.5">
                  {USEFUL_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition-all duration-150 hover:bg-white/[0.06] hover:text-white"
                    >
                      <span>{item.label}</span>
                      <ExternalLink
                        size={12}
                        className="text-white/20 transition-colors group-hover:text-[#fc5d01]"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
