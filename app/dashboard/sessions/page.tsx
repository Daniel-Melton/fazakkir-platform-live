"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ReportModal } from "@/components/dashboard/report-modal";
import { RescheduleModal } from "@/components/dashboard/reschedule-modal";

interface Session {
  id: string;
  enrollment_id: string;
  tutor_id: string;
  student_id: string;
  scheduled_at_utc: string;
  duration_minutes: number;
  status: string;
  meeting_url: string;
  student_attended: boolean | null;
  tutor_attended: boolean | null;
  students?: {
    student_name: string;
    level: string;
  };
  tutors?: {
    profiles?: {
      full_name: string;
    };
  };
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [selectedSessionForReport, setSelectedSessionForReport] = useState<Session | null>(null);
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] = useState<Session | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchSessions = useCallback(async (authToken: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/sessions", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data?.sessions) {
        setSessions(data.data.sessions);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
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
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile) setRole(profile.role);
        fetchSessions(session.access_token);
      }
    }
    init();
  }, [supabase, fetchSessions]);

  const filteredSessions = sessions.filter((s) => {
    if (filter === "all") return true;
    if (filter === "scheduled") return s.status === "scheduled";
    if (filter === "completed") return s.status === "completed";
    if (filter === "cancelled") return s.status.includes("cancelled");
    return true;
  });

  const stats = {
    total: sessions.length,
    scheduled: sessions.filter((s) => s.status === "scheduled").length,
    completed: sessions.filter((s) => s.status === "completed").length,
  };

  const getStatusBadge = (status: string) => {
    if (status === "scheduled") {
      return (
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
          مجدولة
        </span>
      );
    }
    if (status === "completed") {
      return (
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
          مكتملة
        </span>
      );
    }
    if (status.includes("cancelled")) {
      return (
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
          ملغية
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* 1. صف البطاقات الإحصائية المتناسق مع النمط المرجعي */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-[28px] bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <span className="text-xs font-bold text-slate-800">الحصص القادمة</span>
            <p className="text-[11px] text-slate-400 mt-0.5">مواعيد بانتظار الانعقاد</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.scheduled}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100/80">
              قادمة
            </span>
          </div>
        </div>

        <div className="p-6 rounded-[28px] bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <span className="text-xs font-bold text-slate-800">الحصص المنجزة</span>
            <p className="text-[11px] text-slate-400 mt-0.5">تم تقديمها بنجاح</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.completed}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/80">
              مكتملة
            </span>
          </div>
        </div>

        <div className="p-6 rounded-[28px] bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <span className="text-xs font-bold text-slate-800">إجمالي السجل</span>
            <p className="text-[11px] text-slate-400 mt-0.5">كافة الحصص المسجلة</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.total}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              حصة
            </span>
          </div>
        </div>
      </div>

      {/* 2. قسم عرض الحصص والفلاتر الكبسولية */}
      <div className="border border-slate-100/90 rounded-[32px] p-6 sm:p-8 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">جدول الحصص الأكاديمية</h2>
            <p className="text-xs text-slate-400 mt-0.5">استعراض المواعيد، روابط الدخول، وإدارة الحضور</p>
          </div>

          {/* فلاتر كبسولية */}
          <div className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-100 text-xs font-semibold gap-1 self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filter === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              الكل ({sessions.length})
            </button>
            <button
              onClick={() => setFilter("scheduled")}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filter === "scheduled"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              المجدولة ({stats.scheduled})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filter === "completed"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              المكتملة ({stats.completed})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">جاري تحميل الحصص...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200">
            لا توجد حصص مسجلة تطابق التحديد.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredSessions.map((session) => {
              const d = new Date(session.scheduled_at_utc);
              const dateStr = d.toLocaleDateString("ar-EG", {
                weekday: "short",
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              });
              const timeStr = d.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              });

              return (
                <div
                  key={session.id}
                  className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/40 transition gap-4"
                >
                  {/* معلومات الطالب والحصة */}
                  <div className="flex items-center gap-3.5 min-w-[200px]">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                      📖
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {session.students?.student_name || "طالب"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        المعلم: {session.tutors?.profiles?.full_name || "معلم معتمد"} • {session.duration_minutes} دقيقة
                      </div>
                    </div>
                  </div>

                  {/* التوقيت والتاريخ بنمط الكبسولة الموحد */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">{dateStr}</div>
                      <div className="text-[11px] font-semibold text-slate-400">{timeStr} UTC</div>
                    </div>
                    <div>{getStatusBadge(session.status)}</div>
                  </div>

                  {/* روابط وأزرار الإجراءات */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                    {session.meeting_url && session.status === "scheduled" && (
                      <a
                        href={session.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
                      >
                        دخول الحصة ↗
                      </a>
                    )}

                    {/* زر التقرير للمعلم */}
                    {(role === "tutor" || role === "academic_supervisor") && session.status === "scheduled" && (
                      <button
                        onClick={() => setSelectedSessionForReport(session)}
                        className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition"
                      >
                        كتابة تقرير 📝
                      </button>
                    )}

                    {/* زر طلب إعادة الجدولة لولي الأمر أو المعلم */}
                    {session.status === "scheduled" && (
                      <button
                        onClick={() => setSelectedSessionForReschedule(session)}
                        className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs font-bold rounded-xl transition"
                      >
                        طلب تعديل ⟳
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* المودالز القائمة بدون تغيير في الوظائف */}
      {selectedSessionForReport && (
        <ReportModal
          sessionId={selectedSessionForReport.id}
          isOpen={true}
          authToken={token}
          onClose={() => setSelectedSessionForReport(null)}
          onSuccess={() => {
            setSelectedSessionForReport(null);
            fetchSessions(token);
          }}
        />
      )}

      {selectedSessionForReschedule && (
        <RescheduleModal
          sessionId={selectedSessionForReschedule.id}
          scheduledAtUtc={selectedSessionForReschedule.scheduled_at_utc}
          isOpen={true}
          authToken={token}
          onClose={() => setSelectedSessionForReschedule(null)}
          onSuccess={() => {
            setSelectedSessionForReschedule(null);
            fetchSessions(token);
          }}
        />
      )}
    </div>
  );
}