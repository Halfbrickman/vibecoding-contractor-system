import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  expenseCreateSchema,
  progressCreateSchema,
  terminCreateSchema,
} from "@/lib/validations";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const body = await req.json();

    if (body.action === "ADD_MEDIA") {
      const media = await prisma.projectMedia.create({
        data: {
          projectId,
          title: body.title || "Visual Proyek",
          mediaType: body.mediaType || "RENDER_3D",
          roomName: body.roomName || "Umum",
          fileUrl: body.fileUrl,
        },
      });
      return NextResponse.json(media);
    }

    if (body.action === "ADD_DOCUMENT") {
      const doc = await prisma.projectDocument.create({
        data: {
          projectId,
          title: body.title || "Dokumen Teknis",
          docType: body.docType || "REVIT_2D",
          version: body.version || "Rev 01",
          fileUrl: body.fileUrl,
          notes: body.notes || "",
        },
      });
      return NextResponse.json(doc);
    }

    if (body.action === "ADD_EXPENSE") {
      const parsed = expenseCreateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Data pengeluaran tidak valid" },
          { status: 400 }
        );
      }

      const expense = await prisma.expenseLog.create({
        data: {
          projectId,
          category: parsed.data.category,
          description: parsed.data.description,
          amount: parsed.data.amount,
          receiptFileUrl: parsed.data.receiptFileUrl || null,
          recordedBy: "Admin",
        },
      });
      return NextResponse.json(expense);
    }

    if (body.action === "ADD_PROGRESS") {
      const parsed = progressCreateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Data progres tidak valid" },
          { status: 400 }
        );
      }

      const progress = await prisma.progressLog.create({
        data: {
          projectId,
          weekNumber: parsed.data.weekNumber,
          percentage: parsed.data.percentage,
          summary: parsed.data.summary,
          photoUrls: parsed.data.photoUrl ? [parsed.data.photoUrl] : [],
        },
      });
      return NextResponse.json(progress);
    }

    if (body.action === "ADD_TERMIN") {
      const parsed = terminCreateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Data termin tidak valid" },
          { status: 400 }
        );
      }

      const termin = await prisma.paymentTermin.create({
        data: {
          projectId,
          terminName: parsed.data.terminName,
          invoiceNumber: parsed.data.invoiceNumber || `INV/${Date.now().toString().slice(-5)}`,
          percentage: parsed.data.percentage ?? null,
          amount: parsed.data.amount,
          status: parsed.data.status,
          paidAt: parsed.data.status === "PAID" ? new Date() : null,
          paymentProof: parsed.data.paymentProof || null,
        },
      });
      return NextResponse.json(termin);
    }

    if (body.action === "UPDATE_EXPENSE") {
      const parsed = expenseCreateSchema.safeParse(body);
      if (!parsed.success || !body.expenseId) {
        return NextResponse.json(
          { error: parsed.error?.issues[0]?.message || "Data pengeluaran tidak valid" },
          { status: 400 }
        );
      }

      const updated = await prisma.expenseLog.update({
        where: { id: body.expenseId },
        data: {
          category: parsed.data.category,
          description: parsed.data.description,
          amount: parsed.data.amount,
          receiptFileUrl: parsed.data.receiptFileUrl || null,
        },
      });
      return NextResponse.json(updated);
    }

    if (body.action === "UPDATE_TERMIN") {
      const parsed = terminCreateSchema.safeParse(body);
      if (!parsed.success || !body.terminId) {
        return NextResponse.json(
          { error: parsed.error?.issues[0]?.message || "Data termin tidak valid" },
          { status: 400 }
        );
      }

      const updated = await prisma.paymentTermin.update({
        where: { id: body.terminId },
        data: {
          terminName: parsed.data.terminName,
          invoiceNumber: parsed.data.invoiceNumber || null,
          amount: parsed.data.amount,
          status: parsed.data.status,
          paidAt: parsed.data.status === "PAID" ? new Date() : null,
          paymentProof: parsed.data.paymentProof || null,
        },
      });
      return NextResponse.json(updated);
    }

    if (body.action === "UPDATE_PROGRESS") {
      const parsed = progressCreateSchema.safeParse(body);
      if (!parsed.success || !body.progressId) {
        return NextResponse.json(
          { error: parsed.error?.issues[0]?.message || "Data progres tidak valid" },
          { status: 400 }
        );
      }

      const updated = await prisma.progressLog.update({
        where: { id: body.progressId },
        data: {
          weekNumber: parsed.data.weekNumber,
          percentage: parsed.data.percentage,
          summary: parsed.data.summary,
          photoUrls: parsed.data.photoUrl ? [parsed.data.photoUrl] : [],
        },
      });
      return NextResponse.json(updated);
    }

    if (body.action === "TOGGLE_TERMIN_STATUS") {
      const nextStatus = body.status === "PAID" ? "PAID" : "UNPAID";
      const updated = await prisma.paymentTermin.update({
        where: { id: body.terminId },
        data: {
          status: nextStatus,
          paidAt: nextStatus === "PAID" ? new Date() : null,
        },
      });
      return NextResponse.json(updated);
    }

    if (body.action === "UPDATE_PROJECT_META") {
      const updated = await prisma.project.update({
        where: { id: projectId },
        data: {
          title: body.title,
          location: body.location,
          type: body.type,
          status: body.status,
          buildingArea: Number(body.buildingArea) || 0,
          landArea: Number(body.landArea) || 0,
          floors: Number(body.floors) || 1,
          unitsCount: Number(body.unitsCount) || 1,
          description: body.description,
          isPublished: Boolean(body.isPublished),
          isFeatured: Boolean(body.isFeatured),
          beforeImageUrl: body.beforeImageUrl || null,
          afterImageUrl: body.afterImageUrl || null,
          thumbnailUrl: body.thumbnailUrl || null,
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Action tidak dikenali" }, { status: 400 });
  } catch (error) {
    console.error("Extras API error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data proyek" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target");
  const id = searchParams.get("id");

  if (!id || !target) {
    return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
  }

  if (target === "media") {
    await prisma.projectMedia.delete({ where: { id } });
  } else if (target === "document") {
    await prisma.projectDocument.delete({ where: { id } });
  } else if (target === "expense") {
    await prisma.expenseLog.delete({ where: { id } });
  } else if (target === "termin") {
    await prisma.paymentTermin.delete({ where: { id } });
  } else if (target === "progress") {
    await prisma.progressLog.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
