import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, requireHost } from "@/lib/session";
import { createTeacherSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireHost();

    const teachers = await prisma.user.findMany({
      where: { role: "teacher" },
      orderBy: { name: "asc" },
      include: {
        teachingSlots: {
          include: { class: { select: { id: true, name: true } } },
        },
      },
    });

    const result = teachers.map((teacher) => {
      const classesMap = new Map<string, string>();
      for (const slot of teacher.teachingSlots) {
        classesMap.set(slot.class.id, slot.class.name);
      }
      return {
        id: teacher.id,
        name: teacher.name,
        identity: teacher.identity,
        createdAt: teacher.createdAt,
        classes: Array.from(classesMap, ([id, name]) => ({ id, name })),
        slotsCount: teacher.teachingSlots.length,
      };
    });

    return NextResponse.json({ teachers: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireHost();

    const body = await request.json();
    const parsed = createTeacherSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة", 422);
    }

    const existing = await prisma.user.findUnique({
      where: { identity: parsed.data.identity },
    });
    if (existing) {
      return jsonError("اسم المستخدم مستخدم بالفعل", 409);
    }

    const passwordHash = await hash(parsed.data.password, 10);
    const teacher = await prisma.user.create({
      data: {
        name: parsed.data.name,
        identity: parsed.data.identity,
        passwordHash,
        role: "teacher",
      },
    });

    return NextResponse.json(
      { teacher: { id: teacher.id, name: teacher.name, identity: teacher.identity } },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
