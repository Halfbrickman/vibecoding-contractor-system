import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { ALLOWED_EXTENSIONS, MAX_UPLOAD_SIZE_BYTES } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = (formData.get("folder") as string) || "general";
    const folder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, "");

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas maksimal 250 MB" },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `Tipe file (${ext}) tidak diizinkan. Gunakan format gambar, PDF, DWG, SKP, atau Excel.`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitasi nama file
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `${Date.now()}-${safeName}`;

    // Mendukung penyimpanan ke folder lokal / Home Server NAS path dari .env
    const baseUploadDir = process.env.LOCAL_UPLOAD_DIR || "./public/uploads";
    const targetDir = path.join(process.cwd(), baseUploadDir, folder);

    await mkdir(targetDir, { recursive: true });
    const filePath = path.join(targetDir, uniqueFileName);
    await writeFile(filePath, buffer);

    const publicBaseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || "/uploads";
    const fileUrl = `${publicBaseUrl}/${folder}/${uniqueFileName}`;

    return NextResponse.json({
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Gagal mengunggah file ke server penyimpanan" },
      { status: 500 }
    );
  }
}
