import { NextResponse } from "next/server";

import { currentWeekStartKey } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireHost } from "@/lib/session";

export async function GET() {
  try {
    await requireHost();

    const weekStart = new Date(`${currentWeekStartKey()}T00:00:00.000Z`);

    const [classesCount, teachersCount, classes, plansThisWeek] = await Promise.all([
      prisma.class.count({ where: { active: true } }),
      prisma.user.count({ where: { role: "teacher" } }),
      prisma.class.findMany({
        where: { active: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: {
          timetable: { where: { subject: { not: null } }, select: { id: true } },
        },
      }),
      prisma.weeklyPlan.findMany({
        where: { weekStart },
        select: { classId: true },
      }),
    ]);

    const filledCountByClass = new Map<string, number>();
    for (const plan of plansThisWeek) {
      filledCountByClass.set(plan.classId, (filledCountByClass.get(plan.classId) ?? 0) + 1);
    }

    let totalRequired = 0;
    let totalFilled = 0;
    const missingClasses: { id: string; name: string; required: number; filled: number; missing: number }[] = [];

    for (const cls of classes) {
      const required = cls.timetable.length;
      const filled = Math.min(filledCountByClass.get(cls.id) ?? 0, required);
      totalRequired += required;
      totalFilled += filled;
      const missing = required - filled;
      if (missing > 0) {
        missingClasses.push({ id: cls.id, name: cls.name, required, filled, missing });
      }
    }

    return NextResponse.json({
      weekStart: currentWeekStartKey(),
      classesCount,
      teachersCount,
      filledThisWeek: totalFilled,
      missingThisWeek: totalRequired - totalFilled,
      totalRequiredThisWeek: totalRequired,
      missingClasses,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
