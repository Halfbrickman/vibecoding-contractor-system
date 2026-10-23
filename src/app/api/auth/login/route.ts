import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import {
  createSessionToken,
  hashPassword,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data login tidak valid" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const passwordHash = await hashPassword(password);

    // Pastikan jika tabel User masih kosong, buat akun default admin@kontraktor.com / admin123
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      await prisma.user.create({
        data: {
          name: "Administrator Utama",
          email: "admin@kontraktor.com",
          passwordHash: await hashPassword("admin123"),
          role: "SUPERADMIN",
        },
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.passwordHash !== passwordHash) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const res = NextResponse.json({
      success: true,
      user: { name: user.name, email: user.email },
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat proses login" },
      { status: 500 }
    );
  }
}
