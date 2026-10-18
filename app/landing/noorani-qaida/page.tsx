import React from "react";
import LeadForm from "@/components/LeadForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("qaida");

export default function NooraniQaidaLanding() {
  const waNumber = process.env.NEXT_PUBLIC_WA_PHONE_NUMBER || "201126425304";
  const defaultMessage = encodeURIComponent("Assalamu Alaikum! I want to enroll in the Noorani Qaida course.");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden selection:bg-amber-500 selection:text-white">
      {/* خلفية الصورة المحلية المباشرة والواضحة */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/noorani-bg.jpg"
          alt="Quran reading foundation"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
        />
        {/* تدرج هادئ وشفاف جداً لضمان قراءة النصوص فقط */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
      </div>

      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              ⭐ Beginner & Kids Foundation
            </span>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              From Zero Letters to Reading the Quran,{" "}
              <span className="text-amber-400 underline decoration-emerald-500 underline-offset-8">
                Step by Step
              </span>
            </h1>

            <p className="text-slate-100 text-base sm:text-lg leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Step-by-step phonics method designed for complete beginners and kids. Learn correct Makharij, joining letters, and fluent recitation with patient mentors.
            </p>

            {/* بطاقات الخطوات الأربع */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-slate-900/80 border border-amber-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <span className="text-amber-400 font-bold text-sm block mb-1">01. Letters</span>
                <p className="text-xs text-slate-300">Makharij & single Arabic alphabets.</p>
              </div>
              <div className="p-3.5 bg-slate-900/80 border border-amber-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <span className="text-amber-400 font-bold text-sm block mb-1">02. Vowels</span>
                <p className="text-xs text-slate-300">Fathah, Kasrah, Dammah & Sukoon.</p>
              </div>
              <div className="p-3.5 bg-slate-900/80 border border-amber-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <span className="text-amber-400 font-bold text-sm block mb-1">03. Joining</span>
                <p className="text-xs text-slate-300">Blending sounds & Tanween rules.</p>
              </div>
              <div className="p-3.5 bg-slate-900/80 border border-amber-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <span className="text-amber-400 font-bold text-sm block mb-1">04. Recitation</span>
                <p className="text-xs text-slate-300">Reading direct verses from the Mushaf.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-60" />
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