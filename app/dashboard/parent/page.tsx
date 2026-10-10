"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

interface StudentOverview {
  id: string;
  student_name: string;
  level: string;
  total_sessions: number;
  completed_sessions: number;
  remaining_classes?: number;
  enrollment_status?: string;
  plan_tier?: string;
}

interface UpcomingSession {
  id: string;
  scheduled_at_utc: string;
  meeting_url: string;
  student_name: string;
  tutor_name: string;
  duration_minutes: number;
}

interface ParentOverviewData {
  students: StudentOverview[];
  upcoming_sessions: UpcomingSession[];
}

export default function ParentDashboardPage() {
  const [data, setData] = useState<ParentOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchOverview = useCallback(async (authToken: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/parent/overview", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load parent overview:", err);
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
        fetchOverview(session.access_token);
      } else {
        setLoading(false);
      }
    }
    init();
  }, [supabase, fetchOverview]);

  const students = data?.students || [];
  const upcomingSessions = data?.upcoming_sessions || [];

  const totalClassesRemaining = students.reduce(
    (acc, curr) => acc + (curr.remaining_classes || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* 1. صف البطاقات الإحصائية العلوية */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-[28px] bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <span className="text-xs font-bold text-slate-800">الأبناء المسجلون</span>
            <p className="text-[11px] text-slate-400 mt-0.5">الملفات النشطة في المنصة</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {students.length}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100/80">
              طالب
            </span>
          </div>
        </div>

        <div className="p-6 rounded-[28px] bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <span className="text-xs font-bold text-slate-800">الحصص القادمة</span>
            <p className="text-[11px] text-slate-400 mt-0.5">مواعيد بانتظار الانعقاد</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {upcomingSessions.length}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/80">
              مجدولة
            </span>
          </div>
        </div>

        <div className="p-6 rounded-[28px] bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <span className="text-xs font-bold text-slate-800">الرصيد المتبقي</span>
            <p className="text-[11px] text-slate-400 mt-0.5">إجمالي الحصص المتاحة</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {totalClassesRemaining}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100/80">
              حصة
            </span>
          </div>
        </div>
      </div>

      {/* 2. توزيع المحتوى: بطاقات الأبناء مع الحصص القادمة */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* العمود الأكبر: بطاقات الأبناء واشتراكاتهم */}
        <section className="lg:col-span-8 border border-slate-100/90 rounded-[32px] p-6 sm:p-8 bg-white shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">متابعة الأبناء</h2>
              <p className="text-xs text-slate-400 mt-0.5">مستوى التقدم والاشتراكات الحالية لكل طالب</p>
            </div>
            <Link
              href="/booking/trial"
              className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition shadow-sm"
            >
              + تسجيل ابن جديد
            </Link>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">جاري تحميل بيانات الأبناء...</div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200">
              لم يتم تسجيل أي طالب حتى الآن.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map((st) => (
                <div
                  key={st.id}
                  className="p-5 rounded-[24px] border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-white transition flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                        {st.student_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{st.student_name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">المستوى: {st.level}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {st.plan_tier || "خطة أساسية"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100/80 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">الحصص المكتملة</span>
                      <span className="font-bold text-slate-800">{st.completed_sessions} حصة</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">الحصص المتبقية</span>
                      <span className="font-bold text-emerald-600">{st.remaining_classes || 0} حصة</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Link
                      href="/dashboard/sessions"
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white transition"
                    >
                      جدول المواعيد
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* العمود الجانبي: ويدجت الحصص القادمة بنمط Bookings المرجعي */}
        <aside className="lg:col-span-4 border border-slate-100/90 rounded-[32px] p-6 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900">الحصص القادمة</h3>
              <p className="text-[10px] text-slate-400">مواعيد مباشرة للأبناء</p>
            </div>
            <Link href="/dashboard/sessions" className="text-xs font-bold text-slate-400 hover:text-slate-700">
              عرض الكل ›
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">تحميل المواعيد...</div>
          ) : upcomingSessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              لا توجد حصص مجدولة قريباً
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => {
                const d = new Date(session.scheduled_at_utc);
                const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
                const date = d.toLocaleDateString("ar-EG", { month: "short", day: "numeric", timeZone: "UTC" });

                return (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-white transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          📖
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{session.student_name}</div>
                          <div className="text-[10px] text-slate-400">المعلم: {session.tutor_name}</div>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/80">
                          {time} UTC
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{date}</div>
                      </div>
                    </div>

                    {session.meeting_url && (
                      <a
                        href={session.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
                      >
                        دخول الحصة المباشرة ↗
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}