"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/host", label: "الرئيسية", exact: true },
  { href: "/host/teachers", label: "المعلمات" },
  { href: "/host/classes", label: "الصفوف" },
  { href: "/host/plans", label: "الخطط الأسبوعية" },
  { href: "/host/settings", label: "إعدادات" },
];

export function HostSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // اغلق القائمة تلقائيًا عند تغيير الصفحة
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="فتح القائمة"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
        <div className="font-bold text-gray-900">{userName}</div>
        <div className="h-11 w-11" />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={
          "no-print fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col border-l border-gray-200 bg-white transition-transform duration-200 ease-out lg:static lg:z-auto lg:h-screen lg:w-64 lg:max-w-none lg:translate-x-0 lg:transition-none " +
          (open ? "translate-x-0" : "translate-x-full")
        }
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5">
          <div>
            <div className="text-sm text-gray-400">مرحبًا</div>
            <div className="font-bold text-gray-900">{userName}</div>
            <div className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
              مدير النظام
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="إغلاق القائمة"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {links.map((link) => {
            const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "block rounded-lg px-3 py-3 text-sm font-medium transition-colors lg:py-2 " +
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
            className="w-full rounded-lg px-3 py-3 text-right text-sm font-medium text-red-600 hover:bg-red-50 lg:py-2"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
