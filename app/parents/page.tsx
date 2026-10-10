import React from "react";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";

export const metadata = {
  title: "Safe & Nurturing Islamic Education for Your Children | Fazakkir",
  description:
    "Empower your children with authentic Quran memorization, Arabic fluency, and noble Islamic values in a safe, caring, 1-on-1 online environment.",
};

export default function ParentsLandingPage() {
  const waNumber = process.env.NEXT_PUBLIC_WA_PHONE_NUMBER || "201126425304";
  const defaultMessage = encodeURIComponent(
    "Assalamu Alaikum! I am inquiring about Quran & Islamic studies classes for my children."
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-emerald-500 selection:text-white">
      
      {/* =========================================================================
          1. خلفية الصورة المحلية المباشرة (من مجلد public)
          📍 تأكد من وجود ملف parents-bg.jpg داخل مجلد public
          ========================================================================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/parents-bg.jpg"
          alt="Islamic Family & Quran Education"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
        />
        {/* تدرج هادئ وشفاف لحفظ وضوح النصوص */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent" />
      </div>

      {/* =========================================================================
          2. Hero Section: التقسيم المتوازن (يسار: هيدر + كروت | يمين: فورم + حاسبة)
          ========================================================================= */}
      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* ==========================================
              العمود الأيسر: الهيدر + النصوص + الكروت الأربعة
              ========================================== */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* الشارة الترحيبية */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/80 border border-emerald-400/40 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              Preserving Your Child's Faith, Identity & Manners
            </div>

            {/* العنوان الرئيسي */}
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              Raising Proud Muslim Children in a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                Confusing Modern World
              </span>
            </h1>

            {/* الوصف */}
            <p className="text-slate-100 text-base sm:text-lg leading-relaxed font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Raising children in non-Muslim societies comes with constant identity challenges. We go far beyond mechanical recitation; we immerse your children in an affectionate Islamic environment where the Sunnah feels natural, inspiring, and alive in their daily habits.
            </p>

            {/* الكروت الأربعة تحت الهيدر مباشرة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/25 backdrop-blur-md shadow-xl hover:border-emerald-400/50 transition">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-base mb-2">
                  <i className="fa-solid fa-heart-pulse"></i>
                </div>
                <h4 className="font-bold text-sm text-white">Living Faith, Not Dry Rote</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  We relate verses to daily dilemmas—empowering kids to pray with devotion, stand proud against peer pressure, and express kindness.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-teal-500/25 backdrop-blur-md shadow-xl hover:border-teal-400/50 transition">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 text-base mb-2">
                  <i className="fa-solid fa-shield-heart"></i>
                </div>
                <h4 className="font-bold text-sm text-white">Trauma-Free Nurturing</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Zero harshness or intimidation. Our tutors use prophetic gentleness, consistent positive reinforcement, and engaging digital rewards.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/25 backdrop-blur-md shadow-xl hover:border-emerald-400/50 transition">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-base mb-2">
                  <i className="fa-solid fa-hands-holding-child"></i>
                </div>
                <h4 className="font-bold text-sm text-white">Practical Adab & Daily Duas</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Children practice real prophetic etiquette: honoring parents, daily morning/evening supplications, table manners, and respectful speech.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-teal-500/25 backdrop-blur-md shadow-xl hover:border-teal-400/50 transition">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 text-base mb-2">
                  <i className="fa-solid fa-comments"></i>
                </div>
                <h4 className="font-bold text-sm text-white">Direct Parent Briefings</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Direct channels with your child’s mentor. Receive continuous voice notes on memorization progress, homework notes, and character growth.
                </p>
              </div>
            </div>

            {/* بطاقة تقييم أولياء الأمور أسفل الكروت */}
            <div className="p-4 rounded-2xl bg-slate-900/85 border border-white/15 backdrop-blur-md flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-400/40 flex items-center justify-center text-white shrink-0 shadow-inner">
                <i className="fa-solid fa-user-group text-lg text-emerald-200"></i>
              </div>
              <div className="text-xs">
                <p className="italic text-slate-200 leading-relaxed">
                  "Raising kids abroad is tough, but Fazakkir gave our children authentic role models who embody Islam with compassion and excellence. Both our son and daughter eagerly wait for their sessions."
                </p>
                <span className="block mt-1 font-semibold text-emerald-400">
                  — Sister Mariam & Family (Melbourne, Australia)
                </span>
              </div>
            </div>

          </div>

          {/* ==========================================
              العمود الأيمن: الفورم في الأعلى + تحته حاسبة الأسعار والخصومات
              ========================================== */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* 1. نموذج الحجز في الأعلى */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/30 to-teal-500/20 rounded-3xl blur-2xl opacity-60" />
              <div className="relative">
                <LeadForm />
              </div>
            </div>

            {/* 2. صندوق خصومات العائلات مع رابط حاسبة الأسعار تحت الفورم مباشرة */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-400/40 backdrop-blur-md shadow-2xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <i className="fa-solid fa-gift text-amber-400 text-base"></i>
                  Sibling & Family Discounts
                </span>
                <span className="px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-xs font-bold">
                  Save Up to 20%
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Enrolling more than one child? We provide automated multi-student discounts and coordinated family schedules for your household.
              </p>

              <div className="pt-1">
                <Link
                  href="/pricing#calculator"
                  className="w-full inline-flex items-center justify-center gap-2.5 text-xs font-bold text-emerald-200 hover:text-white bg-emerald-950/80 hover:bg-emerald-800/60 border border-emerald-400/40 px-4 py-2.5 rounded-xl transition shadow-lg group"
                >
                  <i className="fa-solid fa-calculator text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Open Family Pricing Calculator</span>
                  <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* =========================================================================
          3. الشريط السفلي للضمان والراحة
          ========================================================================= */}
      <footer className="relative z-10 py-14 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Try 2 Free Sessions with Your Child Before Any Decision
          </h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-6">
            Meet the teacher, experience the interactive classroom, and see your child’s response first-hand with complete peace of mind.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5"><i className="fa-solid fa-check text-emerald-400"></i> No Credit Card Required</span>
            <span className="flex items-center gap-1.5"><i className="fa-solid fa-check text-emerald-400"></i> Change Tutor Anytime</span>
            <span className="flex items-center gap-1.5"><i className="fa-solid fa-check text-emerald-400"></i> Flexible Timings (24/7)</span>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          4. زر الواتساب العائم للتواصل المباشر
          ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center group">
        <a
          href={`https://wa.me/${waNumber}?text=${defaultMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact us on WhatsApp"
          className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-2xl shadow-emerald-950/60 hover:scale-110 active:scale-95 transition-all duration-300 ease-out"
        >
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none" />
          <i className="fa-brands fa-whatsapp text-3xl" />
        </a>

        <span className="absolute right-16 px-3 py-1.5 bg-slate-900/90 text-white text-xs font-semibold rounded-xl border border-slate-700 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap backdrop-blur-md">
          Chat with us 👋
        </span>
      </div>

    </div>
  );
}