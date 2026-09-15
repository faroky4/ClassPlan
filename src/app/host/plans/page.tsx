"use client";

import { useEffect, useState } from "react";

import { WeeklyPlanGrid } from "@/components/WeeklyPlanGrid";
import { api, ApiClientError } from "@/lib/api-client";

interface ClassItem {
  id: string;
  name: string;
  active: boolean;
}

export default function HostPlansPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ classes: ClassItem[] }>("/api/classes")
      .then((data) => {
        const active = data.classes.filter((c) => c.active);
        setClasses(active);
        if (active.length > 0) setSelectedClassId(active[0].id);
      })
      .catch((e) => setError(e instanceof ApiClientError ? e.message : "تعذر تحميل الصفوف"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">الخطط الأسبوعية</h1>
      <p className="mt-1 text-sm text-gray-500">استعرض وعدّل خطط أي صف حسب الأسبوع</p>

      {loading && <div className="mt-8 text-sm text-gray-500">جارٍ التحميل...</div>}
      {error && <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && classes.length === 0 && (
        <div className="mt-8 text-sm text-gray-500">لا يوجد صفوف مفعّلة بعد</div>
      )}

      {!loading && !error && classes.length > 0 && (
        <>
          <div className="no-print mt-6 max-w-xs">
            <label className="mb-1 block text-sm font-medium text-gray-700">اختر الصف</label>
            <select
              className="input-base"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {selectedClassId && (
            <div className="mt-4">
              <WeeklyPlanGrid classId={selectedClassId} printable />
            </div>
          )}
        </>
      )}
    </div>
  );
}
