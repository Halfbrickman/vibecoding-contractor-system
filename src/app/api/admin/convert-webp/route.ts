import { NextRequest, NextResponse } from "next/server";
import { readdir, stat, unlink } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

const CONVERTIBLE_EXTS = [".jpg", ".jpeg", ".png"];

interface ReplacementMap {
  [oldUrl: string]: string;
}

async function scanAndConvertDir(
  dir: string,
  uploadDirPath: string,
  basePublicUrl: string,
  replacements: ReplacementMap
): Promise<{ count: number; savedBytes: number }> {
  let count = 0;
  let savedBytes = 0;

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return { count: 0, savedBytes: 0 };
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await scanAndConvertDir(
        fullPath,
        uploadDirPath,
        basePublicUrl,
        replacements
      );
      count += sub.count;
      savedBytes += sub.savedBytes;
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (CONVERTIBLE_EXTS.includes(ext)) {
        try {
          const oldStat = await stat(fullPath);
          const newFileName = `${path.basename(entry.name, ext)}.webp`;
          const newFullPath = path.join(dir, newFileName);

          // Konversi ke WebP kualitas 85
          await sharp(fullPath)
            .webp({ quality: 85, effort: 4 })
            .toFile(newFullPath);

          const newStat = await stat(newFullPath);
          savedBytes += Math.max(0, oldStat.size - newStat.size);

          // Hapus file lama jika nama file berbeda
          if (fullPath !== newFullPath) {
            await unlink(fullPath);
          }

          // Petakan URL lama ke URL baru
          const relPath = path
            .relative(uploadDirPath, fullPath)
            .replace(/\\/g, "/");
          const newRelPath = path
            .relative(uploadDirPath, newFullPath)
            .replace(/\\/g, "/");

          const oldUrl = `${basePublicUrl}/${relPath}`;
          const newUrl = `${basePublicUrl}/${newRelPath}`;
          replacements[oldUrl] = newUrl;
          if (oldUrl.startsWith("/")) {
            replacements[oldUrl.slice(1)] = newUrl;
          }

          count++;
        } catch (err) {
          console.error(`Gagal mengonversi file ${fullPath}:`, err);
        }
      }
    }
  }

  return { count, savedBytes };
}

export async function POST(_req: NextRequest) {
  try {
    const baseUploadDir = process.env.LOCAL_UPLOAD_DIR || "./public/uploads";
    const basePublicUrl = (
      process.env.NEXT_PUBLIC_STORAGE_BASE_URL || "/uploads"
    ).replace(/\/$/, "");
    const uploadDirPath = path.resolve(process.cwd(), baseUploadDir);
    const replacements: ReplacementMap = {};

    const { count, savedBytes } = await scanAndConvertDir(
      uploadDirPath,
      uploadDirPath,
      basePublicUrl,
      replacements
    );

    let dbUpdates = 0;

    // Update database jika ada file yang dikonversi
    const replaceUrl = (url: string | null | undefined): string | null => {
      if (!url) return null;
      return replacements[url] || url;
    };

    if (Object.keys(replacements).length > 0) {
      // 1. CompanyProfile
      const profiles = await prisma.companyProfile.findMany();
      for (const p of profiles) {
        const nextLogo = replaceUrl(p.logoUrl);
        const nextLetterhead = replaceUrl(p.letterheadLogoUrl);
        const nextFavicon = replaceUrl(p.faviconUrl);
        const nextWatermark = replaceUrl(p.watermarkLogoUrl);
        const nextHero = replaceUrl(p.heroImageUrl);

        if (
          nextLogo !== p.logoUrl ||
          nextLetterhead !== p.letterheadLogoUrl ||
          nextFavicon !== p.faviconUrl ||
          nextWatermark !== p.watermarkLogoUrl ||
          nextHero !== p.heroImageUrl
        ) {
          await prisma.companyProfile.update({
            where: { id: p.id },
            data: {
              logoUrl: nextLogo,
              letterheadLogoUrl: nextLetterhead,
              faviconUrl: nextFavicon,
              watermarkLogoUrl: nextWatermark,
              heroImageUrl: nextHero,
            },
          });
          dbUpdates++;
        }
      }

      // 2. Project
      const projects = await prisma.project.findMany();
      for (const prj of projects) {
        const nextThumb = replaceUrl(prj.thumbnailUrl);
        const nextBefore = replaceUrl(prj.beforeImageUrl);
        const nextAfter = replaceUrl(prj.afterImageUrl);

        if (
          nextThumb !== prj.thumbnailUrl ||
          nextBefore !== prj.beforeImageUrl ||
          nextAfter !== prj.afterImageUrl
        ) {
          await prisma.project.update({
            where: { id: prj.id },
            data: {
              thumbnailUrl: nextThumb,
              beforeImageUrl: nextBefore,
              afterImageUrl: nextAfter,
            },
          });
          dbUpdates++;
        }
      }

      // 3. ProjectMedia
      const medias = await prisma.projectMedia.findMany();
      for (const m of medias) {
        const nextUrl = replaceUrl(m.fileUrl);
        if (nextUrl && nextUrl !== m.fileUrl) {
          await prisma.projectMedia.update({
            where: { id: m.id },
            data: { fileUrl: nextUrl },
          });
          dbUpdates++;
        }
      }

      // 4. ProgressLog
      const logs = await prisma.progressLog.findMany();
      for (const l of logs) {
        if (Array.isArray(l.photoUrls) && l.photoUrls.length > 0) {
          let changed = false;
          const nextUrls = l.photoUrls.map((u) => {
            const r = replaceUrl(u);
            if (r && r !== u) changed = true;
            return r || u;
          });
          if (changed) {
            await prisma.progressLog.update({
              where: { id: l.id },
              data: { photoUrls: nextUrls },
            });
            dbUpdates++;
          }
        }
      }

      // 5. PaymentTermin
      const termins = await prisma.paymentTermin.findMany();
      for (const t of termins) {
        if (t.paymentProof) {
          const nextProof = replaceUrl(t.paymentProof);
          if (nextProof !== t.paymentProof) {
            await prisma.paymentTermin.update({
              where: { id: t.id },
              data: { paymentProof: nextProof },
            });
            dbUpdates++;
          }
        }
      }

      // 6. ExpenseLog
      const expenses = await prisma.expenseLog.findMany();
      for (const e of expenses) {
        if (e.receiptFileUrl) {
          const nextReceipt = replaceUrl(e.receiptFileUrl);
          if (nextReceipt !== e.receiptFileUrl) {
            await prisma.expenseLog.update({
              where: { id: e.id },
              data: { receiptFileUrl: nextReceipt },
            });
            dbUpdates++;
          }
        }
      }
    }

    const savedMB = (savedBytes / (1024 * 1024)).toFixed(2);
    const savedSpaceKB = Math.round(savedBytes / 1024);

    return NextResponse.json({
      success: true,
      convertedCount: count,
      dbUpdates,
      savedBytes,
      savedSpaceKB,
      savedMB,
      message: `Berhasil mengonversi ${count} gambar lama ke WebP. Menghemat ${savedMB} MB!`,
      replacements,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Gagal memproses migrasi WebP" },
      { status: 500 }
    );
  }
}
