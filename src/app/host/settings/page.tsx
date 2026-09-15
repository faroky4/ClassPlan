"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { api, ApiClientError } from "@/lib/api-client";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClearPlans() {
    setLoading(true);
    try {
      const res = await api.post<{ deletedCount: number }>("/api/weekly-plans/clear", {
        confirm: "DELETE",
      });
      showToast(`تم مسح ${res.deletedCount} خطة أسبوعية بنجاح`, "success");
      setConfirmOpen(false);
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : "تعذر مسح الخطط", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">إعدادات</h1>
      <p className="mt-1 text-sm text-gray-500">إعدادات عامة للنظام</p>

      <div className="card mt-6 max-w-lg border-red-200 p-5">
        <h2 className="text-base font-bold text-red-700">منطقة الخطر</h2>
        <p className="mt-2 text-sm text-gray-600">
          مسح جميع الخطط الأسبوعية المُعبّأة لكل الصفوف. لن يتأثر جدول الحصص ولا حسابات المعلمات أو
          الصفوف - فقط الخطط الأسبوعية سيتم حذفها نهائيًا ولا يمكن التراجع عن هذا الإجراء.
        </p>
        <button className="btn-danger mt-4" onClick={() => setConfirmOpen(true)}>
          مسح جميع الخطط الأسبوعية
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="مسح جميع الخطط الأسبوعية"
        description='هذا الإجراء نهائي ولا يمكن التراجع عنه. اكتب "DELETE" في الأسفل للتأكيد.'
        confirmLabel="مسح نهائيًا"
        danger
        requireTypedConfirmation="DELETE"
        loading={loading}
        onConfirm={handleClearPlans}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
