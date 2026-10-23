import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { masterRabCategorySchema } from "@/lib/validations";

export async function GET() {
  const categories = await prisma.masterRabCategory.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = masterRabCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const created = await prisma.masterRabCategory.create({
      data: {
        name: parsed.data.name.toUpperCase(),
        sortOrder: parsed.data.sortOrder,
        isDefault: parsed.data.isDefault,
      },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("Create master category error:", error);
    return NextResponse.json(
      { error: "Gagal menambah Master Kategori Pekerjaan" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = masterRabCategorySchema.safeParse(body);
    if (!parsed.success || !body.id) {
      return NextResponse.json(
        { error: "Data perubahan kategori tidak valid" },
        { status: 400 }
      );
    }

    const updated = await prisma.masterRabCategory.update({
      where: { id: body.id },
      data: {
        name: parsed.data.name.toUpperCase(),
        sortOrder: parsed.data.sortOrder,
        isDefault: parsed.data.isDefault,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update master category error:", error);
    return NextResponse.json(
      { error: "Gagal mengubah Master Kategori Pekerjaan" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    await prisma.masterRabCategory.delete({ where: { id } });
  }
  return NextResponse.json({ success: true });
}
