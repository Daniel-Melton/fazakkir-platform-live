"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Course {
  id: string;
  slug: string;
  title: string;
  badge: string;
  duration: string;
  category: string;
  subtitle: string;
  summary: string;
}

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [adminKey, setAdminKey] = useState("");

  const loadCourses = async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch courses");
      setCourses(data.courses || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const key = sessionStorage.getItem("fazakkir_admin_key");
    if (key) {
      setAdminKey(key);
      loadCourses(key);
    } else {
      setErrorMsg("Please login from Admin Leads page first.");
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/courses?key=${encodeURIComponent(adminKey)}&id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setCourses(courses.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      const res = await fetch("/api/admin/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: adminKey,
          id: editingCourse.id,
          title: editingCourse.title,
          badge: editingCourse.badge,
          duration: editingCourse.duration,
          subtitle: editingCourse.subtitle,
          summary: editingCourse.summary,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");
      setCourses(courses.map((c) => (c.id === editingCourse.id ? editingCourse : c)));
      setEditingCourse(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/admin/leads" className="text-xs font-bold text-emerald-800 hover:underline">
              ← Back to Leads
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Manage All Courses</h1>
          </div>
          <Link
            href="/admin/courses/new"
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add New Course</span>
          </Link>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl mb-6">
            {errorMsg}
          </div>
        )}

        {/* Table of courses */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">Course Name</th>
                <th className="py-4 px-6">Badge / Level</th>
                <th className="py-4 px-6">Duration</th>
                <th className="py-4 px-6">Slug</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">Loading courses...</td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">No courses found in database.</td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-bold text-slate-900">{course.title}</td>
                    <td className="py-4 px-6 text-xs text-slate-600">{course.badge}</td>
                    <td className="py-4 px-6 text-xs text-slate-600">{course.duration}</td>
                    <td className="py-4 px-6 text-xs font-mono text-emerald-800">
                      <Link href={`/courses/${course.slug}`} target="_blank" className="hover:underline">
                        /{course.slug} ↗
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setEditingCourse(course)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course.id, course.title)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {editingCourse && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">Quick Edit: {editingCourse.title}</h3>
                <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingCourse.title}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    className="w-full p-2 border rounded-lg outline-none font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge</label>
                  <input
                    type="text"
                    value={editingCourse.badge}
                    onChange={(e) => setEditingCourse({ ...editingCourse, badge: e.target.value })}
                    className="w-full p-2 border rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={editingCourse.duration}
                    onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                    className="w-full p-2 border rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={editingCourse.subtitle}
                    onChange={(e) => setEditingCourse({ ...editingCourse, subtitle: e.target.value })}
                    className="w-full p-2 border rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Summary</label>
                  <textarea
                    rows={3}
                    value={editingCourse.summary}
                    onChange={(e) => setEditingCourse({ ...editingCourse, summary: e.target.value })}
                    className="w-full p-2 border rounded-lg outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingCourse(null)}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}