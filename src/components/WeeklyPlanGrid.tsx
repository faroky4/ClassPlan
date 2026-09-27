"use client";

import { FormEvent, useEffect, useState } from "react";

import { useToast } from "@/components/ToastProvider";
import { api, ApiClientError } from "@/lib/api-client";
import {
  currentWeekStartKey,
  DAY_NAMES,
  formatWeekRangeLabel,
  PERIODS,
  shiftWeekKey,
} from "@/lib/date-utils";
import type { NoteColorTag } from "@/lib/validation";

interface Cell {
  day: number;
  period: number;
  subject: string | null;
  teacherId: string | null;
  teacherName: string | null;
  plan: {
    id: string;
    topic: string;
    page: string | null;
    notes: string | null;
    noteColorTag: NoteColorTag | null;
    updatedAt: string;
  } | null;
}

const NOTE_COLOR_OPTIONS: { value: NoteColorTag; label: string; swatch: string; tag: string }[] = [
  { value: "green", label: "أخضر", swatch: "bg-green-300", tag: "border-green-400 bg-green-50" },
  { value: "orange", label: "برتقالي", swatch: "bg-orange-300", tag: "border-orange-400 bg-orange-50" },
  { value: "yellow", label: "أصفر", swatch: "bg-yellow-300", tag: "border-yellow-400 bg-yellow-50" },
];

/** نص الملاحظة بالأحمر، مع ماركر لوني اختياري حول النص فقط. بالطباعة يلتف النص كاملًا بدون قص. */
function PlanNote({ notes, colorTag, className = "" }: { notes: string; colorTag: NoteColorTag | null; className?: string }) {
  const tag = NOTE_COLOR_OPTIONS.find((o) => o.value === colorTag)?.tag;
  return (
    <span
      className={
        "block max-w-full shrink-0 text-[10.5px] font-medium leading-snug text-red-600 print:line-clamp-none print:break-words " +
        (tag ? `w-fit rounded border px-1 ${tag} ` : "w-full ") +
        className
      }
    >
      {notes}
    </span>
  );
}

interface WeeklyPlanResponse {
  class: { id: string; name: string };
  weekStart: string;
  cells: Cell[];
}

export function WeeklyPlanGrid({ classId, printable = false }: { classId: string; printable?: boolean }) {
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState(currentWeekStartKey());
  const [data, setData] = useState<WeeklyPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<Cell | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<WeeklyPlanResponse>(
        `/api/weekly-plans?classId=${encodeURIComponent(classId)}&weekStart=${encodeURIComponent(weekStart)}`,
      );
      setData(res);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "تعذر تحميل الخطة الأسبوعية");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, weekStart]);

  function cellAt(day: number, period: number): Cell | undefined {
    return data?.cells.find((c) => c.day === day && c.period === period);
  }

  return (
    <div>
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:w-auto">
          <button
            className="btn-secondary px-2 text-xs sm:px-4 sm:text-sm"
            onClick={() => setWeekStart((w) => shiftWeekKey(w, -1))}
          >
            الأسبوع السابق
          </button>
          <button
            className="btn-secondary px-2 text-xs sm:px-4 sm:text-sm"
            onClick={() => setWeekStart(currentWeekStartKey())}
          >
            الأسبوع الحالي
          </button>
          <button
            className="btn-secondary px-2 text-xs sm:px-4 sm:text-sm"
            onClick={() => setWeekStart((w) => shiftWeekKey(w, 1))}
          >
            الأسبوع التالي
          </button>
        </div>
        {printable && (
          <button className="btn-secondary w-full sm:w-auto" onClick={() => window.print()}>
            طباعة
          </button>
        )}
      </div>

      <div className="mt-3 text-sm font-medium text-gray-700 print:mt-0 print:font-bold print:text-gray-900">
        {data && <span className="hidden print:inline">{data.class.name} — </span>}
        أسبوع {formatWeekRangeLabel(weekStart)}
      </div>

      {loading && <div className="mt-6 text-sm text-gray-500">جارٍ التحميل...</div>}
      {error && <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && data && (
        <>
          {/* عرض البطاقات - للموبايل */}
          <div className="mt-4 space-y-4 sm:hidden print:hidden">
            {DAY_NAMES.map((day, dayIndex) => (
              <div key={day} className="card overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700">
                  {day}
                </div>
                <div className="divide-y divide-gray-100">
                  {PERIODS.map((period) => {
                    const cell = cellAt(dayIndex, period);
                    if (!cell || !cell.subject) {
                      return (
                        <div key={period} className="flex items-center gap-3 px-4 py-3 text-xs text-gray-300">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-50 font-bold text-gray-400">
                            {period}
                          </span>
                          لا يوجد حصة
                        </div>
                      );
                    }

                    return (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setEditingCell(cell)}
                        className="flex w-full min-h-[44px] cursor-pointer items-start gap-3 bg-brand-50/40 px-4 py-3 text-right text-xs transition-colors hover:bg-brand-50"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                          {period}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="font-bold text-gray-800">{cell.subject}</span>
                          <span className="text-[11px] text-gray-500">{cell.teacherName ?? "بدون معلمة"}</span>
                          {cell.plan ? (
                            <>
                              <span className="mt-1 text-[11px] font-medium text-emerald-700">
                                {cell.plan.topic}
                                {cell.plan.page ? ` - ص${cell.plan.page}` : ""}
                              </span>
                              {cell.plan.notes && (
                                <PlanNote
                                  notes={cell.plan.notes}
                                  colorTag={cell.plan.noteColorTag}
                                  className="line-clamp-3 break-words"
                                />
                              )}
                            </>
                          ) : (
                            <span className="mt-1 text-[11px] text-amber-600">لم تُعبّأ بعد</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* عرض الجدول - للشاشات المتوسطة فأكبر */}
          <div className="card mt-4 hidden overflow-x-auto p-4 sm:block print:mt-2 print:block print:overflow-visible print:border-0 print:p-0 print:shadow-none">
            <table className="plan-table w-full min-w-[760px] border-separate border-spacing-1 text-center text-sm table-fixed print:min-w-0 print:border-spacing-0.5">
              <thead>
                <tr>
                  <th className="w-16 p-2 text-gray-500 print:w-10 print:p-1">الحصة</th>
                  {DAY_NAMES.map((day) => (
                    <th key={day} className="p-2 text-gray-500 print:p-1">
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
                      const cell = cellAt(day, period);
                      if (!cell || !cell.subject) {
                        return (
                          <td key={day} className="p-0 print:h-px">
                            <div className="flex h-28 print:h-full print:min-h-[2.75rem] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-300">
                              لا يوجد حصة
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={day} className="p-0 align-top print:h-px">
                          <button
                            type="button"
                            onClick={() => setEditingCell(cell)}
                            className="flex h-28 w-full cursor-pointer flex-col items-start justify-start gap-0.5 overflow-hidden rounded-lg print:h-full print:min-h-[2.75rem] print:overflow-visible print:p-1.5 print:leading-tight border border-brand-200 bg-brand-50 p-2 text-right text-xs transition-colors hover:bg-brand-100"
                          >
                            <span className="font-bold text-gray-800">{cell.subject}</span>
                            <span className="text-[11px] text-gray-500">{cell.teacherName ?? "بدون معلمة"}</span>
                            {cell.plan ? (
                              <>
                                <span className="mt-1 line-clamp-2 w-full shrink-0 text-[11px] font-medium text-emerald-700 print:line-clamp-none print:break-words">
                                  {cell.plan.topic}
                                  {cell.plan.page ? ` - ص${cell.plan.page}` : ""}
                                </span>
                                {cell.plan.notes && (
                                  <PlanNote notes={cell.plan.notes} colorTag={cell.plan.noteColorTag} className="line-clamp-2 break-words" />
                                )}
                              </>
                            ) : (
                              <span className="mt-1 text-[11px] text-amber-600">لم تُعبّأ بعد</span>
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

      {editingCell && data && (
        <PlanEditModal
          classId={classId}
          weekStart={weekStart}
          cell={editingCell}
          onClose={() => setEditingCell(null)}
          onSaved={() => {
            setEditingCell(null);
            showToast("تم حفظ الخطة بنجاح", "success");
            load();
          }}
        />
      )}
    </div>
  );
}

function PlanEditModal({
  classId,
  weekStart,
  cell,
  onClose,
  onSaved,
}: {
  classId: string;
  weekStart: string;
  cell: Cell;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [topic, setTopic] = useState(cell.plan?.topic ?? "");
  const [page, setPage] = useState(cell.plan?.page ?? "");
  const [notes, setNotes] = useState(cell.plan?.notes ?? "");
  const [noteColorTag, setNoteColorTag] = useState<NoteColorTag | null>(cell.plan?.noteColorTag ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!topic.trim()) {
      setError("الموضوع مطلوب");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/weekly-plans", {
        classId,
        day: cell.day,
        period: cell.period,
        weekStart,
        topic: topic.trim(),
        page: page.trim() || null,
        notes: notes.trim() || null,
        noteColorTag,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "تعذر حفظ الخطة");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="my-auto max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-bold text-gray-900">
          {DAY_NAMES[cell.day]} - الحصة {cell.period} ({cell.subject})
        </h3>

        {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              الموضوع <span className="text-red-500">*</span>
            </label>
            <input className="input-base" value={topic} onChange={(e) => setTopic(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">رقم الصفحة</label>
            <input className="input-base" value={page} onChange={(e) => setPage(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ملاحظات</label>
            <textarea
              className="input-base min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">لون ماركر الملاحظة</label>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {[{ value: null, label: "بدون لون", swatch: "border border-dashed border-gray-400 bg-white" }, ...NOTE_COLOR_OPTIONS].map(
                (opt) => {
                  const selected = noteColorTag === opt.value;
                  return (
                    <button
                      key={opt.value ?? "none"}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setNoteColorTag(opt.value)}
                      className={
                        "inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors " +
                        (selected
                          ? "border-brand-500 bg-brand-50 font-medium text-brand-700 ring-2 ring-brand-100"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50")
                      }
                    >
                      <span className={`h-3.5 w-3.5 rounded-full ${opt.swatch}`} />
                      {opt.label}
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            إلغاء
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </div>
      </form>
    </div>
  );
}
