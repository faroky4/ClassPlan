"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api, ApiClientError } from "@/lib/api-client";

interface ClassItem {
  id: string;
  name: string;
  slotsCount: number;
  subjects: string[];
}

export default function TeacherHomePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ classes: ClassItem[] }>("/api/teacher/classes")
      .then((data) => setClasses(data.classes))
      .catch((e) => setError(e instanceof ApiClientError ? e.message : "تعذر تحميل الصفوف"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">صفوفي</h1>
      <p className="mt-1 text-sm text-gray-500">اختر صفًا لعرض وتعبئة الخطة الأسبوعية</p>

      {loading && <div className="mt-8 text-sm text-gray-500">جارٍ التحميل...</div>}
      {error && <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && classes.length === 0 && (
        <div className="mt-8 rounded-lg bg-gray-100 px-4 py-6 text-center text-sm text-gray-500">
          لا يوجد لديك صفوف مسندة حاليًا. الرجاء التواصل مع إدارة المدرسة.
        </div>
      )}

      {!loading && !error && classes.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/teacher/classes/${c.id}`}
              className="card block p-5 transition-shadow hover:shadow-md"
            >
              <div className="font-bold text-gray-900">{c.name}</div>
              <div className="mt-1 text-xs text-gray-500">{c.slotsCount} حصة أسبوعيًا</div>
              {c.subjects.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.subjects.map((s) => (
                    <span key={s} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
