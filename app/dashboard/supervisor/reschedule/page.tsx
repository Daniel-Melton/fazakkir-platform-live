"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface RescheduleRequest {
  id: string;
  session_id: string;
  requested_by_role: "student" | "tutor" | "academic_supervisor";
  requested_by_id: string;
  reason: string;
  proposed_slot_utc: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  session?: {
    scheduled_at_utc: string;
    students?: {
      student_name: string;
    };
    tutors?: {
      profiles?: {
        full_name: string;
      };
    };
  };
}

export default function SupervisorReschedulePage() {
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchRequests = useCallback(async (authToken: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/reschedule-requests", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success && data.data?.requests) {
        setRequests(data.data.requests);
      }
    } catch (err) {
      console.error("Failed to load reschedule requests:", err);
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
        fetchRequests(session.access_token);
      } else {
        setLoading(false);
      }
    }
    init();
  }, [supabase, fetchRequests]);

  const handleAction = async (requestId: string, status: "approved" | "rejected") => {
    if (!token) return;
    const confirmed = confirm(
      status === "approved"
        ? "هل أنت متأكد من قبول الطلب وتحديث موعد الحصة رسمياً؟"
        : "هل أنت متأكد من رفض طلب إعادة الجدولة؟"
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(requestId);
      const res = await fetch(`/api/v1/reschedule-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          admin_notes: status === "approved" ? "تمت الموافقة من المشرف الأكاديمي" : "تم رفض الطلب لتعارض الجدول",
        }),
      });

      if (res.ok) {
        await fetchRequests(token);
      } else {
        const err = await res.json();
        alert(`فشل اتخاذ الإجراء: ${err.error || "خطأ غير متوقع"}`);
      }
    } catch (err) {
      console.error("Error updating reschedule request:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-8">
      {/* 1. صف البطاقات الإحصائية العلوية */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-[28px] bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <span className="text-xs font-bold text-slate-800">طلبات بانتظار المراجعة</span>
            <p className="text-[11px] text-slate-400 mt-0.5">تحتاج قراراً فورياً من المشرف</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.pending}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100/80">
              معلقة
            </span>
          </div>
        </div>

        <div className="p-6 rounded-[28px] bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <span className="text-xs font-bold text-slate-800">الطلبات المقبولة</span>
            <p className="text-[11px] text-slate-400 mt-0.5">تم تعديل مواعيدها بنجاح</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.approved}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/80">
              مقبولة
            </span>
          </div>
        </div>

        <div className="p-6 rounded-[28px] bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <span className="text-xs font-bold text-slate-800">الطلبات المعتذر عنها</span>
            <p className="text-[11px] text-slate-400 mt-0.5">تعذر تعديل الموعد</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.rejected}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100/80">
              مرفوضة
            </span>
          </div>
        </div>
      </div>

      {/* 2. منطقة عرض الطلبات والفلاتر الكبسولية */}
      <div className="border border-slate-100/90 rounded-[32px] p-6 sm:p-8 bg-white shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">طلبات إعادة جدولة الحصص</h2>
            <p className="text-xs text-slate-400 mt-0.5">استعراض طلبات المعلمين وأولياء الأمور لتغيير المواعيد واتخاذ القرار</p>
          </div>

          {/* فلاتر الحالات الكبسولية */}
          <div className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-100 text-xs font-semibold gap-1 self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filter === "pending"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              المعلقة ({stats.pending})
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filter === "approved"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              المقبولة ({stats.approved})
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filter === "rejected"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              المرفوضة ({stats.rejected})
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filter === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              الكل ({requests.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">جاري تحميل الطلبات...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200">
            لا توجد طلبات في هذا القسم حالياً.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const currentOldDate = req.session?.scheduled_at_utc
                ? new Date(req.session.scheduled_at_utc)
                : null;
              const proposedDate = new Date(req.proposed_slot_utc);

              const isPending = req.status === "pending";
              const isActionLoading = actionLoadingId === req.id;

              return (
                <div
                  key={req.id}
                  className="p-5 rounded-[24px] border border-slate-100 hover:border-slate-200 bg-slate-50/30 hover:bg-white transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                >
                  {/* بيانات أطراف الحصة والسبب */}
                  <div className="flex items-start gap-4 min-w-[240px]">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                      🔄
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {req.session?.students?.student_name || "طالب"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        المعلم: {req.session?.tutors?.profiles?.full_name || "معلم معتمد"} • مقدم الطلب:{" "}
                        <span className="font-semibold text-slate-700">
                          {req.requested_by_role === "tutor" ? "المعلم" : "ولي الأمر"}
                        </span>
                      </div>
                      {req.reason && (
                        <div className="mt-2 text-xs bg-slate-100/80 text-slate-700 p-2.5 rounded-xl border border-slate-200/60 font-medium">
                          <span className="text-slate-400 font-normal">السبب: </span>
                          {req.reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* مقارنة المواعيد: القديم مقابل المقترح */}
                  <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">الموعد الحالي:</span>
                      <span className="text-xs font-bold text-slate-700">
                        {currentOldDate
                          ? currentOldDate.toLocaleString("ar-EG", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "UTC",
                            }) + " UTC"
                          : "—"}
                      </span>
                    </div>

                    <span className="text-slate-300 font-bold">←</span>

                    <div>
                      <span className="text-[10px] text-blue-500 block font-bold">الموعد المقترح:</span>
                      <span className="text-xs font-bold text-blue-700">
                        {proposedDate.toLocaleString("ar-EG", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC",
                        }) + " UTC"}
                      </span>
                    </div>
                  </div>

                  {/* حالة الطلب أو أزرار اتخاذ القرار */}
                  <div className="w-full lg:w-auto flex items-center justify-end gap-2.5">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleAction(req.id, "rejected")}
                          className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition disabled:opacity-50"
                        >
                          رفض ✕
                        </button>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleAction(req.id, "approved")}
                          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                        >
                          {isActionLoading ? "جاري الحفظ..." : "موافقة واعتماد ✓"}
                        </button>
                      </>
                    ) : (
                      <span
                        className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${
                          req.status === "approved"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-rose-50 text-rose-600 border-rose-100"
                        }`}
                      >
                        {req.status === "approved" ? "تمت الموافقة" : "تم الرفض"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}