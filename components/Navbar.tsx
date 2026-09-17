"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Why 1-on-1", href: "#why-fazakkir" },
  { label: "Our Standards", href: "#tutor-standards" },
  { label: "Courses", href: "#courses" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQs", href: "#faq" },
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;
      const sections = NAV_ITEMS.map((item) => item.href.substring(1));

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            return;
          }
        }
      }
      if (window.scrollY < 200) setActiveSection("");
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-[999] bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-900 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform text-base sm:text-lg">
            <i className="fa-solid fa-kaaba"></i>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-2xl font-extrabold text-emerald-950 tracking-tight">Fazakkir</span>
              <span className="font-amiri text-sm sm:text-lg font-bold text-emerald-600 leading-none">فَذَكِّرْ</span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-wider uppercase">Academy</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.href.substring(1);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full transition-all text-sm font-semibold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold shadow-sm"
                    : "text-slate-600 hover:text-emerald-600"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Action Button (Responsive for Mobile) */}
        <a
          href="#registerForm"
          className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-600 to-teal-800 text-white px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/25 hover:shadow-lg hover:-translate-y-0.5 transition-all flex-shrink-0"
        >
          <span>Free Trial</span>
          <i className="fa-solid fa-arrow-right text-[10px] sm:text-xs"></i>
        </a>
      </div>
    </header>
  );
}