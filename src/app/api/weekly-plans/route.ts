import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, jsonError, requireSession } from "@/lib/session";
import { teacherHasClassAccess } from "@/lib/teacher-classes";
import { weekStartSchema, weeklyPlanSaveSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const weekStart = searchParams.get("weekStart");

    if (!classId) return jsonError("classId مطلوب", 422);
    const weekParsed = weekStartSchema.safeParse(weekStart);
    if (!weekParsed.success) return jsonError("weekStart غير صحيح", 422);

    const classItem = await prisma.class.findUnique({ where: { id: classId } });
    if (!classItem) return jsonError("الصف غير موجود", 404);

    if (session.user.role === "teacher") {
      const hasAccess = await teacherHasClassAccess(session.user.id, classId);
      if (!hasAccess) {
        throw new ApiError(403, "لا تملكين صلاحية الوصول لهذا الصف");
      }
    }

    const [slots, plans] = await Promise.all([
      prisma.classTimetable.findMany({
        where: { classId },
        include: { teacher: { select: { id: true, name: true } } },
        orderBy: [{ day: "asc" }, { period: "asc" }],
      }),
      prisma.weeklyPlan.findMany({
        where: { classId, weekStart: new Date(`${weekParsed.data}T00:00:00.000Z`) },
      }),
    ]);

    const planKey = (day: number, period: number) => `${day}-${period}`;
    const plansMap = new Map(plans.map((p) => [planKey(p.day, p.period), p]));

    const cells = slots.map((slot) => {
      const plan = plansMap.get(planKey(slot.day, slot.period));
      const isEditable =
        session.user.role === "host" ||
        (Boolean(slot.teacherId) && slot.teacherId === session.user.id);

      return {
        day: slot.day,
        period: slot.period,
        subject: slot.subject,
        teacherId: slot.teacherId,
        teacherName: slot.teacher?.name ?? null,
        isEditable,
        plan: plan
          ? {
              id: plan.id,
              topic: plan.topic,
              page: plan.page,
              notes: plan.notes,
              updatedAt: plan.updatedAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      class: { id: classItem.id, name: classItem.name },
      weekStart: weekParsed.data,
      cells,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();

    const body = await request.json();
    const parsed = weeklyPlanSaveSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة", 422);
    }
    const { classId, day, period, weekStart, topic, page, notes } = parsed.data;

    const slot = await prisma.classTimetable.findUnique({
      where: { classId_day_period: { classId, day, period } },
    });

    if (!slot) {
      return jsonError("لا توجد حصة مسجّلة في هذه الخانة", 404);
    }

    const isHost = session.user.role === "host";
    const ownsSlot = slot.teacherId === session.user.id;

    if (!isHost && !ownsSlot) {
      throw new ApiError(403, "لست مخوّلة لتعديل هذه الحصة");
    }

    const plan = await prisma.weeklyPlan.upsert({
      where: {
        classId_day_period_weekStart: {
          classId,
          day,
          period,
          weekStart: new Date(`${weekStart}T00:00:00.000Z`),
        },
      },
      create: {
        classId,
        day,
        period,
        weekStart: new Date(`${weekStart}T00:00:00.000Z`),
        topic,
        page: page || null,
        notes: notes || null,
        createdBy: session.user.id,
      },
      update: {
        topic,
        page: page || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      plan: {
        id: plan.id,
        topic: plan.topic,
        page: plan.page,
        notes: plan.notes,
        updatedAt: plan.updatedAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
