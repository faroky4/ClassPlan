"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/ToastProvider";
import { api, ApiClientError } from "@/lib/api-client";
import { DAY_NAMES, PERIODS } from "@/lib/date-utils";

interface Slot {
  day: number;
  period: number;
  subject: string | null;
  teacherId: string | null;
  teacherName: string | null;
}

interface TeacherOption {
  id: string;
  name: string;
}

export default function ClassTimetablePage({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const [className, setClassName] = useState("");
  const [slots, setSlots] = useState<Map<string, Slot>>(new Map());
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<{ day: number; period: number } | null>(null);
  const [dirty, setDirty] = useState(false);

  const key = (day: number, period: number) => `${day}-${period}`;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [timetableRes, teachersRes] = await Promise.all([
        api.get<{ class: { name: string }; slots: Slot[] }>(`/api/classes/${params.id}/timetable`),
        api.get<{ teachers: (TeacherOption & { classes: unknown[] })[] }>("/api/teachers"),
      ]);
      setClassName(timetableRes.class.name);
      const map = new Map<string, Slot>();
      for (const slot of timetableRes.slots) {
        map.set(key(slot.day, slot.period), slot);
      }
      setSlots(map);
      setTeachers(teachersRes.teachers.map((t) => ({ id: t.id, name: t.name })));
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "تعذر تحميل الجدول");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function getSlot(day: number, period: number): Slot {
    return (
      slots.get(key(day, period)) ?? {
        day,
        period,
        subject: null,
        teacherId: null,
        teacherName: null,
      }
    );
  }

  function updateSlot(day: number, period: number, subject: string | null, teacherId: string | null) {
    setSlots((prev) => {
      const next = new Map(prev);
      const teacherName = teachers.find((t) => t.id === teacherId)?.name ?? null;
      next.set(key(day, period), { day, period, subject, teacherId, teacherName });
      return next;
    });
    setDirty(true);
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      const payload = {
        slots: DAY_NAMES.flatMap((_, day) =>
          PERIODS.map((period) => {
            const s = getSlot(day, period);
            return { day, period, subject: s.subject, teacherId: s.teacherId };
          }),
        ),
      };
      await api.put(`/api/classes/${params.id}/timetable`, payload);
      showToast("تم حفظ جدول الحصص بنجاح", "success");
      setDirty(false);
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : "تعذر حفظ الجدول", "error");
    } finally {
      setSaving(false);
    }
  }

  const editingSlot = useMemo(
    () => (editingCell ? getSlot(editingCell.day, editingCell.period) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingCell, slots],
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/host/classes" className="text-sm text-gray-500 hover:underline">
            &larr; رجوع للصفوف
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">جدول حصص {className}</h1>
          <p className="mt-1 text-sm text-gray-500">اضغط على أي خانة لتحديد المادة والمعلمة المسؤولة</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={handleSaveAll} disabled={saving || !dirty}>
          {saving ? "جارٍ الحفظ..." : "حفظ الجدول"}
        </button>
      </div>

      {loading && <div className="mt-8 text-sm text-gray-500">جارٍ التحميل...</div>}
      {error && <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <>
          {/* عرض البطاقات - للموبايل */}
          <div className="mt-6 space-y-4 sm:hidden">
            {DAY_NAMES.map((day, dayIndex) => (
              <div key={day} className="card overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700">
                  {day}
                </div>
                <div className="divide-y divide-gray-100">
                  {PERIODS.map((period) => {
                    const slot = getSlot(dayIndex, period);
                    const filled = Boolean(slot.subject);
                    return (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setEditingCell({ day: dayIndex, period })}
                        className={
                          "flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-right text-xs transition-colors " +
                          (filled ? "bg-brand-50/40 hover:bg-brand-50" : "text-gray-400 hover:bg-gray-50")
                        }
                      >
                        <span
                          className={
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold " +
                            (filled ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500")
                          }
                        >
                          {period}
                        </span>
                        {filled ? (
                          <span className="flex flex-1 flex-col gap-0.5">
                            <span className="font-bold text-brand-800">{slot.subject}</span>
                            <span className="text-brand-600">{slot.teacherName ?? "بدون معلمة"}</span>
                          </span>
                        ) : (
                          <span className="flex-1">+ إضافة</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* عرض الجدول - للشاشات المتوسطة فأكبر */}
          <div className="card mt-6 hidden overflow-x-auto p-4 sm:block">
            <table className="w-full min-w-[720px] border-separate border-spacing-1 text-center text-sm">
              <thead>
                <tr>
                  <th className="w-20 p-2 text-gray-500">الحصة</th>
                  {DAY_NAMES.map((day) => (
                    <th key={day} className="p-2 text-gray-500">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period) => (
                  <tr key={period}>
                    <td className="rounded-lg bg-gray-50 p-2 font-medium text-gray-600">{period}</td>
                    {DAY_NAMES.map((_, day) => {
                      const slot = getSlot(day, period);
                      const filled = Boolean(slot.subject);
                      return (
                        <td key={day} className="p-0">
                          <button
                            type="button"
                            onClick={() => setEditingCell({ day, period })}
                            className={
                              "flex h-20 w-full flex-col items-center justify-center gap-0.5 rounded-lg border p-1 text-xs transition-colors " +
                              (filled
                                ? "border-brand-200 bg-brand-50 hover:bg-brand-100"
                                : "border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:bg-gray-100")
                            }
                          >
                            {filled ? (
                              <>
                                <span className="font-bold text-brand-800">{slot.subject}</span>
                                <span className="text-brand-600">{slot.teacherName ?? "بدون معلمة"}</span>
                              </>
                            ) : (
                              <span>+ إضافة</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editingCell && editingSlot && (
        <SlotEditModal
          day={editingCell.day}
          period={editingCell.period}
          slot={editingSlot}
          teachers={teachers}
          onClose={() => setEditingCell(null)}
          onSave={(subject, teacherId) => {
            updateSlot(editingCell.day, editingCell.period, subject, teacherId);
            setEditingCell(null);
          }}
          onClear={() => {
            updateSlot(editingCell.day, editingCell.period, null, null);
            setEditingCell(null);
          }}
        />
      )}
    </div>
  );
}

function SlotEditModal({
  day,
  period,
  slot,
  teachers,
  onClose,
  onSave,
  onClear,
}: {
  day: number;
  period: number;
  slot: Slot;
  teachers: TeacherOption[];
  onClose: () => void;
  onSave: (subject: string | null, teacherId: string | null) => void;
  onClear: () => void;
}) {
  const [subject, setSubject] = useState(slot.subject ?? "");
  const [teacherId, setTeacherId] = useState(slot.teacherId ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-auto max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-bold text-gray-900">
          {DAY_NAMES[day]} - الحصة {period}
        </h3>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">المادة</label>
            <input
              className="input-base"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: لغة عربية"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">المعلمة المسؤولة</label>
            <select className="input-base" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">بدون معلمة</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            className="min-h-[44px] py-2 text-sm font-medium text-red-600 hover:underline sm:min-h-0 sm:py-0"
            onClick={onClear}
          >
            إفراغ الخانة
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              إلغاء
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onSave(subject.trim() || null, teacherId || null)}
            >
              حفظ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
