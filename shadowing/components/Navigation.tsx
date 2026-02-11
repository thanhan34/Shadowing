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
  { label: "Phương Pháp Học", href: "/shadowing-methods" },
  { label: "Write From Dictation", href: "/writefromdictation" },
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsUsefulMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [router.asPath]);

  const isActive = (href: string) => {
    if (href === "/") {
      return currentPath === "/";
    }

    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  const desktopLinkClass = (href: string) =>
    `rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-300 ${
      isActive(href)
        ? "border-white/60 bg-white/35 text-white shadow-[0_10px_28px_-14px_rgba(255,255,255,0.85)]"
        : "border-transparent text-white/85 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/18 hover:text-white"
    }`;

  const mobileLinkClass = (href: string) =>
    `inline-flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-300 ${
      isActive(href)
        ? "border-white/55 bg-white/35 text-white"
        : "border-white/20 bg-white/10 text-white/90 hover:border-white/35 hover:bg-white/20"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/20 bg-[#090f1fcc] backdrop-blur-2xl">
      <div className="h-[3px] w-full bg-gradient-to-r from-[#22d3ee] via-[#a78bfa] to-[#f472b6]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.3),transparent_44%),radial-gradient(circle_at_82%_0%,rgba(244,114,182,0.25),transparent_44%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-3">
        <div className="relative rounded-[24px] p-[1px] bg-[linear-gradient(130deg,rgba(255,255,255,0.55),rgba(255,255,255,0.08),rgba(167,139,250,0.5),rgba(34,211,238,0.35))]">
          <div className="absolute inset-0 -z-10 rounded-[24px] bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.28),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(244,114,182,0.2),transparent_42%)] blur-xl" />

          <div className="relative rounded-[23px] border border-white/25 bg-[linear-gradient(150deg,rgba(255,255,255,0.2),rgba(255,255,255,0.06))] p-2 shadow-[0_24px_55px_-34px_rgba(96,165,250,0.95)] backdrop-blur-3xl">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/85 to-transparent" />

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/50 bg-[linear-gradient(145deg,rgba(255,255,255,0.24),rgba(255,255,255,0.08))] px-3 py-2 text-sm font-bold text-white shadow-[0_10px_30px_-20px_rgba(255,255,255,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/30"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/95 text-xs font-bold text-[#4338ca] shadow-inner shadow-white/70">
                  PI
                </span>
                PTE Intensive
              </Link>

              <div className="hidden flex-1 items-center justify-center rounded-2xl border border-white/25 bg-white/10 p-1 lg:flex">
                {MAIN_NAV_ITEMS.map((item) => (
                  <Link key={item.href} href={item.href} className={desktopLinkClass(item.href)}>
                    {item.label}
                  </Link>
                ))}
              </div>

              <div ref={usefulMenuRef} className="relative ml-auto hidden lg:block">
                <button
                  type="button"
                  onClick={() => setIsUsefulMenuOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-all duration-300 ${
                    isUsefulMenuOpen
                      ? "border-white/65 bg-white/32 text-white shadow-[0_10px_30px_-16px_rgba(255,255,255,0.95)]"
                      : "border-white/30 bg-white/10 text-white/90 hover:border-white/50 hover:bg-white/20"
                  }`}
                >
                  Useful Links
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      isUsefulMenuOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                {isUsefulMenuOpen && (
                  <div className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-white/35 bg-[#0b1222d9] shadow-[0_24px_55px_-30px_rgba(56,189,248,0.85)] backdrop-blur-2xl">
                    <div className="pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                    {USEFUL_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between border-b border-white/15 px-4 py-3 text-sm font-semibold text-white/90 transition-colors duration-300 last:border-b-0 hover:bg-white/15"
                      >
                        <span>{item.label}</span>
                        <ExternalLink size={14} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/12 px-3 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20 lg:hidden"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                Menu
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="mx-auto mt-1 w-full max-w-7xl px-4 pb-3 lg:hidden">
          <div className="rounded-3xl border border-white/30 bg-[#0b1222b3] p-3 shadow-[0_24px_55px_-30px_rgba(167,139,250,0.9)] backdrop-blur-3xl">
            <div className="mb-2 h-px w-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />

            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-white/85">
              Main Navigation
            </div>

            <div className="grid gap-2">
              {MAIN_NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className={mobileLinkClass(item.href)}>
                  <span>{item.label}</span>
                  <span className="text-xs">→</span>
                </Link>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-white/25 bg-white/10 p-2">
              <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-white/85">
                Useful Links
              </p>
              {USEFUL_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-1 flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-white/90 transition-colors duration-300 last:mb-0 hover:border-white/35 hover:bg-white/15"
                >
                  <span>{item.label}</span>
                  <ExternalLink size={14} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;