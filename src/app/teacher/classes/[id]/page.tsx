"use client";

import Link from "next/link";

import { WeeklyPlanGrid } from "@/components/WeeklyPlanGrid";

export default function TeacherClassPlanPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <Link href="/teacher" className="no-print text-sm text-gray-500 hover:underline">
        &larr; رجوع لصفوفي
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-gray-900">الخطة الأسبوعية</h1>
      <p className="no-print mt-1 text-sm text-gray-500">
        اضغطي على أي حصة لتعديل خطتها
      </p>

      <div className="mt-4">
        <WeeklyPlanGrid classId={params.id} printable />
      </div>
    </div>
  );
}
