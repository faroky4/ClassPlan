import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "teacher") {
      throw new ApiError(403, "هذا الإجراء متاح للمعلمات فقط");
    }

    const [assignments, slots] = await Promise.all([
      prisma.teacherClass.findMany({
        where: { teacherId: session.user.id },
        include: { class: true },
      }),
      prisma.classTimetable.findMany({
        where: { teacherId: session.user.id },
        include: { class: true },
      }),
    ]);

    const classesMap = new Map<
      string,
      { id: string; name: string; order: number; slotsCount: number; subjects: Set<string> }
    >();

    // اتحاد الصفوف المُعيَّنة صراحةً (checkboxes في نموذج المعلمات) مع الصفوف المستنتجة من حصصها
    // الفعلية في جدول الحصص - أي منهما كافٍ لتظهر لها في "صفوفي".
    for (const assignment of assignments) {
      if (!assignment.class.active) continue;
      classesMap.set(assignment.class.id, {
        id: assignment.class.id,
        name: assignment.class.name,
        order: assignment.class.order,
        slotsCount: 0,
        subjects: new Set<string>(),
      });
    }

    for (const slot of slots) {
      if (!slot.class.active) continue;
      const entry = classesMap.get(slot.class.id) ?? {
        id: slot.class.id,
        name: slot.class.name,
        order: slot.class.order,
        slotsCount: 0,
        subjects: new Set<string>(),
      };
      entry.slotsCount += 1;
      if (slot.subject) entry.subjects.add(slot.subject);
      classesMap.set(slot.class.id, entry);
    }

    const classes = Array.from(classesMap.values())
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slotsCount: c.slotsCount,
        subjects: Array.from(c.subjects),
      }));

    return NextResponse.json({ classes });
  } catch (error) {
    return handleApiError(error);
  }
}
