import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  rabCategoryCreateSchema,
  rabCategoryUpdateSchema,
  rabItemCreateSchema,
  rabItemUpdateSchema,
} from "@/lib/validations";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const body = await req.json();

    // Mode 1: Bulk Import dari Excel (.xlsx)
    if (body.mode === "EXCEL_IMPORT" && Array.isArray(body.rows)) {
      let currentCategory = await prisma.rabCategory.findFirst({
        where: { projectId },
        orderBy: { sortOrder: "asc" },
      });

      if (!currentCategory) {
        currentCategory = await prisma.rabCategory.create({
          data: {
            projectId,
            name: "I. HASIL IMPORT EXCEL RAB",
            sortOrder: 1,
          },
        });
      }

      for (const row of body.rows) {
        const desc = String(row.description || "").trim();
        if (!desc) continue;

        const rawVol = Number(row.volume);
        const rawPrice = Number(row.unitPrice);

        const isCategoryHeader =
          (!rawVol || isNaN(rawVol) || rawVol <= 0) &&
          (!rawPrice || isNaN(rawPrice) || rawPrice <= 0);

        if (isCategoryHeader) {
          currentCategory = await prisma.rabCategory.create({
            data: {
              projectId,
              name: desc.toUpperCase(),
              sortOrder: 99,
            },
          });
        } else {
          const vol = Math.max(0.001, isNaN(rawVol) ? 1 : rawVol);
          const price = Math.max(0, isNaN(rawPrice) ? 0 : rawPrice);
          await prisma.rabItem.create({
            data: {
              categoryId: currentCategory.id,
              description: desc,
              volume: vol,
              unit: String(row.unit || "ls").slice(0, 20),
              unitPrice: price,
              totalPrice: vol * price,
            },
          });
        }
      }

      await recalculateContractValue(projectId);
      return NextResponse.json({ success: true });
    }

    // Mode 2: Tambah Kategori RAB Baru
    if (body.mode === "ADD_CATEGORY") {
      const parsed = rabCategoryCreateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Nama kategori tidak valid" },
          { status: 400 }
        );
      }

      const count = await prisma.rabCategory.count({ where: { projectId } });
      const cat = await prisma.rabCategory.create({
        data: {
          projectId,
          name: parsed.data.name.toUpperCase(),
          sortOrder: parsed.data.sortOrder ?? count + 1,
        },
      });
      return NextResponse.json(cat);
    }

    // Mode 3: Tambah Baris Item RAB dengan Validasi Zod
    const parsedItem = rabItemCreateSchema.safeParse(body);
    if (!parsedItem.success) {
      return NextResponse.json(
        { error: parsedItem.error.issues[0]?.message || "Data item RAB tidak valid" },
        { status: 400 }
      );
    }

    const { categoryId, description, volume, unit, unitPrice } = parsedItem.data;
    const totalPrice = volume * unitPrice;

    const item = await prisma.rabItem.create({
      data: {
        categoryId,
        description,
        volume,
        unit,
        unitPrice,
        totalPrice,
      },
    });

    await recalculateContractValue(projectId);
    return NextResponse.json(item);
  } catch (error) {
    console.error("RAB POST error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data RAB" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const body = await req.json();

    // Update Nama / Urutan Kategori Bab RAB
    if (body.mode === "UPDATE_CATEGORY") {
      const parsed = rabCategoryUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Data kategori tidak valid" },
          { status: 400 }
        );
      }

      const updatedCat = await prisma.rabCategory.update({
        where: { id: parsed.data.categoryId },
        data: {
          name: parsed.data.name.toUpperCase(),
          ...(parsed.data.sortOrder !== undefined
            ? { sortOrder: parsed.data.sortOrder }
            : {}),
        },
      });
      return NextResponse.json(updatedCat);
    }

    // Update Baris Item RAB
    if (body.mode === "UPDATE_ITEM") {
      const parsed = rabItemUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Data item tidak valid" },
          { status: 400 }
        );
      }

      const { itemId, description, volume, unit, unitPrice } = parsed.data;
      const updatedItem = await prisma.rabItem.update({
        where: { id: itemId },
        data: {
          description,
          volume,
          unit,
          unitPrice,
          totalPrice: volume * unitPrice,
        },
      });
      await recalculateContractValue(projectId);
      return NextResponse.json(updatedItem);
    }

    return NextResponse.json({ error: "Mode PUT tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("RAB PUT error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data RAB" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const categoryId = searchParams.get("categoryId");

  if (categoryId) {
    await prisma.rabCategory.delete({ where: { id: categoryId } });
    await recalculateContractValue(projectId);
    return NextResponse.json({ success: true });
  }

  if (itemId) {
    await prisma.rabItem.delete({ where: { id: itemId } });
    await recalculateContractValue(projectId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Parameter tidak ditemukan" }, { status: 400 });
}

async function recalculateContractValue(projectId: string) {
  const categories = await prisma.rabCategory.findMany({
    where: { projectId },
    include: { items: true },
  });

  const sum = categories.reduce(
    (acc, cat) =>
      acc +
      cat.items.reduce((itemAcc, item) => itemAcc + Number(item.totalPrice), 0),
    0
  );

  await prisma.project.update({
    where: { id: projectId },
    data: { contractValue: sum },
  });
}
