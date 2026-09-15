"use client";

import { useState } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  requireTypedConfirmation?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  danger = false,
  requireTypedConfirmation,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState("");

  if (!open) return null;

  const isConfirmDisabled =
    loading || (requireTypedConfirmation ? typedValue !== requireTypedConfirmation : false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-auto max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}

        {requireTypedConfirmation && (
          <div className="mt-3">
            <label className="mb-1 block text-xs text-gray-500">
              اكتب <span className="font-mono font-bold">{requireTypedConfirmation}</span> للتأكيد
            </label>
            <input
              className="input-base"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              dir="ltr"
            />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={isConfirmDisabled}
          >
            {loading ? "جارٍ التنفيذ..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
