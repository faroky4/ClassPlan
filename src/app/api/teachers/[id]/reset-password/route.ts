import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, requireHost } from "@/lib/session";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireHost();

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة", 422);
    }

    const teacher = await prisma.user.findUnique({ where: { id: params.id } });
    if (!teacher || teacher.role !== "teacher") {
      return jsonError("المعلمة غير موجودة", 404);
    }

    const passwordHash = await hash(parsed.data.password, 10);
    await prisma.user.update({
      where: { id: params.id },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
