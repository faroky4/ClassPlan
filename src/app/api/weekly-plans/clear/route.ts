import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, requireHost } from "@/lib/session";
import { clearPlansSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireHost();

    const body = await request.json();
    const parsed = clearPlansSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('يجب كتابة "DELETE" بالضبط للتأكيد', 422);
    }

    const result = await prisma.weeklyPlan.deleteMany({});

    return NextResponse.json({ success: true, deletedCount: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}
