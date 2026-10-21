"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_ITEMS = [
  { label: "Why 1-on-1", href: "/#why-fazakkir" },
  { label: "Our Standards", href: "/#tutor-standards" },
  { label: "Courses", href: "/#courses" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "FAQs", href: "/#faq" },
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;
      const sections = NAV_ITEMS.map((item) => item.href.replace("/#", "").replace("#", ""));
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
        <Link href="/" className="flex items-center gap-3.5 flex-shrink-0 group py-1">
          <div className="relative h-10 w-28 sm:h-12 sm:w-36 md:h-14 md:w-44 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Fazakkir Logo"
              fill
              sizes="(max-width: 768px) 120px, 180px"
              className="object-contain"
              priority
              quality={95}
            />
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

        {/* Action Button & Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/#registerForm"
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-600 to-teal-800 text-white px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/25 hover:shadow-lg hover:-translate-y-0.5 transition-all flex-shrink-0"
          >
            <span>Free Trial</span>
            <i className="fa-solid fa-arrow-right text-[10px] sm:text-xs"></i>
          </Link>

          {/* زر فتح وإغلاق القائمة للموبايل */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <i className={`fa-solid ${mobileMenuOpen ? "fa-xmark" : "fa-bars"} text-xl sm:text-2xl`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <nav className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-5 space-y-1 shadow-lg transition-all animate-in fade-in slide-in-from-top-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.href.substring(1);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "text-slate-700 hover:bg-slate-50 hover:text-emerald-600"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      )}
    </header>
  );
}