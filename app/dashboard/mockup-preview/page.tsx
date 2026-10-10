"use client";

import React, { useState } from "react";

export default function MockupPreviewPage() {
  const [currentSection, setCurrentSection] = useState<"calendar" | "students" | "tutors" | "reports">("calendar");
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [selectedDayNum, setSelectedDayNum] = useState<number>(18);
  
  const [filterTrials, setFilterTrials] = useState(true);
  const [filterCore, setFilterCore] = useState(true);
  const [filterReviews, setFilterReviews] = useState(true);
  const [isReminderVisible, setIsReminderVisible] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const daysOfWeek = [
    { name: "الاثنين", day: 16 },
    { name: "الثلاثاء", day: 17 },
    { name: "الأربعاء", day: 18 },
    { name: "الخميس", day: 19 },
  ];

  return (
    <div className="min-h-screen bg-[#EFF2F4] p-3 sm:p-6 lg:p-7 dir-rtl text-right antialiased text-slate-700 flex items-center justify-center relative font-['Readex_Pro',sans-serif]">
      
      {/* استيراد الخط العصري المريح Readex Pro و Plus Jakarta Sans والأنيميشن البطيء */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&family=Readex+Pro:wght@300;400;500;600;700&display=swap');
        
        body, input, button, select {
          font-family: 'Readex Pro', -apple-system, sans-serif !important;
          letter-spacing: -0.01em;
        }

        .font-num {
          font-family: 'Plus Jakarta Sans', 'Readex Pro', sans-serif !important;
        }

        @keyframes drawHandCircle {
          0% {
            stroke-dashoffset: 170;
            opacity: 0.1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        .animate-hand-draw {
          stroke-dasharray: 170;
          stroke-dashoffset: 170;
          animation: drawHandCircle 1.4s cubic-bezier(0.25, 1, 0.4, 1) forwards;
          transform-origin: center;
        }
      `}</style>

      {/* Toast تفاعلي */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-full shadow-xl transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* الحاوية الأساسية للجزر العائمة */}
      <div className="w-full max-w-[1420px] flex gap-5 min-h-[850px]">
        
        {/* الجزيرة 1: الشريط الجانبي الأيقوني المستقل */}
        <aside className="hidden md:flex flex-col items-center justify-between py-5 px-2 bg-white rounded-[28px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60 w-16 shrink-0">
          <div className="space-y-6 flex flex-col items-center w-full">
            {/* الشعار بالأخضر الزمردي #059492 */}
            <div 
              onClick={() => showToast("أكاديمية فذكّر")}
              className="w-11 h-11 rounded-2xl bg-[#059492] flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer hover:opacity-90 transition"
            >
              ف
            </div>

            <nav className="flex flex-col items-center gap-3 w-full">
              <button 
                title="الجدول والمواعيد"
                onClick={() => { setCurrentSection("calendar"); showToast("جدول الحصص والتقويم"); }}
                style={{
                  backgroundColor: currentSection === "calendar" ? "#2D8CFF" : "transparent",
                  color: currentSection === "calendar" ? "#ffffff" : "#94A3B8"
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-base transition-transform duration-200 shadow-2xs ${
                  currentSection === "calendar" ? "hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20" : "hover:text-slate-700"
                }`}
              >
                📅
              </button>

              <button 
                title="إدارة الطلاب"
                onClick={() => { setCurrentSection("students"); showToast("شؤون الطلاب"); }}
                style={{
                  backgroundColor: currentSection === "students" ? "#2D8CFF" : "transparent",
                  color: currentSection === "students" ? "#ffffff" : "#94A3B8"
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-base transition-transform duration-200 shadow-2xs ${
                  currentSection === "students" ? "hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20" : "hover:text-slate-700"
                }`}
              >
                👥
              </button>

              <button 
                title="المعلمون والتوفر"
                onClick={() => { setCurrentSection("tutors"); showToast("جدول المعلمين"); }}
                style={{
                  backgroundColor: currentSection === "tutors" ? "#2D8CFF" : "transparent",
                  color: currentSection === "tutors" ? "#ffffff" : "#94A3B8"
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-base transition-transform duration-200 shadow-2xs ${
                  currentSection === "tutors" ? "hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20" : "hover:text-slate-700"
                }`}
              >
                ⏱️
              </button>

              <button 
                title="التقارير"
                onClick={() => { setCurrentSection("reports"); showToast("التقارير الأكاديمية"); }}
                style={{
                  backgroundColor: currentSection === "reports" ? "#2D8CFF" : "transparent",
                  color: currentSection === "reports" ? "#ffffff" : "#94A3B8"
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-base transition-transform duration-200 shadow-2xs ${
                  currentSection === "reports" ? "hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20" : "hover:text-slate-700"
                }`}
              >
                📊
              </button>
            </nav>
          </div>

          <div className="space-y-2.5 flex flex-col items-center w-full">
            <button 
              onClick={() => showToast("الإعدادات العامة")}
              className="w-9 h-9 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm transition"
            >
              ⚙️
            </button>
            <button 
              onClick={() => showToast("الدعم الفني")}
              className="w-9 h-9 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm transition"
            >
              🎧
            </button>
          </div>
        </aside>

        {/* المساحة الرئيسية المتضمنة بقية الجزر */}
        <div className="flex-1 flex flex-col gap-5">
          
          {/* الجزيرة 2: شريط الرأس العائم المستقل */}
          <header className="bg-white rounded-[24px] px-6 py-3.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 bg-[#F6F8F9] px-3.5 py-1.5 rounded-full border border-slate-200/60 w-full sm:w-72 text-xs focus-within:border-[#059492] transition-colors">
              <span className="text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="ابحث عن طالب أو حصة..."
                className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400 font-light text-xs"
              />
              <span className="text-[10px] font-medium bg-white px-1.5 py-0.5 rounded text-slate-400 border border-slate-200">
                ⌘K
              </span>
            </div>

            <div className="flex items-center gap-3 relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative w-9 h-9 rounded-full bg-[#F6F8F9] border border-slate-200/60 flex items-center justify-center text-slate-500 hover:bg-white transition text-xs"
              >
                🔔
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2D8CFF] ring-2 ring-white animate-pulse" />
              </button>

              {isNotifOpen && (
                <div className="absolute left-0 top-11 w-64 bg-white rounded-2xl p-3 shadow-xl border border-slate-100 z-50 animate-in fade-in">
                  <div className="text-xs font-semibold text-slate-800 pb-2 border-b border-slate-100 flex justify-between">
                    <span>التنبيهات</span>
                    <span className="text-[10px] text-[#059492] font-medium">2 جديدة</span>
                  </div>
                  <div className="space-y-1.5 mt-2 text-xs">
                    <div className="p-2 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                      <div className="font-semibold text-slate-700">حجز تجربة جديدة</div>
                      <div className="text-[10px] text-slate-500 font-light">الطالب عمر فاروق • غداً 09:00 AM</div>
                    </div>
                  </div>
                </div>
              )}

              <div 
                onClick={() => showToast("الملف الشخصي")}
                className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#059492] font-semibold text-xs flex items-center justify-center border border-emerald-200/60">
                  أ
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-800 block leading-tight">أحمد المشرف</span>
                  <span className="text-[10px] text-slate-400 font-light">مشرف أكاديمي</span>
                </div>
              </div>
            </div>
          </header>

          {/* منطقة الجزر الداخلية */}
          {currentSection === "calendar" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1 transition-all duration-300">
              
              {/* العمود الأيمن: جزر الأدوات والتقويم */}
              <div className="lg:col-span-4 flex flex-col gap-5">
                
                {/* الجزيرة 3: التقويم المصغر برسمة القلم اليدوية العفوية (Hand-drawn Loop) */}
                <div className="p-5 rounded-[26px] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60">
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-semibold text-slate-800">يونيو 2026</span>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <button 
                        onClick={() => showToast("الشهر السابق")}
                        className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center transition"
                      >
                        ‹
                      </button>
                      <button 
                        onClick={() => showToast("الشهر التالي")}
                        className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center transition"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate-400 mb-2">
                    <span>س</span><span>ح</span><span>ن</span><span>ث</span><span>ر</span><span>خ</span><span>ج</span>
                  </div>

                  {/* أيام التقويم برسم القلم غير المنتظم */}
                  <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-slate-600 font-num">
                    <span className="p-1 text-slate-300 flex items-center justify-center">31</span>
                    {[...Array(27)].map((_, i) => {
                      const dayNum = i + 1;
                      const isSelected = selectedDayNum === dayNum;
                      return (
                        <div key={dayNum} className="relative flex items-center justify-center h-8">
                          <button
                            onClick={() => {
                              setSelectedDayNum(dayNum);
                              showToast(`يوم ${dayNum} يونيو`);
                            }}
                            className={`relative z-10 w-7 h-7 flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? "text-slate-900 font-semibold text-[11px]"
                                : "hover:text-slate-900 text-slate-600 font-normal text-xs hover:bg-slate-100/60 rounded-full"
                            }`}
                          >
                            {dayNum}
                          </button>

                          {/* مسار القلم اليدوي الملتف العفوي غير المتساوي بنهايات متقاطعة */}
                          {isSelected && (
                            <svg
                              key={`hand-draw-${dayNum}`}
                              className="absolute inset-0 w-10 h-10 m-auto pointer-events-none -rotate-6"
                              viewBox="0 0 50 50"
                              fill="none"
                            >
                              <path
                                d="M 12 17 
                                   C 10 28, 14 42, 26 43 
                                   C 37 44, 45 35, 43 23 
                                   C 41 12, 27 8, 16 11 
                                   C 8 13, 7 24, 15 28 
                                   C 19 30, 24 30, 30 28"
                                stroke="#FFB06B"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="animate-hand-draw"
                              />
                            </svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* الجزيرة 4: بطاقة التنبيه النشطة */}
                {isReminderVisible ? (
                  <div className="p-4 rounded-[26px] bg-[#059492] text-white shadow-[0_6px_25px_-6px_rgba(5,148,146,0.3)] relative overflow-hidden transition-all duration-300 border border-[#059492]">
                    <span className="text-[10px] font-light text-emerald-100 block mb-0.5">
                      تنبيه بموعد الحصة
                    </span>
                    <h4 className="text-sm font-semibold mb-1 leading-snug">جلسة تجريبية: نور الهدى</h4>
                    <div className="text-[11px] text-emerald-50 font-light mb-3.5">
                      ⏱️ 09:00 - 09:30 UTC
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-white/20">
                      <div className="flex -space-x-1.5 space-x-reverse">
                        <span className="w-6 h-6 rounded-full bg-emerald-800 border border-white/40 flex items-center justify-center text-[9px] font-medium">ط1</span>
                        <span className="w-6 h-6 rounded-full bg-emerald-900 border border-white/40 flex items-center justify-center text-[9px] font-medium">م</span>
                        <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-[8px] font-medium">+2</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => { setIsReminderVisible(false); showToast("تم إخفاء التنبيه"); }}
                          className="w-6 h-6 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center hover:bg-white/30 transition font-bold"
                        >
                          ✕
                        </button>
                        <button 
                          onClick={() => showToast("فتح غرفة الزووم")}
                          className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center hover:bg-slate-800 transition font-bold"
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsReminderVisible(true)}
                    className="w-full py-2.5 rounded-[22px] bg-white border border-dashed border-[#059492]/40 text-[#059492] text-xs font-medium hover:bg-emerald-50/30 transition shadow-2xs"
                  >
                    + استعادة بطاقة التنبيه
                  </button>
                )}

                {/* الجزيرة 5: قائمة الفلاتر المستقلة */}
                <div className="p-4 rounded-[26px] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 space-y-2.5">
                  <span className="text-xs font-semibold text-slate-800 block">فلاتر الحصص</span>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none font-light">
                    <input 
                      type="checkbox" 
                      checked={filterTrials} 
                      onChange={(e) => setFilterTrials(e.target.checked)}
                      className="rounded accent-[#059492] w-3.5 h-3.5 cursor-pointer" 
                    />
                    <span>الحصص التجريبية</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none font-light">
                    <input 
                      type="checkbox" 
                      checked={filterCore} 
                      onChange={(e) => setFilterCore(e.target.checked)}
                      className="rounded accent-[#059492] w-3.5 h-3.5 cursor-pointer" 
                    />
                    <span>الاشتراكات الأساسية</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none font-light">
                    <input 
                      type="checkbox" 
                      checked={filterReviews} 
                      onChange={(e) => setFilterReviews(e.target.checked)}
                      className="rounded accent-[#059492] w-3.5 h-3.5 cursor-pointer" 
                    />
                    <span>جلسات المراجعة</span>
                  </label>
                </div>

              </div>

              {/* العمود الأيسر: جدول المواعيد */}
              <div className="lg:col-span-8 p-5 sm:p-6 rounded-[28px] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 space-y-4">
                
                {/* رأس الجدول */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">
                      الأربعاء، {selectedDayNum} يونيو 2026
                    </h3>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <button 
                        onClick={() => setSelectedDayNum((prev) => Math.max(1, prev - 1))}
                        className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center transition"
                      >
                        ‹
                      </button>
                      <button 
                        onClick={() => setSelectedDayNum((prev) => Math.min(30, prev + 1))}
                        className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center transition"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* التبديل بين العروض */}
                    <div className="flex items-center bg-[#F6F8F9] p-1 rounded-full border border-slate-200/60 text-xs text-slate-500 font-light">
                      <button
                        onClick={() => { setViewMode("daily"); showToast("العرض اليومي"); }}
                        className={`px-3 py-1 rounded-full transition ${viewMode === "daily" ? "bg-white text-slate-800 shadow-2xs font-semibold" : "hover:text-slate-700"}`}
                      >
                        يومي
                      </button>
                      <button
                        onClick={() => { setViewMode("weekly"); showToast("العرض الأسبوعي"); }}
                        className={`px-3 py-1 rounded-full transition ${viewMode === "weekly" ? "bg-white text-slate-800 shadow-2xs font-semibold" : "hover:text-slate-700"}`}
                      >
                        أسبوعي
                      </button>
                      <button
                        onClick={() => { setViewMode("monthly"); showToast("العرض الشهري"); }}
                        className={`px-3 py-1 rounded-full transition ${viewMode === "monthly" ? "bg-white text-slate-800 shadow-2xs font-semibold" : "hover:text-slate-700"}`}
                      >
                        شهري
                      </button>
                    </div>

                    {/* زر إنشاء موعد بالأزرق مع حركة Pop-up فقط */}
                    <button 
                      onClick={() => setIsScheduleModalOpen(true)}
                      style={{ backgroundColor: "#2D8CFF" }}
                      className="px-4 py-1.5 text-white font-medium text-xs rounded-full transition-transform duration-200 hover:scale-105 active:scale-95 shadow-sm shadow-blue-500/20"
                    >
                      + إنشاء موعد
                    </button>
                  </div>
                </div>

                {/* أيام الأسبوع الأربعة */}
                {viewMode === "weekly" && (
                  <div className="grid grid-cols-4 gap-2.5 text-center">
                    {daysOfWeek.map((d, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedDayNum(d.day)}
                        className={`py-2.5 px-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                          d.day === selectedDayNum
                            ? "bg-[#F0FAF9] border-[#059492]/40 shadow-2xs scale-[1.01]"
                            : "bg-[#FAFCFB] border-slate-100 hover:bg-white hover:border-slate-200"
                        }`}
                      >
                        <span className="text-[11px] font-light text-slate-400 block">{d.name}</span>
                        <span className={`text-base font-semibold block mt-0.5 font-num ${d.day === selectedDayNum ? "text-[#059492]" : "text-slate-700"}`}>
                          {d.day}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* كروت الحصص المرفوعة بنمط الباستيل المريح وبخط ناعم */}
                <div className="space-y-2.5 pt-1">
                  
                  {/* 1. تجربة جديدة */}
                  {filterTrials && (
                    <div className="p-3.5 rounded-2xl bg-[#EBF4FF] border border-blue-200/70 shadow-2xs flex items-center justify-between hover:border-blue-300 transition group">
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-semibold text-slate-800">مراجعة التجويد - الطالب عمر فاروق</h5>
                        <div className="text-[11px] text-blue-800 font-light font-num">
                          ⏱️ 09:00 - 09:30 • الشيخ مصطفى
                        </div>
                      </div>
                      <button 
                        onClick={() => showToast("دخول الحصة")}
                        style={{ color: "#2D8CFF" }}
                        className="px-3 py-1 rounded-xl bg-white font-medium text-xs shadow-2xs hover:scale-105 active:scale-95 transition-transform border border-blue-100"
                      >
                        دخول ↗
                      </button>
                    </div>
                  )}

                  {/* 2. حصة أساسية */}
                  {filterCore && (
                    <div className="p-3.5 rounded-2xl bg-[#EFEBF9] border border-purple-200/70 shadow-2xs flex items-center justify-between hover:border-purple-300 transition">
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-semibold text-slate-800">حفظ سورة الكهف - الطالبة سارة أحمد</h5>
                        <div className="text-[11px] text-purple-800 font-light font-num">
                          ⏱️ 10:00 - 10:45 • أ. خديجة
                        </div>
                      </div>
                      <button 
                        onClick={() => showToast("دخول الحصة")}
                        className="px-3 py-1 rounded-xl bg-white text-purple-800 text-xs font-medium shadow-2xs hover:scale-105 active:scale-95 transition-transform border border-purple-100"
                      >
                        دخول ↗
                      </button>
                    </div>
                  )}

                  {/* 3. لغة عربية */}
                  {filterCore && (
                    <div className="p-3.5 rounded-2xl bg-[#F0F7FF] border border-blue-200/60 shadow-2xs flex items-center justify-between hover:border-blue-300 transition">
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-semibold text-slate-800">القراءة والنطق السليم - الطالب زين كريم</h5>
                        <div className="text-[11px] text-blue-900 font-light font-num">
                          ⏱️ 11:00 - 12:00 • أ. طارق
                        </div>
                      </div>
                      <button 
                        onClick={() => showToast("دخول الحصة")}
                        style={{ color: "#2D8CFF" }}
                        className="px-3 py-1 rounded-xl bg-white text-xs font-medium shadow-2xs hover:scale-105 active:scale-95 transition-transform border border-blue-100"
                      >
                        دخول ↗
                      </button>
                    </div>
                  )}

                  {/* 4. تقييم دوري */}
                  {filterReviews && (
                    <div className="p-3.5 rounded-2xl bg-[#FDECF2] border border-pink-200/70 shadow-2xs flex items-center justify-between hover:border-pink-300 transition">
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-semibold text-slate-800">اختبار جزء عم - الطالب يوسف إبراهيم</h5>
                        <div className="text-[11px] text-pink-900 font-light font-num">
                          ⏱️ 01:00 - 01:45 • المشرف: أحمد
                        </div>
                      </div>
                      <button 
                        onClick={() => showToast("كتابة التقرير")}
                        className="px-3 py-1 rounded-xl bg-white text-pink-800 text-xs font-medium shadow-2xs hover:scale-105 active:scale-95 transition-transform border border-pink-100"
                      >
                        تقرير 📝
                      </button>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* محتوى قسم شؤون الطلاب */}
          {currentSection === "students" && (
            <div className="p-6 rounded-[28px] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">قائمة الطلاب</h3>
                <button 
                  onClick={() => showToast("إضافة طالب")}
                  style={{ backgroundColor: "#059492" }}
                  className="px-3.5 py-1.5 text-white text-xs font-medium rounded-full shadow-2xs hover:opacity-90 transition"
                >
                  + طالب جديد
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  { name: "عمر فاروق", level: "مبتدئ - نور البيان", tutor: "الشيخ مصطفى", status: "حصة تجريبية" },
                  { name: "سارة أحمد", level: "متوسط - حفظ الكهف", tutor: "أ. خديجة", status: "اشتراك نشط" },
                  { name: "زين كريم", level: "لغة عربية وقراءة", tutor: "أ. طارق", status: "اشتراك نشط" },
                  { name: "يوسف إبراهيم", level: "متقدم - إتقان التجويد", tutor: "أحمد المشرف", status: "مراجعة دورية" },
                ].map((st, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[#FBFDFD] border border-slate-200/70 shadow-2xs flex items-center justify-between hover:border-[#059492]/40 transition">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#E6F4FA] text-sky-800 flex items-center justify-center font-semibold text-xs">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{st.name}</div>
                        <div className="text-[11px] text-slate-400 font-light">{st.level} • {st.tutor}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-[#059492] border border-emerald-100">
                      {st.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* محتوى قسم المعلمين */}
          {currentSection === "tutors" && (
            <div className="p-6 rounded-[28px] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">جاهزية المعلمين</h3>
                <span className="text-xs text-slate-400 font-light">4 معلمين</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                  { name: "الشيخ مصطفى", slots: "09:00 - 15:00 UTC", active: true },
                  { name: "أ. خديجة", slots: "10:00 - 16:00 UTC", active: true },
                  { name: "أ. طارق", slots: "11:00 - 18:00 UTC", active: true },
                  { name: "أ. فاطمة", slots: "غير متاح اليوم", active: false },
                ].map((t, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#FBFDFD] border border-slate-200/70 shadow-2xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2D8CFF] flex items-center justify-center font-semibold text-xs border border-blue-100">
                        {t.name.charAt(0)}
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${t.active ? "bg-emerald-50 text-[#059492] border border-emerald-100" : "bg-slate-100 text-slate-400"}`}>
                        {t.active ? "متاح" : "عطلة"}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{t.name}</div>
                      <div className="text-[11px] text-slate-400 font-light mt-0.5 font-num">{t.slots}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* محتوى قسم التقارير */}
          {currentSection === "reports" && (
            <div className="p-6 rounded-[28px] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 space-y-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-semibold text-slate-800 pb-2 border-b border-slate-100">
                مؤشرات الأداء الأكاديمي
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#E6F4FA] border border-sky-200/70">
                  <span className="text-xs text-sky-800 font-medium">الحصص المكتملة</span>
                  <div className="text-2xl font-semibold text-slate-800 mt-1 font-num">128 حصة</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#EFEBF9] border border-purple-200/70">
                  <span className="text-xs text-purple-800 font-medium">نسبة الحضور</span>
                  <div className="text-2xl font-semibold text-slate-800 mt-1 font-num">97.4%</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#F0F7FF] border border-blue-200/70">
                  <span className="text-xs text-blue-800 font-medium">الاشتراكات المجددة</span>
                  <div className="text-2xl font-semibold text-slate-800 mt-1 font-num">42 طالب</div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* مودال جدولة حصة */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[28px] p-5 max-w-sm w-full shadow-xl border border-slate-100 space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-semibold text-slate-800">جدولة حصة جديدة</h4>
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-light text-slate-500 block mb-1">اسم الطالب:</label>
                <input 
                  type="text" 
                  defaultValue="عمر فاروق" 
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-normal outline-none"
                />
              </div>

              <div>
                <label className="font-light text-slate-500 block mb-1">المعلم:</label>
                <select className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-normal outline-none">
                  <option>الشيخ مصطفى (تجويد وقرآن)</option>
                  <option>أ. خديجة (حفظ وقراءات)</option>
                  <option>أ. طارق (لغة عربية)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 text-xs font-light text-slate-500 hover:bg-slate-50 rounded-xl"
              >
                إلغاء
              </button>
              <button 
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  showToast("تمت الجدولة بنجاح!");
                }}
                style={{ backgroundColor: "#2D8CFF" }}
                className="px-4 py-1.5 text-white text-xs font-medium rounded-xl shadow-2xs hover:scale-105 active:scale-95 transition-transform"
              >
                تأكيد ✓
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}