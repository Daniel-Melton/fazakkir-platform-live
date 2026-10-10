import React from "react";
import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let role = "academic_supervisor";
  let fullName = "المستخدم";

  if (session?.user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile) {
      role = profile.role;
      fullName = profile.full_name || fullName;
    }
  }

  // تخصيص تبويبات التنقل العلوية الكبسولية بحسب دور المستخدم
  const navTabs = (() => {
    switch (role) {
      case "academic_supervisor":
      case "super_admin":
        return [
          { label: "تسكين الطلاب", href: "/dashboard/supervisor/enrollments" },
          { label: "طلبات التعديل", href: "/dashboard/supervisor/reschedule" },
        ];
      case "tutor":
        return [
          { label: "أوقات التوفر", href: "/dashboard/tutor/availability" },
          { label: "جدول حصصي", href: "/dashboard/sessions" },
        ];
      case "parent":
        return [
          { label: "حصص الأبناء", href: "/dashboard/parent" },
          { label: "جدول المواعيد", href: "/dashboard/sessions" },
        ];
      default:
        return [{ label: "الرئيسية", href: "/dashboard" }];
    }
  })();

  return (
    <div className="min-h-screen bg-[#F4F5F9] p-3 sm:p-6 lg:p-8 dir-rtl text-right font-sans text-slate-800 antialiased selection:bg-slate-900 selection:text-white">
      {/* الحاوية البيضاء العائمة الموحدة بكافة البوابات */}
      <div className="max-w-[1440px] mx-auto bg-white rounded-[32px] shadow-sm border border-slate-200/60 p-5 sm:p-8 min-h-[calc(100vh-4rem)] flex flex-col">
        {/* شريط التنقل العلوي الكبسولي المرجعي */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
          {/* الشعار واسم المنصة */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-sm">
              ف
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                أكاديمية فذكّر
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                تعليم القرآن واللغة العربية
              </span>
            </div>
          </Link>

          {/* كبسولات التنقل */}
          <nav className="flex items-center bg-slate-50 p-1.5 rounded-full border border-slate-100 text-xs font-semibold gap-1">
            {navTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="px-5 py-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all font-bold"
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* الأدوات العلوية: جرس الإشعارات والأفاتار */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition">
              <NotificationBell authToken={session?.access_token || ""} />
            </div>

            <div className="flex items-center gap-2.5 pr-2 border-r border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {fullName.charAt(0)}
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {fullName}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {role === "academic_supervisor" ? "مشرف أكاديمي" : role === "tutor" ? "معلم" : "ولي أمر"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* مساحة الصفحات الداخلية */}
        <div className="flex-1 mt-6">{children}</div>
      </div>
    </div>
  );
}