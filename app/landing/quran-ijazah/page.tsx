import React from "react";
import LeadForm from "@/components/LeadForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("ijazah");

export default function QuranIjazahLanding() {
  const waNumber = process.env.NEXT_PUBLIC_WA_PHONE_NUMBER || "201126425304";
  const defaultMessage = encodeURIComponent("Assalamu Alaikum! I am inquiring about the Quran Ijazah with Sanad program.");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden selection:bg-amber-600 selection:text-white">
      {/* خلفية الصورة المحلية المباشرة والواضحة */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/ijazah-bg.jpg"
          alt="Quranic Sanad and Manuscripts"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-transparent" />
      </div>

      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              📜 Highest Academic & Spiritual Honor
            </span>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              Earn an Authentic Quran Ijazah with a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                Documented Sanad
              </span>
            </h1>

            <p className="text-slate-100 text-base sm:text-lg leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Recite the entire Quran from memory or looking into the Mushaf to a vetted Sanad holder. Qualify to teach worldwide and join the continuous chain of oral transmission.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-900/80 border border-amber-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg mb-2">
                  <i className="fa-solid fa-scroll" />
                </div>
                <h4 className="font-bold text-sm text-white">Continuous Chain</h4>
                <p className="text-xs text-slate-300 mt-1 leading-normal">
                  Verified unbroken lineage reaching directly back to the Prophet ﷺ.
                </p>
              </div>

              <div className="p-4 bg-slate-900/80 border border-amber-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg mb-2">
                  <i className="fa-solid fa-award" />
                </div>
                <h4 className="font-bold text-sm text-white">Multiple Qira'at</h4>
                <p className="text-xs text-slate-300 mt-1 leading-normal">
                  Tracks available in Hafs, Warsh, Qalun, and the 10 Qira'at.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-3xl blur-2xl opacity-60" />
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