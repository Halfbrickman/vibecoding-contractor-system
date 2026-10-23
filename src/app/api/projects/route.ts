import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/format";
import { projectCreateSchema } from "@/lib/validations";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      client: true,
      rabCategories: {
        include: { items: true },
      },
      expenseLogs: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = projectCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input proyek tidak valid" },
        { status: 400 }
      );
    }

    const valid = parsed.data;
    const baseSlug = slugify(valid.title || "proyek-baru");
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    let clientId: string | undefined = undefined;
    if (valid.clientName) {
      const newClient = await prisma.client.create({
        data: {
          name: valid.clientName,
          phone: valid.clientPhone || "-",
          address: valid.location || "",
        },
      });
      clientId = newClient.id;
    }

    // Ambil template bab kategori dari MasterRabCategory yang berstatus isDefault = true
    const masterCats = await prisma.masterRabCategory.findMany({
      where: { isDefault: true },
      orderBy: { sortOrder: "asc" },
    });

    const initialCategories =
      masterCats.length > 0
        ? masterCats.map((mc, idx) => ({
            name: mc.name,
            sortOrder: idx + 1,
          }))
        : [
            { name: "I. PEKERJAAN PERSIAPAN", sortOrder: 1 },
            { name: "II. PEKERJAAN STRUKTUR & PONDASI", sortOrder: 2 },
            { name: "III. PEKERJAAN ARSITEKTUR & FINISHING", sortOrder: 3 },
          ];

    const project = await prisma.project.create({
      data: {
        title: valid.title,
        slug,
        type: valid.type,
        status: valid.status,
        location: valid.location || "",
        landArea: valid.landArea,
        buildingArea: valid.buildingArea,
        floors: valid.floors,
        unitsCount: valid.unitsCount,
        contractValue: valid.contractValue,
        description: valid.description || "",
        isPublished: valid.isPublished,
        thumbnailUrl: valid.thumbnailUrl || null,
        clientId,
        rabCategories: {
          create: initialCategories,
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Gagal membuat proyek baru" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID proyek tidak ditemukan" },
        { status: 400 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus proyek" },
      { status: 500 }
    );
  }
}
