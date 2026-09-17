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
    <header className="sticky top-0 z-[999] bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-900 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform text-lg">
            <i className="fa-solid fa-kaaba"></i>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-emerald-950 tracking-tight">Fazakkir</span>
              <span className="font-amiri text-lg font-bold text-emerald-600 leading-none">فَذَكِّرْ</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Academy</span>
          </div>
        </Link>

        {/* Desktop Nav Items with Active State */}
        <nav className="hidden md:flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.href.substring(1);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`px-4 py-1.5 rounded-full transition-all text-sm font-semibold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold text-[15px] shadow-sm"
                    : "text-slate-600 hover:text-emerald-600"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* CTA Button */}
        <a
          href="#registerForm"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-800 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md shadow-emerald-700/25 hover:shadow-lg hover:shadow-emerald-700/35 hover:-translate-y-0.5 transition-all"
        >
          <span>Book Free Trial</span>
          <i className="fa-solid fa-arrow-right text-xs"></i>
        </a>
      </div>
    </header>
  );
}