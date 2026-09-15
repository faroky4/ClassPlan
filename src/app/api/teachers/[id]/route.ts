import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, requireHost } from "@/lib/session";
import { updateTeacherSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireHost();

    const body = await request.json();
    const parsed = updateTeacherSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة", 422);
    }

    const teacher = await prisma.user.findUnique({ where: { id: params.id } });
    if (!teacher || teacher.role !== "teacher") {
      return jsonError("المعلمة غير موجودة", 404);
    }

    if (parsed.data.identity && parsed.data.identity !== teacher.identity) {
      const existing = await prisma.user.findUnique({
        where: { identity: parsed.data.identity },
      });
      if (existing) {
        return jsonError("اسم المستخدم مستخدم بالفعل", 409);
      }
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: parsed.data.name,
        identity: parsed.data.identity,
      },
    });

    return NextResponse.json({
      teacher: { id: updated.id, name: updated.name, identity: updated.identity },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireHost();

    const teacher = await prisma.user.findUnique({ where: { id: params.id } });
    if (!teacher || teacher.role !== "teacher") {
      return jsonError("المعلمة غير موجودة", 404);
    }

    await prisma.user.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
