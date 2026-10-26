import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { masterItemSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(
      1,
      Math.min(200, parseInt(searchParams.get("limit") || "50"))
    );
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "ALL";
    const workGroup = searchParams.get("workGroup") || "ALL";
    const fetchAll = searchParams.get("all") === "true";

    const where: Record<string, unknown> = {};

    if (category !== "ALL") {
      where.category = category;
    }
    if (workGroup !== "ALL") {
      where.workGroup = workGroup;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { workGroup: { contains: search, mode: "insensitive" } },
      ];
    }

    // Kompatibilitas jika dipanggil dengan all=true
    if (fetchAll) {
      const items = await prisma.masterItem.findMany({
        where,
        orderBy: [{ workGroup: "asc" }, { code: "asc" }, { name: "asc" }],
      });
      return NextResponse.json(items);
    }

    // Server-Side Pagination: hanya ambil 50 baris yang dibutuhkan
    const [total, items, distinctGroups] = await Promise.all([
      prisma.masterItem.count({ where }),
      prisma.masterItem.findMany({
        where,
        orderBy: [{ workGroup: "asc" }, { code: "asc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.masterItem.findMany({
        where: { workGroup: { not: null } },
        distinct: ["workGroup"],
        select: { workGroup: true },
        orderBy: { workGroup: "asc" },
      }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      groups: distinctGroups
        .map((g) => g.workGroup)
        .filter(Boolean) as string[],
    });
  } catch (error) {
    console.error("Fetch master items error:", error);
    return NextResponse.json(
      { error: "Gagal memuat master items" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Mode 1: Bulk Import dari Excel Master AHSP (.xlsx)
    if (body.mode === "EXCEL_IMPORT" && Array.isArray(body.items)) {
      if (body.clearExisting) {
        await prisma.masterItem.deleteMany({});
      }

      if (Array.isArray(body.categories) && body.categories.length > 0) {
        if (body.clearExisting) {
          await prisma.masterRabCategory.deleteMany({});
        }
        for (let i = 0; i < body.categories.length; i++) {
          const catName = String(body.categories[i] || "").trim().toUpperCase();
          if (!catName) continue;
          await prisma.masterRabCategory.upsert({
            where: { name: catName },
            update: {},
            create: {
              name: catName,
              sortOrder: i + 1,
              isDefault: i < 6,
            },
          });
        }
      }

      const validItems = body.items
        .map((it: Record<string, unknown>) => ({
          code: it.code ? String(it.code).trim().slice(0, 100) : null,
          name: String(it.name || "").trim(),
          category: "PEKERJAAN" as const,
          workGroup: it.workGroup
            ? String(it.workGroup).trim().slice(0, 250)
            : null,
          unit: String(it.unit || "ls").trim().slice(0, 50),
          defaultPrice: Math.max(0, Number(it.defaultPrice) || 0),
          notes: it.notes ? String(it.notes).trim() : null,
        }))
        .filter((it: { name: string; defaultPrice: number }) => it.name.length >= 2 && it.defaultPrice > 0);

      if (validItems.length > 0) {
        await prisma.masterItem.createMany({
          data: validItems,
        });
      }

      return NextResponse.json({
        success: true,
        importedCount: validItems.length,
      });
    }

    // Mode 2: Tambah 1 Item Master Harga Satuan
    const parsed = masterItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const valid = parsed.data;
    const item = await prisma.masterItem.create({
      data: {
        code: valid.code || null,
        name: valid.name,
        category: valid.category,
        workGroup: valid.workGroup || null,
        unit: valid.unit,
        defaultPrice: valid.defaultPrice,
        notes: valid.notes || null,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Create master item error:", error);
    return NextResponse.json(
      { error: "Gagal menambah item Master Harga Satuan" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = masterItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data tidak valid" },
        { status: 400 }
      );
    }
    if (!body.id) {
      return NextResponse.json(
        { error: "ID item tidak ditemukan" },
        { status: 400 }
      );
    }

    const valid = parsed.data;
    const updated = await prisma.masterItem.update({
      where: { id: body.id },
      data: {
        code: valid.code || null,
        name: valid.name,
        category: valid.category,
        workGroup: valid.workGroup || null,
        unit: valid.unit,
        defaultPrice: valid.defaultPrice,
        notes: valid.notes || null,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update master item error:", error);
    return NextResponse.json(
      { error: "Gagal mengubah item Master Harga Satuan" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    await prisma.masterItem.delete({ where: { id } });
  }
  return NextResponse.json({ success: true });
}
