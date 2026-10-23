import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsUpdateSchema } from "@/lib/validations";
import { DEFAULT_WORKFLOW_CARDS } from "@/lib/format";

export async function GET() {
  let profile = await prisma.companyProfile.findFirst();
  if (!profile) {
    profile = await prisma.companyProfile.create({
      data: {
        companyName: "Karya Bangun Mandiri",
        tagline: "Spesialis Bangun Rumah, Renovasi & Kontrakan Berkualitas",
        aboutDescription:
          "Kontraktor rancang bangun rumah tinggal, renovasi, dan kontrakan dengan dukungan visualisasi 3D SketchUp + Enscape/V-Ray dan gambar kerja Revit.",
        whatsappNumber: "6281234567890",
        workflowCardsJson: JSON.stringify(DEFAULT_WORKFLOW_CARDS),
      },
    });
  }
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = settingsUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.companyProfile.findFirst();
    const valid = parsed.data;

    const data = {
      companyName: valid.companyName,
      tagline: valid.tagline,
      aboutDescription: valid.aboutDescription,
      logoUrl: valid.logoUrl || null,
      letterheadLogoUrl: valid.letterheadLogoUrl || null,
      whatsappNumber: valid.whatsappNumber,
      email: valid.email || null,
      address: valid.address || null,
      yearsOfExperience: valid.yearsOfExperience,
      completedProjects: valid.completedProjects,
      heroBadge:
        valid.heroBadge ||
        "Spesialis Renovasi Rumah, Bangun Baru & Kontrakan",
      heroTitle:
        valid.heroTitle ||
        "Wujudkan Bangunan Impian Tanpa Drama & Biaya Membengkak.",
      heroImageUrl: valid.heroImageUrl || null,
      workflowSectionTitle:
        valid.workflowSectionTitle ||
        "Bukan Sekadar Tukang, Kami Bekerja dengan Sistem Teknik Lengkap",
      workflowSectionSubtitle:
        valid.workflowSectionSubtitle ||
        "Setiap proyek rumah maupun kontrakan direncanakan secara presisi sebelum satu bata pun dipasang di lapangan.",
      workflowCardsJson: valid.workflowCardsJson || null,
      priceRenovasiPerM2: valid.priceRenovasiPerM2,
      priceBangunStdPerM2: valid.priceBangunStdPerM2,
      priceBangunLuxPerM2: valid.priceBangunLuxPerM2,
      priceKontrakanPerM2: valid.priceKontrakanPerM2,
    };

    const updated = existing
      ? await prisma.companyProfile.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.companyProfile.create({ data });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan Company Profile" },
      { status: 500 }
    );
  }
}
