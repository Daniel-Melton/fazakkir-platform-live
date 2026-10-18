import React from "react";
import LeadForm from "@/components/LeadForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("arabic");

export default function ArabicNonArabsLanding() {
  const waNumber = process.env.NEXT_PUBLIC_WA_PHONE_NUMBER || "201126425304";
  const defaultMessage = encodeURIComponent("Assalamu Alaikum! I want to join the Arabic for Non-Arabs course.");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* خلفية الصورة المحلية المباشرة والواضحة */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/arabic-bg.jpg"
          alt="Children learning Arabic alphabet and language"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-transparent" />
      </div>

      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              🌍 Fluent Speaking & Quranic Understanding
            </span>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              Understand What You Recite in Salah and{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-300">
                Speak Arabic with Confidence
              </span>
            </h1>

            <p className="text-slate-100 text-base sm:text-lg leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              No endless grammar charts. Our natural immersion method helps both kids and adults hold real conversations, build essential vocabulary, and understand Quranic Arabic intuitively.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-900/80 border border-indigo-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-lg mb-2">
                  <i className="fa-solid fa-comments" />
                </div>
                <h4 className="font-bold text-sm text-white">Native Arabic Mentors</h4>
                <p className="text-xs text-slate-300 mt-1 leading-normal">
                  Expert teachers fluent in English, specialized in non-native learners.
                </p>
              </div>

              <div className="p-4 bg-slate-900/80 border border-indigo-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-lg mb-2">
                  <i className="fa-solid fa-book-quran" />
                </div>
                <h4 className="font-bold text-sm text-white">Core Quranic Vocabulary</h4>
                <p className="text-xs text-slate-300 mt-1 leading-normal">
                  Focus on high-frequency words so you connect deeply with daily prayers.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/20 to-sky-500/20 rounded-3xl blur-2xl opacity-60" />
            <div className="relative">
              <LeadForm />
            </div>
          </div>

        </div>
      </main>

      {/* زر الواتساب العائم */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href={`https://wa.me/${waNumber}?text=${defaultMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition"
        >
          <i className="fa-brands fa-whatsapp text-3xl" />
        </a>
      </div>
    </div>
  );
}