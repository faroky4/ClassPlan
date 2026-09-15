"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { api, ApiClientError } from "@/lib/api-client";

interface ClassItem {
  id: string;
  name: string;
  active: boolean;
  timetableSlotsCount: number;
  weeklyPlansCount: number;
}

export default function ClassesPage() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassItem | null>(null);
  const [deleteClass, setDeleteClass] = useState<ClassItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ classes: ClassItem[] }>("/api/classes");
      setClasses(data.classes);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "تعذر تحميل الصفوف");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    if (!deleteClass) return;
    setDeleting(true);
    try {
      await api.delete(`/api/classes/${deleteClass.id}`);
      showToast("تم حذف الصف بنجاح", "success");
      setDeleteClass(null);
      load();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : "تعذر الحذف", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الصفوف</h1>
          <p className="mt-1 text-sm text-gray-500">إدارة الصفوف وجداول حصصها</p>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          + إضافة صف
        </button>
      </div>

      {loading && <div className="mt-8 text-sm text-gray-500">جارٍ التحميل...</div>}
      {error && <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <div key={cls.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-gray-900">{cls.name}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {cls.timetableSlotsCount} حصة في الجدول
                  </div>
                </div>
                {!cls.active && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">معطّل</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <Link href={`/host/classes/${cls.id}/timetable`} className="font-medium text-brand-600 hover:underline">
                  بناء جدول الحصص
                </Link>
                <button className="font-medium text-gray-600 hover:underline" onClick={() => setEditClass(cls)}>
                  تعديل
                </button>
                <button className="font-medium text-red-600 hover:underline" onClick={() => setDeleteClass(cls)}>
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <ClassFormModal
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {editClass && (
        <ClassFormModal
          classItem={editClass}
          onClose={() => setEditClass(null)}
          onSuccess={() => {
            setEditClass(null);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteClass)}
        title={`حذف الصف "${deleteClass?.name ?? ""}"`}
        description={
          deleteClass && (deleteClass.timetableSlotsCount > 0 || deleteClass.weeklyPlansCount > 0)
            ? `تحذير: سيتم حذف ${deleteClass.timetableSlotsCount} حصة من جدول الحصص و ${deleteClass.weeklyPlansCount} خطة أسبوعية مرتبطة بهذا الصف نهائيًا.`
            : "سيتم حذف الصف نهائيًا."
        }
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteClass(null)}
      />
    </div>
  );
}

function ClassFormModal({
  classItem,
  onClose,
  onSuccess,
}: {
  classItem?: ClassItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const isEdit = Boolean(classItem);
  const [name, setName] = useState(classItem?.name ?? "");
  const [active, setActive] = useState(classItem?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("اسم الصف مطلوب");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && classItem) {
        await api.patch(`/api/classes/${classItem.id}`, { name, active });
        showToast("تم تحديث الصف", "success");
      } else {
        await api.post("/api/classes", { name });
        showToast("تم إضافة الصف بنجاح", "success");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-bold text-gray-900">{isEdit ? "تعديل صف" : "إضافة صف"}</h3>

        {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">اسم الصف</label>
            <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              الصف مفعّل
            </label>
          )}
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
