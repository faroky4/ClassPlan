import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, requireHost } from "@/lib/session";
import { createClassSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireHost();

    const classes = await prisma.class.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { weeklyPlans: true, timetable: true } },
      },
    });

    return NextResponse.json({
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        order: c.order,
        active: c.active,
        timetableSlotsCount: c._count.timetable,
        weeklyPlansCount: c._count.weeklyPlans,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireHost();

    const body = await request.json();
    const parsed = createClassSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة", 422);
    }

    const maxOrder = await prisma.class.aggregate({ _max: { order: true } });

    const created = await prisma.class.create({
      data: {
        name: parsed.data.name,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json({ class: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
