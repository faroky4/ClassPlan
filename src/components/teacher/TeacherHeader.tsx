"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export function TeacherHeader({ userName }: { userName: string }) {
  return (
    <header className="no-print sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/teacher" className="font-bold text-gray-900">
          الخطة الأسبوعية
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{userName}</span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </header>
  );
}
