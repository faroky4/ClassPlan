"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/host", label: "الرئيسية", exact: true },
  { href: "/host/teachers", label: "المعلمات" },
  { href: "/host/classes", label: "الصفوف" },
  { href: "/host/plans", label: "الخطط الأسبوعية" },
  { href: "/host/settings", label: "إعدادات" },
];

export function HostSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="no-print flex h-screen w-64 shrink-0 flex-col border-l border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-5">
        <div className="text-sm text-gray-400">مرحبًا</div>
        <div className="font-bold text-gray-900">{userName}</div>
        <div className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
          مدير النظام
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                (isActive ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100")
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-lg px-3 py-2 text-right text-sm font-medium text-red-600 hover:bg-red-50"
        >
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
