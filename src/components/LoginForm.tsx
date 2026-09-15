"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identity.trim() || !password) {
      setError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setLoading(true);
    const result = await signIn("credentials", {
      identity: identity.trim(),
      password,
      redirect: false,
    });
    setLoading(false);

    if (!result || result.error) {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl");
    router.push(callbackUrl || "/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
          خ
        </div>
        <h1 className="text-xl font-bold text-gray-900">نظام الخطة الأسبوعية</h1>
        <p className="mt-1 text-sm text-gray-500">سجّل الدخول لمتابعة عملك</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label htmlFor="identity" className="mb-1 block text-sm font-medium text-gray-700">
            اسم المستخدم
          </label>
          <input
            id="identity"
            className="input-base"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            autoFocus
            autoComplete="username"
            dir="ltr"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            كلمة المرور
          </label>
          <input
            id="password"
            type="password"
            className="input-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            dir="ltr"
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
        </button>
      </form>
    </div>
  );
}
