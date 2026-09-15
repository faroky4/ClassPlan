import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const SUBJECTS = ["لغة عربية", "رياضيات", "علوم", "لغة إنجليزية", "تربية إسلامية", "تربية فنية"];

async function main() {
  console.log("بدء تعبئة البيانات الأولية...");

  const adminPasswordHash = await hash("Admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { identity: "admin" },
    update: {},
    create: {
      name: "مدير النظام",
      identity: "admin",
      passwordHash: adminPasswordHash,
      role: "host",
    },
  });
  console.log(`✔ تم إنشاء حساب المدير: ${admin.identity}`);

  const classNames = Array.from({ length: 13 }, (_, i) => `الصف ${i + 1}`);
  const classes = [];
  for (let i = 0; i < classNames.length; i++) {
    const cls = await prisma.class.upsert({
      where: { id: `seed-class-${i + 1}` },
      update: {},
      create: {
        id: `seed-class-${i + 1}`,
        name: classNames[i],
        order: i + 1,
      },
    });
    classes.push(cls);
  }
  console.log(`✔ تم إنشاء ${classes.length} صف`);

  const teacherDefs = [
    { name: "أ. سارة أحمد", identity: "teacher1" },
    { name: "أ. مريم خالد", identity: "teacher2" },
    { name: "أ. هند علي", identity: "teacher3" },
  ];

  const teacherPasswordHash = await hash("Teacher123!", 10);
  const teachers = [];
  for (const t of teacherDefs) {
    const teacher = await prisma.user.upsert({
      where: { identity: t.identity },
      update: {},
      create: {
        name: t.name,
        identity: t.identity,
        passwordHash: teacherPasswordHash,
        role: "teacher",
      },
    });
    teachers.push(teacher);
  }
  console.log(`✔ تم إنشاء ${teachers.length} معلمة تجريبية (كلمة المرور: Teacher123!)`);

  // جدول حصص تجريبي بسيط لأول 3 صفوف فقط، لكل معلمة حصتان في كل صف
  const sampleClasses = classes.slice(0, 3);
  for (const cls of sampleClasses) {
    for (let day = 0; day < 5; day++) {
      for (let period = 1; period <= 7; period++) {
        const teacherIndex = (day + period) % teachers.length;
        const subjectIndex = (day + period) % SUBJECTS.length;

        await prisma.classTimetable.upsert({
          where: {
            classId_day_period: { classId: cls.id, day, period },
          },
          update: {},
          create: {
            classId: cls.id,
            day,
            period,
            subject: SUBJECTS[subjectIndex],
            teacherId: teachers[teacherIndex].id,
          },
        });
      }
    }
  }
  console.log(`✔ تم إنشاء جدول حصص تجريبي لأول ${sampleClasses.length} صفوف`);

  console.log("\nتمت تعبئة البيانات الأولية بنجاح.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
