import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding & Importing AHSP Excel ke Database...");

  // 0. Seed Default Admin User
  const adminEmail = "admin@kontraktor.com";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrator Utama",
      email: adminEmail,
      passwordHash: await hashPassword("admin123"),
      role: "SUPERADMIN",
    },
  });

  // 1. Bersihkan data template lama di MasterItem & MasterRabCategory agar tidak tercampur
  console.log("🧹 Membersihkan data template lama di MasterItem & MasterRabCategory...");
  await prisma.masterItem.deleteMany({});
  await prisma.masterRabCategory.deleteMany({});

  // 2. Baca file Excel AHSP di doc/DAFTAR HARGA SATUAN PEKERJAAN.xlsx
  const excelPath = path.join(
    process.cwd(),
    "doc",
    "DAFTAR HARGA SATUAN PEKERJAAN.xlsx"
  );

  if (fs.existsSync(excelPath)) {
    console.log("📄 Membaca file doc/DAFTAR HARGA SATUAN PEKERJAAN.xlsx...");
    const wb = XLSX.readFile(excelPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json< (string | number)[] >(sheet, {
      header: 1,
      defval: "",
    });

    const categoriesSet = new Set<string>();
    const masterItemsToInsert: {
      code: string | null;
      name: string;
      category: "PEKERJAAN";
      workGroup: string;
      unit: string;
      defaultPrice: number;
      notes: string | null;
    }[] = [];

    let currentGroup = "1.1 PEKERJAAN PERSIAPAN";

    for (const r of rows) {
      const code = String(r[1] || "").trim();
      const desc = String(r[2] || "").trim();
      const unit = String(r[3] || "").trim();
      const notes = String(r[4] || "").trim();
      const price = Number(r[6]);

      if (!desc || desc === "URAIAN PEKERJAAN") continue;

      // Deteksi baris Header Bab / Sub-Bab (misal: "1.1 PEKERJAAN PERSIAPAN" atau "2.2 PEKERJAAN STRUKTUR BETON")
      const codeParts = code.split(/[.,]/).filter(Boolean);
      if (!unit && (!price || isNaN(price)) && code && codeParts.length <= 2) {
        currentGroup = `${code} ${desc.toUpperCase()}`.replace(/\s+/g, " ").trim();
        categoriesSet.add(currentGroup);
        continue;
      }

      // Deteksi baris Item Pekerjaan yang memiliki Satuan & Harga Satuan valid
      if (unit && price > 0 && !isNaN(price)) {
        categoriesSet.add(currentGroup);
        masterItemsToInsert.push({
          code: code || null,
          name: desc,
          category: "PEKERJAAN",
          workGroup: currentGroup,
          unit,
          defaultPrice: price,
          notes: notes || null,
        });
      }
    }

    // Simpan seluruh Bab Kategori ke MasterRabCategory
    const defaultStarterGroups = [
      "1.1 PEKERJAAN PERSIAPAN",
      "1.2 PEKERJAAN GALIAN TANAH",
      "2.2 PEKERJAAN STRUKTUR BETON",
      "2.1 PEKERJAAN RANGKA ATAP",
      "3,6 PEKERJAAN PASANGAN DINDING",
      "3.7 PEKERJAAN PLESTERAN DAN ACIAN",
      "3.9 PEKERJAAN PENUTUP LANTAI",
      "3.8 PEKERJAAN PENGECATAN DAN PELITURAN",
    ];

    const categoryArray = Array.from(categoriesSet);
    for (let i = 0; i < categoryArray.length; i++) {
      const catName = categoryArray[i];
      await prisma.masterRabCategory.create({
        data: {
          name: catName,
          sortOrder: i + 1,
          isDefault: defaultStarterGroups.some((d) =>
            catName.includes(d.slice(4))
          ),
        },
      });
    }

    // Bulk insert 2.667 item pekerjaan ke MasterItem
    if (masterItemsToInsert.length > 0) {
      await prisma.masterItem.createMany({
        data: masterItemsToInsert,
      });
    }

    console.log(
      `✅ Berhasil mengimpor ${categoryArray.length} Bab Kategori dan ${masterItemsToInsert.length} Item Harga Satuan Pekerjaan dari Excel!`
    );
  } else {
    console.warn("⚠️ File doc/DAFTAR HARGA SATUAN PEKERJAAN.xlsx tidak ditemukan.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
