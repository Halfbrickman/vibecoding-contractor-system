import { z } from "zod";

// 1. Validasi Login Admin
export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(4, "Password minimal 4 karakter"),
});

// 2. Validasi Pembuatan Proyek Baru
export const projectCreateSchema = z.object({
  title: z.string().min(3, "Nama proyek minimal 3 karakter").max(150),
  type: z.enum(["RENOVASI", "BANGUN_BARU", "KONTRAKAN", "INTERIOR"]).default("BANGUN_BARU"),
  status: z.enum(["PLANNING", "ON_PROGRESS", "COMPLETED", "ON_HOLD"]).default("PLANNING"),
  location: z.string().max(200).optional().nullable(),
  clientName: z.string().max(120).optional().nullable(),
  clientPhone: z.string().max(30).optional().nullable(),
  landArea: z.coerce.number().min(0, "Luas tanah tidak boleh negatif").default(0),
  buildingArea: z.coerce.number().min(0, "Luas bangunan tidak boleh negatif").default(0),
  floors: z.coerce.number().int().min(1, "Minimal 1 lantai").max(50).default(1),
  unitsCount: z.coerce.number().int().min(1, "Minimal 1 pintu/unit").max(200).default(1),
  contractValue: z.coerce.number().min(0).default(0),
  description: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  thumbnailUrl: z.string().optional().nullable(),
});

// 3. Validasi Item & Kategori RAB
export const rabItemCreateSchema = z.object({
  categoryId: z.string().min(1, "Kategori RAB wajib dipilih"),
  description: z.string().min(2, "Uraian pekerjaan minimal 2 karakter"),
  volume: z.coerce.number().positive("Volume harus lebih dari 0"),
  unit: z.string().min(1, "Satuan wajib diisi").max(20),
  unitPrice: z.coerce.number().min(0, "Harga satuan tidak boleh negatif"),
});

export const rabItemUpdateSchema = z.object({
  itemId: z.string().min(1),
  description: z.string().min(2),
  volume: z.coerce.number().positive("Volume harus lebih dari 0"),
  unit: z.string().min(1).max(20),
  unitPrice: z.coerce.number().min(0, "Harga satuan tidak boleh negatif"),
});

export const rabCategoryCreateSchema = z.object({
  name: z.string().min(2, "Nama bab kategori minimal 2 karakter").max(120),
  sortOrder: z.coerce.number().int().optional(),
});

export const rabCategoryUpdateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2, "Nama bab kategori minimal 2 karakter").max(120),
  sortOrder: z.coerce.number().int().optional(),
});

// 4. Validasi Master Harga Satuan & Master Kategori RAB
export const masterItemSchema = z.object({
  id: z.string().optional(),
  code: z.string().max(100).optional().nullable(),
  name: z.string().min(2, "Nama item minimal 2 karakter").max(600),
  category: z.enum(["PEKERJAAN", "MATERIAL", "UPAH"]).default("PEKERJAAN"),
  workGroup: z.string().max(250).optional().nullable(),
  unit: z.string().min(1, "Satuan wajib diisi").max(50),
  defaultPrice: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  notes: z.string().optional().nullable(),
});

export const masterRabCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nama kategori minimal 2 karakter").max(250),
  sortOrder: z.coerce.number().int().default(1),
  isDefault: z.boolean().default(true),
});

// 5. Validasi Pengeluaran Lapangan, Progres & Termin Pembayaran
export const expenseCreateSchema = z.object({
  category: z.enum(["MATERIAL", "UPAH_TUKANG", "SEWA_ALAT", "OPERASIONAL"]).default("MATERIAL"),
  description: z.string().min(2, "Keterangan pengeluaran wajib diisi"),
  amount: z.coerce.number().positive("Nominal pengeluaran harus lebih dari 0"),
  receiptFileUrl: z.string().optional().nullable(),
});

export const progressCreateSchema = z.object({
  weekNumber: z.coerce.number().int().min(1, "Minggu minimal 1"),
  percentage: z.coerce.number().min(0).max(100, "Persentase maksimal 100%"),
  summary: z.string().min(3, "Ringkasan progres wajib diisi"),
  photoUrl: z.string().optional().nullable(),
});

export const terminCreateSchema = z.object({
  terminName: z.string().min(2, "Nama termin wajib diisi"),
  invoiceNumber: z.string().optional().nullable(),
  percentage: z.coerce.number().min(0).max(100).optional().nullable(),
  amount: z.coerce.number().positive("Nominal tagihan harus lebih dari 0"),
  status: z.enum(["UNPAID", "WAITING_VERIFICATION", "PAID"]).default("UNPAID"),
});

// 6. Validasi Pengaturan Compro
export const settingsUpdateSchema = z.object({
  companyName: z.string().min(2, "Nama perusahaan minimal 2 karakter"),
  tagline: z.string().min(2),
  aboutDescription: z.string().min(5),
  logoUrl: z.string().optional().nullable(),
  letterheadLogoUrl: z.string().optional().nullable(),
  whatsappNumber: z.string().min(8, "Nomor WhatsApp tidak valid"),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  yearsOfExperience: z.coerce.number().int().min(0).default(15),
  completedProjects: z.coerce.number().int().min(0).default(50),
  heroBadge: z.string().optional(),
  heroTitle: z.string().optional(),
  heroImageUrl: z.string().optional().nullable(),
  workflowSectionTitle: z.string().optional(),
  workflowSectionSubtitle: z.string().optional(),
  workflowCardsJson: z.string().optional().nullable(),
  priceRenovasiPerM2: z.coerce.number().positive(),
  priceBangunStdPerM2: z.coerce.number().positive(),
  priceBangunLuxPerM2: z.coerce.number().positive(),
  priceKontrakanPerM2: z.coerce.number().positive(),
});

// 7. Validasi Keamanan Upload File
export const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".pdf",
  ".dwg",
  ".dxf",
  ".skp",
  ".xlsx",
  ".xls",
  ".zip",
];

export const MAX_UPLOAD_SIZE_BYTES = 250 * 1024 * 1024; // 250 MB untuk file .skp / render besar
