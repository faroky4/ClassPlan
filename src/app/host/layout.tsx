import { redirect } from "next/navigation";

import { HostSidebar } from "@/components/host/HostSidebar";
import { getAuthSession } from "@/lib/session";

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "host") redirect("/teacher");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <HostSidebar userName={session.user.name} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
