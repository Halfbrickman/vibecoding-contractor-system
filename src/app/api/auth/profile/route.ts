import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  hashPassword,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(sessionCookie);

    if (!session?.userId) {
      // Fallback: ambil user admin pertama jika belum ada session
      const defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
      }
      return NextResponse.json({
        name: defaultUser.name,
        email: defaultUser.email,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Gagal memuat profil administrator" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(sessionCookie);

    // Dapatkan user aktif (berdasarkan session atau user pertama)
    let user = session?.userId
      ? await prisma.user.findUnique({ where: { id: session.userId } })
      : await prisma.user.findFirst();

    if (!user) {
      return NextResponse.json(
        { error: "Akun administrator tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { currentPassword, newName, newEmail, newPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Password saat ini wajib diisi untuk verifikasi keamanan" },
        { status: 400 }
      );
    }

    // Verifikasi password lama
    const currentHash = await hashPassword(currentPassword);
    if (user.passwordHash !== currentHash) {
      return NextResponse.json(
        { error: "Password saat ini salah. Pastikan password lama Anda benar." },
        { status: 400 }
      );
    }

    // Cek jika email diganti dan apakah sudah dipakai user lain
    const targetEmail = newEmail ? newEmail.trim().toLowerCase() : user.email;
    if (targetEmail !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: targetEmail },
      });
      if (existing && existing.id !== user.id) {
        return NextResponse.json(
          { error: "Email baru sudah digunakan oleh akun lain" },
          { status: 400 }
        );
      }
    }

    // Siapkan data update
    const updateData: {
      name?: string;
      email?: string;
      passwordHash?: string;
    } = {};

    if (newName && newName.trim()) {
      updateData.name = newName.trim();
    }
    if (targetEmail) {
      updateData.email = targetEmail;
    }
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        return NextResponse.json(
          { error: "Password baru minimal 4 karakter" },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(newPassword.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Perbarui session token
    const newToken = await createSessionToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
    });

    const res = NextResponse.json({
      success: true,
      message: "Akun administrator & password berhasil diperbarui!",
      user: { name: updatedUser.name, email: updatedUser.email },
    });

    res.cookies.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui akun administrator" },
      { status: 500 }
    );
  }
}
