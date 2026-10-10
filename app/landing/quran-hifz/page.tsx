import React from "react";
import LeadForm from "@/components/LeadForm";

export const metadata = {
  title: "Online Quran Hifz Program | Memorize with Strong Retention",
  description: "Customized memorization and rigorous revision plans led by Huffaz with continuous Sanad.",
};

export default function QuranHifzLanding() {
  const waNumber = process.env.NEXT_PUBLIC_WA_PHONE_NUMBER || "201126425304";
  const defaultMessage = encodeURIComponent("Assalamu Alaikum! I want to enroll in the Quran Memorization (Hifz) program.");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* خلفية الصورة المحلية المباشرة والواضحة */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/hifz-bg.jpg"
          alt="Quran Memorization Sanctuary"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-transparent" />
      </div>

      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <span className="px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              📖 Serious Memorization Track
            </span>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              Memorize the Quran with a System Designed for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
                Zero Forgetfulness
              </span>
            </h1>

            <p className="text-slate-100 text-base sm:text-lg leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Anyone can memorize; true Hafiz is the one who retains. We implement the proven 3-Tier Daily Method: New Memorization (Sabaq), Recent Revision (Sabqi), and Long-Term Retention (Manzil).
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-900/80 border border-blue-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <span className="w-9 h-9 rounded-xl bg-blue-500/25 text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">1</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Custom Daily Target</h4>
                  <p className="text-xs text-slate-300">From 3 lines up to a full page according to your capacity.</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-900/80 border border-teal-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <span className="w-9 h-9 rounded-xl bg-teal-500/25 text-teal-300 flex items-center justify-center font-bold text-sm shrink-0">2</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Daily Retention Testing</h4>
                  <p className="text-xs text-slate-300">Rigorous revision check before taking any new verses.</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-900/80 border border-blue-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <span className="w-9 h-9 rounded-xl bg-blue-500/25 text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">3</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Milestone Juz' Examinations</h4>
                  <p className="text-xs text-slate-300">Comprehensive oral exam after finishing every chapter.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-60" />
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