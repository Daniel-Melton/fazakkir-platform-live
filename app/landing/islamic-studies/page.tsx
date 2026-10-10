import React from "react";
import LeadForm from "@/components/LeadForm";

export const metadata = {
  title: "Islamic Studies for Kids & Youth | Faith, Manners & Duas",
  description: "Nurture proud Muslim children with practical Fiqh of Salah, inspiring Prophetic stories, and noble Adab.",
};

export default function IslamicStudiesLanding() {
  const waNumber = process.env.NEXT_PUBLIC_WA_PHONE_NUMBER || "201126425304";
  const defaultMessage = encodeURIComponent("Assalamu Alaikum! I want to enroll my child in the Islamic Studies course.");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* خلفية الصورة المحلية المباشرة والواضحة */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/islamic-studies-bg.jpg"
          alt="Islamic Studies and Moral Character for Kids"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-transparent" />
      </div>

      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              🌱 Nurturing Muslim Identity
            </span>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              Build a Child Who Prays with Love and Lives with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                Prophetic Character
              </span>
            </h1>

            <p className="text-slate-100 text-base sm:text-lg leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              We teach religion as a living practice, not dry facts. Our curriculum covers Fiqh of Taharah and Salah, everyday Sunnah duas, inspiring stories of the Prophets, and building unshakeable Islamic pride.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-900/80 border border-emerald-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-lg mb-2">
                  <i className="fa-solid fa-person-praying" />
                </div>
                <h4 className="font-bold text-sm text-white">Practical Salah & Wudu</h4>
                <p className="text-xs text-slate-300 mt-1 leading-normal">
                  Mastering correct prayer actions, recitations, and spiritual meanings.
                </p>
              </div>

              <div className="p-4 bg-slate-900/80 border border-teal-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center text-lg mb-2">
                  <i className="fa-solid fa-heart" />
                </div>
                <h4 className="font-bold text-sm text-white">Noble Manners (Adab)</h4>
                <p className="text-xs text-slate-300 mt-1 leading-normal">
                  Honoring parents, truthfulness, kindness, and prophetic etiquette.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-60" />
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