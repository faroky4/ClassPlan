import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, requireHost } from "@/lib/session";
import { syncTeacherClassAssignments } from "@/lib/teacher-classes";
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

    if (parsed.data.classIds) {
      const foundClasses = await prisma.class.findMany({
        where: { id: { in: parsed.data.classIds } },
        select: { id: true },
      });
      if (foundClasses.length !== new Set(parsed.data.classIds).size) {
        return jsonError("أحد الصفوف المختارة غير موجود", 422);
      }
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: parsed.data.name,
        identity: parsed.data.identity,
      },
    });

    if (parsed.data.classIds) {
      await syncTeacherClassAssignments(params.id, parsed.data.classIds);
    }

    const assignedClasses = await prisma.teacherClass.findMany({
      where: { teacherId: params.id },
      include: { class: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      teacher: {
        id: updated.id,
        name: updated.name,
        identity: updated.identity,
        classes: assignedClasses.map((a) => ({ id: a.class.id, name: a.class.name })),
      },
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
