import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, requireHost } from "@/lib/session";
import { updateClassSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireHost();

    const body = await request.json();
    const parsed = updateClassSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة", 422);
    }

    const existing = await prisma.class.findUnique({ where: { id: params.id } });
    if (!existing) {
      return jsonError("الصف غير موجود", 404);
    }

    const updated = await prisma.class.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ class: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireHost();

    const existing = await prisma.class.findUnique({
      where: { id: params.id },
      include: { _count: { select: { weeklyPlans: true, timetable: true } } },
    });
    if (!existing) {
      return jsonError("الصف غير موجود", 404);
    }

    await prisma.class.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
