"use client";

import Navbar from "@/components/Navbar";
import LeadForm from "@/components/LeadForm";
import Image from "next/image";

export default function Home() {
  const chooseCourse = (courseTitle: string) => {
    const select = document.getElementById("courseChoice") as HTMLSelectElement;
    if (select) {
      select.value = courseTitle;
    }
    document.getElementById("registerForm")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-slate-50 relative">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-14 pb-20 overflow-hidden bg-[radial-gradient(120%_120%_at_50%_-10%,#d1fae5_0%,#f8fafc_100%)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
              <i className="fa-solid fa-star-and-crescent text-emerald-600"></i>
              <span>Official Al-Azhar Certified Tutors • 2 Free Classes</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
              Master Quran, Tajweed & Arabic with{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-900 bg-clip-text text-transparent">
                Personalized 1-on-1 Guidance
              </span>
            </h1>

            <p className="text-slate-600 text-base md:text-lg leading-relaxed">
              Empowering Muslim families across the USA, UK, Canada & Europe to recite with confidence, memorize with precision, and understand Quranic Arabic from certified Azhari scholars.
            </p>

            {/* Visual Blob & Live Floating Badge */}
            <div className="flex items-center gap-6 pt-2 pb-2">
              <div className="w-36 h-36 relative flex-shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=400&q=80"
                  alt="Quran Recitation"
                  width={150}
                  height={150}
                  className="w-full h-full object-cover rounded-[60%_40%_30%_70%/60%_30%_70%_40%] shadow-xl shadow-emerald-900/15 border-2 border-white animate-[morphBlob_7s_ease-in-out_infinite]"
                />
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-100 flex items-center gap-3.5 animate-[floatBadge_4s_ease-in-out_infinite]">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-100 to-emerald-200 text-emerald-900 flex items-center justify-center text-xl">
                  <i className="fa-solid fa-mosque"></i>
                </div>
                <div>
                  <div className="text-base font-extrabold text-slate-900">98% Fluency Rate</div>
                  <div className="text-xs text-slate-500">Fluent recitation in 90 days</div>
                </div>
              </div>
            </div>

            {/* Bullets */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                "Male & Female Teachers Available",
                "100% Customized 24/7 Timings",
                "Authentic Sanad & Ijazah Pathways",
                "Interactive Classrooms for Children",
              ].map((b, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                  <i className="fa-solid fa-check text-emerald-600 bg-emerald-50 border border-emerald-200 p-1.5 rounded-full text-[10px]"></i>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Lead Form */}
          <div className="lg:col-span-5">
            <LeadForm />
          </div>

        </div>
      </section>

      {/* Global Impact Stats */}
      <section className="bg-gradient-to-r from-[#022c22] to-[#064e3b] text-white py-12 shadow-inner">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: "15+", label: "Years Academic Experience" },
            { val: "50+", label: "Certified Azhari Scholars" },
            { val: "1,400+", label: "Active Students Worldwide" },
            { val: "4.9 / 5", label: "Parent Rating Score" },
          ].map((s, i) => (
            <div key={i} className="stat-box">
              <h3 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent mb-1">
                {s.val}
              </h3>
              <p className="text-xs md:text-sm text-emerald-200 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Easy Steps to Learn (Red Theme) */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-[#fff1f2] to-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider mb-3">
              <i className="fa-solid fa-compass"></i> Seamless Onboarding
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">How Learning Works With Us</h2>
            <p className="text-slate-500 text-sm md:text-base mt-2">A proven, student-centered approach to help you and your children start Quranic education with zero friction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "1",
                icon: "fa-clipboard-list",
                title: "Book Free Assessment",
                desc: "Submit your details. Our academic coordinator connects with you on WhatsApp within 15 minutes to evaluate current proficiency levels.",
              },
              {
                num: "2",
                icon: "fa-handshake-angle",
                title: "Take 2 Free Trial Lessons",
                desc: "Experience our live 1-on-1 virtual classroom with a matched Azhari tutor. Witness first-hand teaching quality before any payment.",
              },
              {
                num: "3",
                icon: "fa-award",
                title: "Custom Schedule & Growth",
                desc: "Set a weekly timetable that fits your timezone. Receive monthly milestone reports and accredited completion certificates.",
              },
            ].map((st, i) => (
              <div
                key={i}
                className="step-card bg-white rounded-2xl p-9 border-2 border-rose-100 shadow-[0_15px_30px_-8px_rgba(225,29,72,0.18)] relative text-center hover:-translate-y-2 hover:border-rose-300 transition-all group"
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-rose-700 text-white font-extrabold text-base flex items-center justify-center shadow-lg shadow-rose-600/40">
                  {st.num}
                </div>
                <div className="icon-badge-box icon-duo mx-auto mt-2">
                  <i className={`fa-solid ${st.icon}`}></i>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{st.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Grid with Original FontAwesome Icons */}
      <section id="courses" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-3">
              <i className="fa-solid fa-book-open"></i> Accredited Curriculums
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Structured Courses for All Levels</h2>
            <p className="text-slate-500 text-sm md:text-base mt-2">Select your specialized pathway taught 1-on-1 by certified Al-Azhar instructors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Noorani Qaida & Basics",
                badge: "Beginner • Kids & Adults",
                icon: "fa-cubes",
                desc: "Master Arabic phonetics, Makharij articulation points, and letter connecting rules to read the Quran independently.",
                features: [
                  "Accurate phonetics pronunciation",
                  "Interactive digital whiteboards",
                  "Read short Surahs with confidence",
                ],
                targetCourse: "Quran Reading (Noorani Qaida)",
              },
              {
                title: "Recitation & Tajweed",
                badge: "Intermediate • All Ages",
                icon: "fa-book-quran",
                desc: "Refine your recitation applying rigorous practical Tajweed rules (Ghunnah, Ikhfa, Idgham, Madd, and Waqf stopping signs).",
                features: [
                  "Error-free fluent recitation",
                  "Melodious rhythmic recitation",
                  "Study Tuhfat Al-Atfal poem",
                ],
                targetCourse: "Quran Recitation & Tajweed",
              },
              {
                title: "Quran Memorization (Hifz)",
                badge: "Custom Pace • Kids & Adults",
                icon: "fa-heart-pulse",
                desc: "A systematic dual retention approach combining daily new verses (Sabaq) with strict past revision (Manzil) to prevent forgetting.",
                features: [
                  "Daily revision tracking plans",
                  "Mutashabihat mastery guidance",
                  "Periodic oral retention exams",
                ],
                targetCourse: "Quran Memorization (Hifz)",
              },
              {
                title: "Quran Ijazah Program",
                badge: "Advanced • Traced Sanad to Prophet ﷺ",
                icon: "fa-scroll",
                desc: "Recite the Holy Quran from memory to an authorized scholar to earn an accredited Sanad connected directly to Prophet Muhammad ﷺ.",
                features: [
                  "Hafs 'an 'Asim, Warsh & 10 Qira'at",
                  "Comprehensive oral theory exam",
                  "Accredited official Ijazah certificate",
                ],
                targetCourse: "Quran Ijazah Program",
              },
              {
                title: "Arabic for Non-Arabs",
                badge: "Modern Standard & Quranic Arabic",
                icon: "fa-language",
                desc: "Gain conversational fluency and grasp the exact meanings of Quranic verses directly without translation barriers.",
                features: [
                  "Direct Quranic vocabulary immersion",
                  "Simplified Nahw & Sarf grammar",
                  "Immersive conversation practice",
                ],
                targetCourse: "Arabic for Non-Arabs",
              },
              {
                title: "Islamic Studies for Kids",
                badge: "Youth Curriculum • Fun & Engaging",
                icon: "fa-seedling",
                desc: "Nurture genuine Islamic identity through inspiring stories of the Prophets, Seerah, daily Sunnah etiquette, and Fiqh of Salah.",
                features: [
                  "Practical Salah & Wudu workshops",
                  "Inspiring Akhlaq & character building",
                  "Positive & safe virtual space",
                ],
                targetCourse: "Islamic Studies for Kids",
              },
            ].map((c, i) => (
              <div
                key={i}
                className="course-card bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 hover:-translate-y-2 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="icon-badge-box icon-duo">
                    <i className={`fa-solid ${c.icon}`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{c.title}</h3>
                  <span className="text-xs font-bold text-emerald-700 mb-3 block">{c.badge}</span>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6">{c.desc}</p>
                  
                  <ul className="space-y-2 border-t border-dashed border-slate-200 pt-4 mb-6">
                    {c.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <i className="fa-solid fa-circle-check text-emerald-600 text-[11px]"></i>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => chooseCourse(c.targetCourse)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-600 hover:to-teal-700 text-emerald-950 hover:text-white font-bold text-xs border border-emerald-200 hover:border-emerald-600 text-center transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Book This Course</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-to-b from-[#ecfdf5] to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-3">
              <i className="fa-solid fa-quote-left"></i> Verified Student Reviews
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Trusted by Muslim Families Worldwide</h2>
            <p className="text-slate-500 text-sm md:text-base mt-2">Hear how Fazakkir Academy has transformed Quranic learning for families across the globe.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Finding a patient female teacher for my 7-year-old daughter was our top priority. Teacher Fatima has been phenomenal. My daughter finished Noorani Qaida in just 4 months with beautiful pronunciation!",
                author: "Sister Aminah",
                loc: "Texas, USA • Mother of Sarah",
                initials: "SA",
              },
              {
                quote: "As an NHS doctor in London, my schedule changes every week. My tutor Sheikh Ahmed accommodates my hospital shifts effortlessly. My Tajweed rules and fluency have improved beyond belief.",
                author: "Dr. Muhammad Khan",
                loc: "London, UK • Tajweed Student",
                initials: "MK",
              },
              {
                quote: "The monthly progress reports give us total peace of mind. Both of my sons are enrolled in the Hifz program and their Azhari teacher keeps them deeply motivated and disciplined.",
                author: "Tariq Ibrahim",
                loc: "Ontario, Canada • Father of 2",
                initials: "TI",
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-emerald-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-all">
                <div className="space-y-4">
                  <div className="flex gap-1 text-emerald-600 text-xs">
                    {[...Array(5)].map((_, idx) => (
                      <i key={idx} className="fa-solid fa-star"></i>
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 italic leading-relaxed">"{t.quote}"</p>
                </div>
                <div className="flex items-center gap-3.5 mt-6 pt-4 border-t border-slate-100">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-800 text-white font-extrabold text-sm flex items-center justify-center">
                    {t.initials}
                  </div>
                  <div>
                    <strong className="block text-sm text-slate-900">{t.author}</strong>
                    <span className="text-xs text-slate-500">{t.loc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-3">
              <i className="fa-solid fa-circle-question"></i> Answers & Support
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-sm md:text-base mt-2">Everything you need to know about our classes, schedules, and tutors.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Are the 2 trial classes really 100% free?",
                a: "Yes, completely free. You are never required to enter any payment or credit card details. If you decide not to continue after the 2 trial sessions, there is zero commitment.",
              },
              {
                q: "Can I request a female teacher for myself or my daughters?",
                a: "Yes, absolutely. We have an extensive team of certified female Azhari teachers available for sisters and young daughters.",
              },
              {
                q: "What happens if we need to reschedule a class?",
                a: "We understand family emergencies and changing schedules. Simply notify your coordinator or tutor prior to the class time, and a make-up class will be scheduled for you.",
              },
              {
                q: "What software or equipment do I need?",
                a: "Any laptop, tablet, or smartphone with internet access and Zoom or Google Meet installed is all you need to join our live interactive classes.",
              },
              {
                q: "What are the qualifications of your teachers?",
                a: "All our tutors are graduates of Al-Azhar University, hold authentic Ijazaat with connected Sanad, and are fluent in English with years of teaching students in Western countries.",
              },
            ].map((f, i) => (
              <details key={i} className="bg-white rounded-xl border border-slate-200 p-5 group cursor-pointer">
                <summary className="font-bold text-slate-900 text-sm md:text-base flex justify-between items-center list-none">
                  <span>{f.q}</span>
                  <i className="fa-solid fa-chevron-down text-emerald-600 transition-transform group-open:rotate-180"></i>
                </summary>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed border-t border-slate-100 pt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Action */}
      <a
        href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_PHONE_NUMBER || "201000000000"}?text=${encodeURIComponent("Salam Alaikum Fazakkir Academy! I would like to book my 2 Free Trial Classes.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-7 right-7 z-50 w-16 h-16 bg-[#25d366] text-white rounded-full flex items-center justify-center text-3xl shadow-[0_8px_24px_rgba(37,211,102,0.45)] hover:scale-110 transition-transform animate-[pulseRing_2.5s_infinite]"
        title="Chat on WhatsApp"
      >
        <i className="fa-brands fa-whatsapp"></i>
      </a>

      {/* Footer */}
      <footer className="bg-[#022c22] text-[#a7f3d0] py-10 text-center text-sm border-t border-emerald-950">
        <div className="max-w-7xl mx-auto px-6 space-y-2">
          <p>© 2026 Fazakkir Academy. All rights reserved.</p>
          <p className="text-xs text-emerald-400/80">
            Contact: <a href="mailto:lonelywolf1452@gmail.com" className="hover:underline text-emerald-300">lonelywolf1452@gmail.com</a>
          </p>
        </div>
      </footer>
    </main>
  );
}