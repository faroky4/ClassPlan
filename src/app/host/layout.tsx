import { redirect } from "next/navigation";

import { HostSidebar } from "@/components/host/HostSidebar";
import { getAuthSession } from "@/lib/session";

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "host") redirect("/teacher");

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <HostSidebar userName={session.user.name} />
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:overflow-y-auto lg:p-8">{children}</main>
    </div>
  );
}
