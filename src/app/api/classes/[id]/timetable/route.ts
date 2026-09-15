import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, jsonError, requireHost, requireSession } from "@/lib/session";
import { teacherHasClassAccess } from "@/lib/teacher-classes";
import { timetableUpdateSchema } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();

    const classItem = await prisma.class.findUnique({ where: { id: params.id } });
    if (!classItem) {
      return jsonError("الصف غير موجود", 404);
    }

    if (session.user.role === "teacher") {
      const hasAccess = await teacherHasClassAccess(session.user.id, params.id);
      if (!hasAccess) {
        throw new ApiError(403, "لا تملكين صلاحية الوصول لهذا الصف");
      }
    }

    const slots = await prisma.classTimetable.findMany({
      where: { classId: params.id },
      include: { teacher: { select: { id: true, name: true } } },
      orderBy: [{ day: "asc" }, { period: "asc" }],
    });

    return NextResponse.json({
      class: { id: classItem.id, name: classItem.name },
      slots: slots.map((s) => ({
        id: s.id,
        day: s.day,
        period: s.period,
        subject: s.subject,
        teacherId: s.teacherId,
        teacherName: s.teacher?.name ?? null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireHost();

    const classItem = await prisma.class.findUnique({ where: { id: params.id } });
    if (!classItem) {
      return jsonError("الصف غير موجود", 404);
    }

    const body = await request.json();
    const parsed = timetableUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة", 422);
    }

    const teacherIds = Array.from(
      new Set(parsed.data.slots.map((s) => s.teacherId).filter((id): id is string => Boolean(id))),
    );
    if (teacherIds.length > 0) {
      const foundTeachers = await prisma.user.findMany({
        where: { id: { in: teacherIds }, role: "teacher" },
        select: { id: true },
      });
      if (foundTeachers.length !== teacherIds.length) {
        return jsonError("أحد المعلمات المختارات غير موجودة", 422);
      }
    }

    await prisma.$transaction(
      parsed.data.slots.map((slot) =>
        prisma.classTimetable.upsert({
          where: {
            classId_day_period: { classId: params.id, day: slot.day, period: slot.period },
          },
          create: {
            classId: params.id,
            day: slot.day,
            period: slot.period,
            subject: slot.subject || null,
            teacherId: slot.teacherId || null,
          },
          update: {
            subject: slot.subject || null,
            teacherId: slot.teacherId || null,
          },
        }),
      ),
    );

    const slots = await prisma.classTimetable.findMany({
      where: { classId: params.id },
      include: { teacher: { select: { id: true, name: true } } },
      orderBy: [{ day: "asc" }, { period: "asc" }],
    });

    return NextResponse.json({
      slots: slots.map((s) => ({
        id: s.id,
        day: s.day,
        period: s.period,
        subject: s.subject,
        teacherId: s.teacherId,
        teacherName: s.teacher?.name ?? null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
