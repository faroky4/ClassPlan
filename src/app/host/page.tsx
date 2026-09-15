"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api, ApiClientError } from "@/lib/api-client";
import { formatWeekRangeLabel } from "@/lib/date-utils";

interface StatsResponse {
  weekStart: string;
  classesCount: number;
  teachersCount: number;
  filledThisWeek: number;
  missingThisWeek: number;
  totalRequiredThisWeek: number;
  missingClasses: { id: string; name: string; required: number; filled: number; missing: number }[];
}

export default function HostDashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api
      .get<StatsResponse>("/api/stats")
      .then((data) => {
        if (!ignore) setStats(data);
      })
      .catch((e) => {
        if (!ignore) setError(e instanceof ApiClientError ? e.message : "تعذر تحميل الإحصائيات");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">الرئيسية</h1>
      <p className="mt-1 text-sm text-gray-500">نظرة عامة على حالة الخطط الأسبوعية</p>

      {loading && <div className="mt-8 text-sm text-gray-500">جارٍ التحميل...</div>}
      {error && (
        <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {stats && (
        <>
          <div className="mt-6 text-sm text-gray-500">
            الأسبوع الحالي: <span className="font-medium text-gray-800">{formatWeekRangeLabel(stats.weekStart)}</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="عدد الصفوف" value={stats.classesCount} color="bg-brand-50 text-brand-700" />
            <StatCard label="عدد المعلمات" value={stats.teachersCount} color="bg-purple-50 text-purple-700" />
            <StatCard label="خطط مُعبّأة هذا الأسبوع" value={stats.filledThisWeek} color="bg-emerald-50 text-emerald-700" />
            <StatCard label="خطط ناقصة هذا الأسبوع" value={stats.missingThisWeek} color="bg-red-50 text-red-700" />
          </div>

          <div className="card mt-6 p-5">
            <h2 className="mb-4 text-base font-bold text-gray-900">الصفوف الناقصة هذا الأسبوع</h2>
            {stats.missingClasses.length === 0 ? (
              <p className="text-sm text-gray-500">لا توجد خطط ناقصة، جميع الصفوف مكتملة 🎉</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.missingClasses.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500">
                        {c.filled} من {c.required} حصة مُعبّأة
                      </div>
                    </div>
                    <Link href={`/host/classes/${c.id}/timetable`} className="text-sm font-medium text-brand-600 hover:underline">
                      عرض الجدول
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-5">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${color}`}>
        {value}
      </div>
      <div className="mt-3 text-sm text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
