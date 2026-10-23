/**
 * Utility Client-Side untuk menempelkan Watermark Gambar secara permanen (Burn-in)
 * di Pojok Kanan Atas secara proporsional & transparan sebelum diunggah ke server.
 */

function loadImageFromUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export async function applyImageWatermark(
  file: File,
  watermarkUrl?: string | null,
  options?: {
    opacity?: number;
    widthRatio?: number;
    marginRatio?: number;
  }
): Promise<File> {
  // Hanya proses file gambar bitmap standar (.jpg, .png, .webp) dan jika ada URL watermark
  if (
    !watermarkUrl ||
    !file.type.startsWith("image/") ||
    file.type.includes("svg") ||
    file.type.includes("gif")
  ) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const [baseImg, wmImg] = await Promise.all([
      loadImageFromUrl(objectUrl),
      loadImageFromUrl(watermarkUrl),
    ]);

    const width = baseImg.naturalWidth || baseImg.width;
    const height = baseImg.naturalHeight || baseImg.height;

    if (!width || !height || !wmImg.naturalWidth || !wmImg.naturalHeight) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // 1. Gambar foto asli sesuai resolusi penuh (HD/4K terjaga)
    ctx.drawImage(baseImg, 0, 0, width, height);

    // 2. Hitung ukuran watermark proporsional (~14% lebar gambar, maksimal 18% tinggi gambar)
    const widthRatio = options?.widthRatio ?? 0.14;
    const marginRatio = options?.marginRatio ?? 0.03;
    const opacity = options?.opacity ?? 0.45;

    const wmAspect = wmImg.naturalWidth / wmImg.naturalHeight;
    let wmWidth = Math.max(72, Math.round(width * widthRatio));
    let wmHeight = Math.round(wmWidth / wmAspect);

    const maxWmHeight = Math.round(height * 0.18);
    if (wmHeight > maxWmHeight) {
      wmHeight = maxWmHeight;
      wmWidth = Math.round(wmHeight * wmAspect);
    }

    // 3. Posisi Pojok Kanan Atas dengan jarak padding proporsional
    const margin = Math.max(16, Math.round(Math.min(width, height) * marginRatio));
    const x = Math.max(margin, width - wmWidth - margin);
    const y = margin;

    // 4. Gambar watermark transparan + bayangan halus agar tetap terbaca di area langit terang
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
    ctx.shadowBlur = Math.max(2, Math.round(width * 0.003));
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
    ctx.restore();

    // 5. Konversi kembali ke File
    const outputMime =
      file.type === "image/png" || file.type === "image/webp"
        ? file.type
        : "image/jpeg";

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputMime, 0.92)
    );

    if (!blob) return file;

    return new File([blob], file.name, {
      type: outputMime,
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn("Watermark dilewati karena gagal memuat gambar:", err);
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
