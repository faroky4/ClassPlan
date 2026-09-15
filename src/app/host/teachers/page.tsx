"use client";

import { FormEvent, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { api, ApiClientError } from "@/lib/api-client";

interface Teacher {
  id: string;
  name: string;
  identity: string;
  classes: { id: string; name: string }[];
}

interface ClassOption {
  id: string;
  name: string;
}

type ModalMode = { type: "create" } | { type: "edit"; teacher: Teacher } | null;

export default function TeachersPage() {
  const { showToast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalMode>(null);
  const [resetModalTeacher, setResetModalTeacher] = useState<Teacher | null>(null);
  const [deleteTeacher, setDeleteTeacher] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ teachers: Teacher[] }>("/api/teachers");
      setTeachers(data.teachers);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "تعذر تحميل المعلمات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    if (!deleteTeacher) return;
    setDeleting(true);
    try {
      await api.delete(`/api/teachers/${deleteTeacher.id}`);
      showToast("تم حذف المعلمة بنجاح", "success");
      setDeleteTeacher(null);
      load();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : "تعذر الحذف", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المعلمات</h1>
          <p className="mt-1 text-sm text-gray-500">إدارة حسابات المعلمات وصفوفهن</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setModal({ type: "create" })}>
          + إضافة معلمة
        </button>
      </div>

      {loading && <div className="mt-8 text-sm text-gray-500">جارٍ التحميل...</div>}
      {error && <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && teachers.length === 0 && (
        <div className="card mt-6 p-8 text-center text-sm text-gray-500">لا يوجد معلمات بعد</div>
      )}

      {!loading && !error && teachers.length > 0 && (
        <>
          {/* عرض البطاقات - للموبايل */}
          <div className="mt-6 space-y-3 sm:hidden">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-gray-400">الاسم</div>
                    <div className="font-medium text-gray-900">{teacher.name}</div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">اسم المستخدم</div>
                    <div className="text-gray-600" dir="ltr">
                      {teacher.identity}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-400">الصفوف</div>
                  {teacher.classes.length === 0 ? (
                    <span className="text-sm text-gray-400">لا يوجد</span>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {teacher.classes.map((c) => (
                        <span key={c.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3 text-xs">
                  <button
                    className="min-h-[44px] font-medium text-brand-600 hover:underline"
                    onClick={() => setModal({ type: "edit", teacher })}
                  >
                    تعديل
                  </button>
                  <button
                    className="min-h-[44px] font-medium text-amber-600 hover:underline"
                    onClick={() => setResetModalTeacher(teacher)}
                  >
                    إعادة تعيين كلمة المرور
                  </button>
                  <button
                    className="min-h-[44px] font-medium text-red-600 hover:underline"
                    onClick={() => setDeleteTeacher(teacher)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* عرض الجدول - للشاشات المتوسطة فأكبر */}
          <div className="card mt-6 hidden overflow-x-auto sm:block">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الاسم</th>
                  <th className="px-4 py-3 font-medium">اسم المستخدم</th>
                  <th className="px-4 py-3 font-medium">الصفوف</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{teacher.name}</td>
                    <td className="px-4 py-3 text-gray-600" dir="ltr">
                      {teacher.identity}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {teacher.classes.length === 0 ? (
                        <span className="text-gray-400">لا يوجد</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {teacher.classes.map((c) => (
                            <span key={c.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-xs">
                        <button className="font-medium text-brand-600 hover:underline" onClick={() => setModal({ type: "edit", teacher })}>
                          تعديل
                        </button>
                        <button className="font-medium text-amber-600 hover:underline" onClick={() => setResetModalTeacher(teacher)}>
                          إعادة تعيين كلمة المرور
                        </button>
                        <button className="font-medium text-red-600 hover:underline" onClick={() => setDeleteTeacher(teacher)}>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal && (
        <TeacherFormModal
          mode={modal}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            load();
          }}
        />
      )}

      {resetModalTeacher && (
        <ResetPasswordModal
          teacher={resetModalTeacher}
          onClose={() => setResetModalTeacher(null)}
          onSuccess={() => setResetModalTeacher(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTeacher)}
        title={`حذف المعلمة "${deleteTeacher?.name ?? ""}"`}
        description="سيتم حذف حساب المعلمة نهائيًا، وستبقى حصصها في جدول الحصص بدون معلمة مسؤولة."
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTeacher(null)}
      />
    </div>
  );
}

function TeacherFormModal({
  mode,
  onClose,
  onSuccess,
}: {
  mode: Exclude<ModalMode, null>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const isEdit = mode.type === "edit";
  const [name, setName] = useState(isEdit ? mode.teacher.name : "");
  const [identity, setIdentity] = useState(isEdit ? mode.teacher.identity : "");
  const [password, setPassword] = useState("");
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(
    new Set(isEdit ? mode.teacher.classes.map((c) => c.id) : []),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<{ classes: ClassOption[] }>("/api/classes")
      .then((data) => setClassOptions(data.classes))
      .catch(() => setError("تعذر تحميل قائمة الصفوف"))
      .finally(() => setClassesLoading(false));
  }, []);

  function toggleClass(classId: string) {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !identity.trim() || (!isEdit && !password)) {
      setError("الرجاء تعبئة جميع الحقول المطلوبة");
      return;
    }

    const classIds = Array.from(selectedClassIds);

    setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/api/teachers/${mode.teacher.id}`, { name, identity, classIds });
        showToast("تم تحديث بيانات المعلمة", "success");
      } else {
        await api.post("/api/teachers", { name, identity, password, classIds });
        showToast("تم إضافة المعلمة بنجاح", "success");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="my-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-bold text-gray-900">{isEdit ? "تعديل معلمة" : "إضافة معلمة"}</h3>

        {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">الاسم</label>
            <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">اسم المستخدم</label>
            <input className="input-base" value={identity} onChange={(e) => setIdentity(e.target.value)} dir="ltr" />
          </div>
          {!isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">كلمة المرور</label>
              <input
                type="password"
                className="input-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              الصفوف المسؤولة عنها ({selectedClassIds.size})
            </label>
            {classesLoading ? (
              <div className="text-sm text-gray-400">جارٍ تحميل الصفوف...</div>
            ) : classOptions.length === 0 ? (
              <div className="text-sm text-gray-400">لا يوجد صفوف بعد</div>
            ) : (
              <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3 sm:grid-cols-3">
                {classOptions.map((cls) => (
                  <label key={cls.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedClassIds.has(cls.id)}
                      onChange={() => toggleClass(cls.id)}
                    />
                    {cls.name}
                  </label>
                ))}
              </div>
            )}
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

function ResetPasswordModal({
  teacher,
  onClose,
  onSuccess,
}: {
  teacher: Teacher;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/teachers/${teacher.id}/reset-password`, { password });
      showToast("تم إعادة تعيين كلمة المرور", "success");
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="my-auto max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-bold text-gray-900">إعادة تعيين كلمة مرور {teacher.name}</h3>

        {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">كلمة المرور الجديدة</label>
          <input
            type="password"
            className="input-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
            autoFocus
          />
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
