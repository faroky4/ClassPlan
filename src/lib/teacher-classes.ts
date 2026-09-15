import { prisma } from "@/lib/prisma";

/**
 * وصول المعلمة لصف يتحقق من مصدرين: التعيين الإداري الصريح (teacher_classes، يُدار من نموذج
 * المعلمات) أو وجود حصة فعلية لها في جدول الحصص (class_timetable). أي منهما كافٍ لإثبات الوصول -
 * هذا يحافظ على عمل المعلمات القائمات (المرتبطات فقط عبر جدول الحصص) دون كسر شيء.
 */
export async function teacherHasClassAccess(teacherId: string, classId: string): Promise<boolean> {
  const [assignment, slot] = await Promise.all([
    prisma.teacherClass.findFirst({ where: { teacherId, classId }, select: { id: true } }),
    prisma.classTimetable.findFirst({ where: { teacherId, classId }, select: { id: true } }),
  ]);
  return Boolean(assignment || slot);
}

/** يزامن قائمة الصفوف المسندة لمعلمة (من الـ checkboxes) مع جدول teacher_classes */
export async function syncTeacherClassAssignments(teacherId: string, classIds: string[]) {
  const uniqueIds = Array.from(new Set(classIds));

  await prisma.$transaction([
    prisma.teacherClass.deleteMany({
      where: { teacherId, classId: { notIn: uniqueIds } },
    }),
    ...uniqueIds.map((classId) =>
      prisma.teacherClass.upsert({
        where: { teacherId_classId: { teacherId, classId } },
        create: { teacherId, classId },
        update: {},
      }),
    ),
  ]);
}
