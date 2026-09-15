import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "teacher") {
      throw new ApiError(403, "هذا الإجراء متاح للمعلمات فقط");
    }

    const slots = await prisma.classTimetable.findMany({
      where: { teacherId: session.user.id },
      include: { class: true },
      orderBy: { class: { order: "asc" } },
    });

    const classesMap = new Map<
      string,
      { id: string; name: string; slotsCount: number; subjects: Set<string> }
    >();

    for (const slot of slots) {
      if (!slot.class.active) continue;
      const entry = classesMap.get(slot.class.id) ?? {
        id: slot.class.id,
        name: slot.class.name,
        slotsCount: 0,
        subjects: new Set<string>(),
      };
      entry.slotsCount += 1;
      if (slot.subject) entry.subjects.add(slot.subject);
      classesMap.set(slot.class.id, entry);
    }

    const classes = Array.from(classesMap.values()).map((c) => ({
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
