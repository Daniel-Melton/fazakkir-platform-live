"use client";

import { useState } from "react";
import { User, Mail, Phone, BookOpen, Lock, Loader2, ArrowRight } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
    };
  }
}

const COURSES = [
  "Quran Reading (Noorani Qaida)",
  "Quran Recitation & Tajweed",
  "Quran Memorization (Hifz)",
  "Quran Ijazah Program",
  "Arabic Language for Non-Arabs",
  "Islamic Studies for Children",
];

const COUNTRY_CODES = [
  { label: "🇺🇸/🇨🇦 +1", value: "+1" },
  { label: "🇬🇧 +44", value: "+44" },
  { label: "🇦🇺 +61", value: "+61" },
  { label: "🇸🇦 +966", value: "+966" },
  { label: "🇦🇪 +971", value: "+971" },
  { label: "🇪🇬 +20", value: "+20" },
  { label: "🇩🇪 +49", value: "+49" },
  { label: "🇫🇷 +33", value: "+33" },
];

export default function LeadForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState(COURSES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // جلب التوكن الخاص بـ Turnstile
    const turnstileToken = (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement)?.value;

    if (!turnstileToken) {
      setError("Please complete security verification.");
      setLoading(false);
      return;
    }

    try {
      // 1. الإرسال إلى API Route الخاص بنا
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          countryCode,
          phoneNumber: phone,
          courseName: course,
          turnstileToken,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit.");
      }

      // 2. التحويل الفوري إلى واتساب
      const waNumber = process.env.NEXT_PUBLIC_WA_PHONE_NUMBER || "201000000000";
      const fullPhone = `${countryCode} ${phone}`;
      const waMsg = `*New Free Trial Request - Fazakkir Academy*%0A%0A` +
                    `*Name:* ${encodeURIComponent(fullName)}%0A` +
                    `*Email:* ${encodeURIComponent(email)}%0A` +
                    `*Phone:* ${encodeURIComponent(fullPhone)}%0A` +
                    `*Course:* ${encodeURIComponent(course)}`;

      window.location.href = `https://wa.me/${waNumber}?text=${waMsg}`;
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 md:p-9 shadow-xl shadow-slate-900/10 border border-slate-200 relative overflow-hidden" id="registerForm">
      <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-emerald-500 to-teal-800" />

      <div className="text-center mb-6">
        <h3 className="text-2xl font-extrabold text-emerald-950">Claim Your 2 Free Classes</h3>
        <p className="text-xs text-slate-500 mt-1">Instant confirmation on WhatsApp • No credit card</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Student / Parent Name</label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 w-4 h-4 text-emerald-700 pointer-events-none" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Brother Abdullah"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 w-4 h-4 text-emerald-700 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. family@example.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm transition-all"
            />
          </div>
        </div>

        {/* Phone with Country Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number</label>
          <div className="grid grid-cols-[130px_1fr] gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="px-2 py-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-600"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="relative flex items-center">
              <Phone className="absolute left-3 w-4 h-4 text-emerald-700 pointer-events-none" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555 123 4567"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* Course Select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Desired Program</label>
          <div className="relative flex items-center">
            <BookOpen className="absolute left-3.5 w-4 h-4 text-emerald-700 pointer-events-none" />
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-emerald-600 text-slate-800"
            >
              {COURSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cloudflare Turnstile Container */}
        <div
          className="cf-turnstile my-2 flex justify-center"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          data-theme="light"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold text-sm shadow-lg shadow-green-600/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying & Connecting...</span>
            </>
          ) : (
            <>
              <span>Get Free Trial on WhatsApp</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-2">
          <Lock className="w-3.5 h-3.5" />
          <span>100% Free Trial • Zero Commitment</span>
        </div>
      </form>
    </div>
  );
}