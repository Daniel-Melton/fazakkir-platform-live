import Link from "next/link";
import CookieSettingsLink from "@/components/CookieSettingsLink";

// One footer for every public page. Edit it here only.
export default function SiteFooter() {
  const supportHref = `https://wa.me/${process.env.NEXT_PUBLIC_WA_PHONE_NUMBER || "201000000000"}?text=${encodeURIComponent(
    "Salam Alaikum Fazakkir Academy Support, I have an inquiry."
  )}`;

  return (
    <footer className="bg-[#022c22] text-[#a7f3d0] py-12 text-sm border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <span className="text-lg font-extrabold text-white">Fazakkir Academy</span>
            <span className="font-amiri text-emerald-400 font-bold">فَذَكِّرْ</span>
          </div>
          <p className="text-xs text-emerald-400/80">
            Personalized 1-on-1 Quran, Tajweed &amp; Arabic mentorship by certified Azhari scholars.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-300 font-medium">
          <Link href="/pricing" className="hover:text-white transition-colors">
            Tuition &amp; Plans
          </Link>
          <Link href="/courses" className="hover:text-white transition-colors">
            Courses
          </Link>
          <Link href="/blog" className="hover:text-white transition-colors">
            Blog
          </Link>
          <Link href="/privacy-policy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms &amp; Refunds
          </Link>
          <a href={supportHref} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            Support
          </a>
          <CookieSettingsLink className="hover:text-white transition-colors" />
        </nav>

        <p className="text-xs text-emerald-500">© {new Date().getFullYear()} Fazakkir Academy. All rights reserved.</p>
      </div>
    </footer>
  );
}
