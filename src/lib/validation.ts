import { z } from "zod";

export const identitySchema = z
  .string()
  .trim()
  .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
  .max(50, "اسم المستخدم طويل جدًا")
  .regex(/^[a-zA-Z0-9_.-]+$/, "اسم المستخدم يجب أن يحتوي أحرف/أرقام إنجليزية فقط");

export const passwordSchema = z
  .string()
  .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
  .max(100, "كلمة المرور طويلة جدًا");

export const createTeacherSchema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب").max(100),
  identity: identitySchema,
  password: passwordSchema,
  classIds: z.array(z.string().min(1)).max(100).optional().default([]),
});

export const updateTeacherSchema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب").max(100).optional(),
  identity: identitySchema.optional(),
  classIds: z.array(z.string().min(1)).max(100).optional(),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "اسم الصف مطلوب").max(100),
});

export const updateClassSchema = z.object({
  name: z.string().trim().min(1, "اسم الصف مطلوب").max(100).optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const timetableSlotSchema = z.object({
  day: z.number().int().min(0).max(4),
  period: z.number().int().min(1).max(7),
  subject: z.string().trim().max(100).nullable().optional(),
  teacherId: z.string().trim().nullable().optional(),
});

export const timetableUpdateSchema = z.object({
  slots: z.array(timetableSlotSchema).min(1),
});

export const weekStartSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة تاريخ الأسبوع غير صحيحة");

export const weeklyPlanSaveSchema = z.object({
  classId: z.string().min(1),
  day: z.number().int().min(0).max(4),
  period: z.number().int().min(1).max(7),
  weekStart: weekStartSchema,
  topic: z.string().trim().min(1, "الموضوع مطلوب").max(300),
  page: z.string().trim().max(50).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const clearPlansSchema = z.object({
  confirm: z.literal("DELETE"),
});
