import { redirect } from "next/navigation";

import { TeacherHeader } from "@/components/teacher/TeacherHeader";
import { getAuthSession } from "@/lib/session";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "teacher") redirect("/host");

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <TeacherHeader userName={session.user.name} />
      <main className="mx-auto max-w-5xl p-4 lg:p-8 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
