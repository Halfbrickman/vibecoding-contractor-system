/**
 * Utility untuk konversi dan kompresi gambar ke format WebP di sisi Client (Browser).
 * Berfungsi mengecilkan file raksasa (5-10MB) menjadi 150-400KB sebelum dikirim ke server.
 */

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function loadWatermark(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 - 1.0 (default 0.85)
  watermarkUrl?: string | null;
  isPanorama?: boolean;
}

export async function optimizeImageToWebP(
  file: File,
  options: OptimizeOptions = {}
): Promise<File> {
  // Hanya proses jika file adalah gambar bitmap (.jpg, .jpeg, .png, .webp, .bmp)
  // Abaikan file non-gambar (pdf, dwg, skp, xlsx) serta SVG / GIF animasi
  const isImage =
    file.type.startsWith("image/") &&
    !file.type.includes("svg") &&
    !file.type.includes("gif") &&
    !file.name.toLowerCase().endsWith(".ico");

  if (!isImage) {
    return file;
  }

  try {
    const img = await loadImage(file);
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (!width || !height) return file;

    // Batasan dimensi maksimal agar foto 4K/6K tidak berlebihan
    // Panorama 360 dipertahankan sampai 4096px
    const maxWidth = options.isPanorama ? 4096 : (options.maxWidth ?? 2560);
    const maxHeight = options.isPanorama ? 2048 : (options.maxHeight ?? 2560);

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // Gambar foto utama
    ctx.drawImage(img, 0, 0, width, height);

    // Tempel watermark jika diminta (dan bukan panorama)
    if (options.watermarkUrl && !options.isPanorama) {
      try {
        const wmImg = await loadWatermark(options.watermarkUrl);
        if (wmImg.naturalWidth && wmImg.naturalHeight) {
          const wmAspect = wmImg.naturalWidth / wmImg.naturalHeight;
          let wmWidth = Math.max(72, Math.round(width * 0.14));
          let wmHeight = Math.round(wmWidth / wmAspect);

          const maxWmHeight = Math.round(height * 0.18);
          if (wmHeight > maxWmHeight) {
            wmHeight = maxWmHeight;
            wmWidth = Math.round(wmHeight * wmAspect);
          }

          const margin = Math.max(16, Math.round(Math.min(width, height) * 0.03));
          const x = Math.max(margin, width - wmWidth - margin);
          const y = margin;

          ctx.save();
          ctx.globalAlpha = 0.45;
          ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
          ctx.shadowBlur = Math.max(2, Math.round(width * 0.003));
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
          ctx.restore();
        }
      } catch (e) {
        console.warn("Watermark dilewati:", e);
      }
    }

    // Export to WebP blob
    const quality = options.quality ?? (options.isPanorama ? 0.88 : 0.85);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );

    if (!blob) return file;

    // Ubah ekstensi file asli menjadi .webp
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const newFileName = `${baseName}.webp`;

    return new File([blob], newFileName, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn("Gagal konversi WebP di client, menggunakan file asli:", err);
    return file;
  }
}
