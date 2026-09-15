import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

export function getAuthSession() {
  return getServerSession(authOptions);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** يتأكد من وجود جلسة صالحة، وإلا يرمي 401 */
export async function requireSession() {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new ApiError(401, "يجب تسجيل الدخول");
  }
  return session;
}

/** يتأكد من وجود جلسة صالحة لمستخدم Host، وإلا يرمي 403/401 */
export async function requireHost() {
  const session = await requireSession();
  if (session.user.role !== "host") {
    throw new ApiError(403, "هذا الإجراء متاح للمدير فقط");
  }
  return session;
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonError(error.message, error.status);
  }
  console.error(error);
  return jsonError("حدث خطأ في الخادم", 500);
}
