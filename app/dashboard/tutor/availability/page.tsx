"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface DayAvailability {
  day_of_week: number; // 0 = Sunday, 1 = Monday, ...
  is_available: boolean;
  slots: TimeSlot[];
}

const DAYS_NAMES = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export default function TutorAvailabilityPage() {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchAvailability = useCallback(async (authToken: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/tutors/me/availability", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success && data.data?.availability) {
        setAvailability(data.data.availability);
      } else {
        // تهيئة افتراضية لجميع أيام الأسبوع في حال لم تكن مسجلة مسبقاً
        const initialDays: DayAvailability[] = Array.from({ length: 7 }, (_, i) => ({
          day_of_week: i,
          is_available: false,
          slots: [],
        }));
        setAvailability(initialDays);
      }
    } catch (err) {
      console.error("Failed to fetch availability:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setToken(session.access_token);
        fetchAvailability(session.access_token);
      } else {
        setLoading(false);
      }
    }
    init();
  }, [supabase, fetchAvailability]);

  const currentDayData = availability.find((d) => d.day_of_week === selectedDay) || {
    day_of_week: selectedDay,
    is_available: false,
    slots: [],
  };

  const handleToggleDayAvailable = (isAvailable: boolean) => {
    setAvailability((prev) =>
      prev.map((d) =>
        d.day_of_week === selectedDay ? { ...d, is_available: isAvailable } : d
      )
    );
  };

  const handleAddSlot = () => {
    const defaultStart = "09:00";
    const defaultEnd = "17:00";
    setAvailability((prev) =>
      prev.map((d) =>
        d.day_of_week === selectedDay
          ? {
              ...d,
              is_available: true,
              slots: [...d.slots, { start_time: defaultStart, end_time: defaultEnd }],
            }
          : d
      )
    );
  };

  const handleRemoveSlot = (index: number) => {
    setAvailability((prev) =>
      prev.map((d) =>
        d.day_of_week === selectedDay
          ? {
              ...d,
              slots: d.slots.filter((_, i) => i !== index),
            }
          : d
      )
    );
  };

  const handleSlotChange = (index: number, field: "start_time" | "end_time", value: string) => {
    setAvailability((prev) =>
      prev.map((d) =>
        d.day_of_week === selectedDay
          ? {
              ...d,
              slots: d.slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
            }
          : d
      )
    );
  };

  const handleSave = async () => {
    if (!token) return;
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch("/api/v1/tutors/me/availability", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ availability }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: "تم حفظ أوقات التوفر بنجاح" });
      } else {
        setMessage({ type: "error", text: data.error || "حدث خطأ أثناء الحفظ" });
      }
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: "error", text: "فشل الاتصال بالخادم" });
    } finally {
      setSaving(false);
    }
  };

  // إحصائيات سريعة للبطاقات
  const activeDaysCount = availability.filter((d) => d.is_available && d.slots.length > 0).length;
  const totalSlotsCount = availability.reduce((acc, d) => acc + (d.is_available ? d.slots.length : 0), 0);

  return (
    <div className="space-y-8">
      {/* 1. صف البطاقات الإحصائية العلوية */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-[28px] bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <span className="text-xs font-bold text-slate-800">أيام العمل المحددة</span>
            <p className="text-[11px] text-slate-400 mt-0.5">الأيام النشطة للتدريس أسبوعياً</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {activeDaysCount} / 7
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100/80">
              أيام
            </span>
          </div>
        </div>

        <div className="p-6 rounded-[28px] bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <span className="text-xs font-bold text-slate-800">الفترات المتاحة</span>
            <p className="text-[11px] text-slate-400 mt-0.5">إجمالي نوافذ التفرغ المفتوحة</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {totalSlotsCount}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/80">
              فترة
            </span>
          </div>
        </div>

        <div className="p-6 rounded-[28px] bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <span className="text-xs font-bold text-slate-800">حالة التوفر العام</span>
            <p className="text-[11px] text-slate-400 mt-0.5">جاهزية الحساب لاستقبال الطلاب</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {activeDaysCount > 0 ? "جاهز للتسكين" : "غير متاح"}
            </span>
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                activeDaysCount > 0
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100/80"
                  : "bg-amber-50 text-amber-600 border-amber-100/80"
              }`}
            >
              {activeDaysCount > 0 ? "نشط" : "معلق"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. منطقة الإعداد وتحديد الساعات */}
      <div className="border border-slate-100/90 rounded-[32px] p-6 sm:p-8 bg-white shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">إدارة أوقات التوفر الأسبوعية</h2>
            <p className="text-xs text-slate-400 mt-0.5">حدد الساعات المناسبة لك بتوقيت UTC لتسكين حصص الطلاب التجريبية والأساسية</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : "حفظ التغييرات ✓"}
          </button>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold border ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">جاري تحميل جدول التوفر...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* اختيار اليوم عبر أزرار كبسولية */}
            <div className="lg:col-span-4 space-y-2">
              <span className="text-xs font-bold text-slate-400 block mb-2">أيام الأسبوع:</span>
              <div className="flex flex-col gap-1.5">
                {DAYS_NAMES.map((name, index) => {
                  const dayData = availability.find((d) => d.day_of_week === index);
                  const isDayAvailable = dayData?.is_available && (dayData?.slots.length || 0) > 0;
                  const isSelected = selectedDay === index;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedDay(index)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold transition border ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-slate-50/50 hover:bg-slate-50 text-slate-700 border-slate-100"
                      }`}
                    >
                      <span className="text-sm">{name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : isDayAvailable
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isDayAvailable ? "متاح" : "عطلة"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* تحديد الفترات لليوم المختار */}
            <div className="lg:col-span-8 p-6 rounded-[28px] border border-slate-100 bg-slate-50/40 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    أوقات يوم {DAYS_NAMES[selectedDay]}
                  </h3>
                  <span className="text-[11px] text-slate-400">توقيت UTC</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 cursor-pointer">
                    متاح في هذا اليوم:
                  </label>
                  <input
                    type="checkbox"
                    checked={currentDayData.is_available}
                    onChange={(e) => handleToggleDayAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
                </div>
              </div>

              {!currentDayData.is_available ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  تم تحديد هذا اليوم كيوم عطلة. فعّل خيار التوفر بالأعلى لإضافة ساعات العمل.
                </div>
              ) : (
                <div className="space-y-4">
                  {currentDayData.slots.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                      لا توجد فترات عمل محددة لهذا اليوم. أضف فترة جديدة بالأسفل.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {currentDayData.slots.map((slot, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-xs"
                        >
                          <span className="text-xs font-bold text-slate-400 w-6 text-center">
                            #{sIdx + 1}
                          </span>
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[11px] text-slate-400">من:</span>
                            <input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => handleSlotChange(sIdx, "start_time", e.target.value)}
                              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none font-bold text-slate-800"
                            />
                            <span className="text-[11px] text-slate-400 mr-2">إلى:</span>
                            <input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => handleSlotChange(sIdx, "end_time", e.target.value)}
                              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none font-bold text-slate-800"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(sIdx)}
                            className="w-8 h-8 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 flex items-center justify-center font-bold text-xs transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-900 text-slate-600 hover:text-slate-900 text-xs font-bold transition bg-white"
                  >
                    + إضافة فترة عمل جديدة
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}