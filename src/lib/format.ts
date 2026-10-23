export function formatRupiah(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatProjectStatus(status: string): string {
  switch (status) {
    case "PLANNING":
      return "Perencanaan";
    case "ON_PROGRESS":
      return "On Progress";
    case "COMPLETED":
      return "Selesai";
    case "ON_HOLD":
      return "Ditunda";
    default:
      return status;
  }
}

export const DEFAULT_WORKFLOW_CARDS = [
  {
    title: "1. Pemodelan 3D & Render Realistis",
    description:
      "Menggunakan SketchUp, V-Ray & Enscape agar Anda bisa melihat bentuk rumah luar-dalam secara nyata sebelum dibangun.",
  },
  {
    title: "2. Gambar Kerja DED 2D Presisi",
    description:
      "Konversi model 3D ke gambar kerja teknis 2D dengan Autodesk Revit sebagai panduan akurat pelaksanaan di lapangan.",
  },
  {
    title: "3. Perhitungan RAB Detail & Jelas",
    description:
      "Rincian volume pekerjaan dan spesifikasi material dihitung transparan per item pekerjaan tanpa biaya tersembunyi.",
  },
  {
    title: "4. Client Portal Pantau Progres",
    description:
      "Setiap klien mendapatkan link khusus untuk memantau progres mingguan, foto lapangan, dan jadwal termin pembayaran.",
  },
];
