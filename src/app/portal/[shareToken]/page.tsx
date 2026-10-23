import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  HardHat,
  Layers,
  MapPin,
  Download,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import PanoramaViewerModal from "@/components/PanoramaViewerModal";

export const dynamic = "force-dynamic";

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const project = await prisma.project.findUnique({
    where: { shareToken },
    include: {
      client: true,
      media: { orderBy: { sortOrder: "asc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
      rabCategories: {
        include: { items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      progressLogs: { orderBy: { weekNumber: "desc" } },
      paymentTermins: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) return notFound();

  const latestProgress = project.progressLogs[0]?.percentage ?? 0;

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Header Bar */}
      <header className="bg-slate-950 text-white py-6 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Depan Compro</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-amber-500 text-slate-950">
                Client Portal & Showcase 3D
              </span>
              <span className="text-xs text-slate-400">
                Kode Akses: <strong>{project.shareToken}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              {project.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>{project.location}</span>
              {project.client && (
                <span>• Pemilik: {project.client.name}</span>
              )}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 min-w-[220px]">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Progres Lapangan Terkini</span>
              <span className="font-bold text-amber-400">{latestProgress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, latestProgress)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Nilai Kontrak:{" "}
              <strong className="text-white">
                {formatRupiah(Number(project.contractValue))}
              </strong>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-10">
        {/* 1. Galeri Visual 3D (SketchUp + V-Ray / Enscape & Panorama 360) */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Galeri Visualisasi 3D (V-Ray / Enscape) & Foto Proyek</span>
              </h2>
              <p className="text-xs text-slate-500">
                Hasil render desain 3D dan dokumentasi visual ruangan
              </p>
            </div>
          </div>

          {project.media.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Belum ada file render yang diunggah untuk proyek ini.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.media.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col"
                >
                  <div className="relative h-64 bg-slate-900">
                    <img
                      src={item.fileUrl}
                      alt={item.title || "Render 3D"}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 bg-slate-950/80 text-amber-400 text-[11px] font-bold px-2.5 py-1 rounded-md">
                      {item.mediaType.replace("_", " ")}
                    </span>
                  </div>
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {item.title || item.roomName}
                      </h3>
                      <span className="text-xs text-slate-500">
                        Area: {item.roomName || " Bangunan Utama"}
                      </span>
                    </div>
                    {item.mediaType === "PANORAMA_360" && (
                      <PanoramaViewerModal
                        imageUrl={item.fileUrl}
                        title={item.title || "Panorama 360"}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. Dokumen Gambar Kerja 2D (Revit) & File 3D (SketchUp) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Gambar Kerja 2D (Revit DED) & File 3D</span>
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Dokumen teknis terbaru dengan riwayat revisi agar pelaksanaan akurat
            </p>

            <div className="space-y-3">
              {project.documents.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada dokumen teknis.</p>
              ) : (
                project.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {doc.version}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {doc.docType}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">
                        {doc.title}
                      </h4>
                      {doc.notes && (
                        <p className="text-xs text-slate-500 mt-0.5">{doc.notes}</p>
                      )}
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh</span>
                    </a>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 3. Laporan Progres Mingguan & Termin Pembayaran */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Log Progres Mingguan Lapangan</span>
              </h2>
              <div className="space-y-3 mt-4">
                {project.progressLogs.length === 0 ? (
                  <p className="text-xs text-slate-400">Belum ada laporan mingguan.</p>
                ) : (
                  project.progressLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-900">
                          Minggu ke-{log.weekNumber}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          Progres {log.percentage}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {log.summary}
                      </p>
                      {log.photoUrls?.[0] && (
                        <a
                          href={log.photoUrls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2.5 block rounded-lg overflow-hidden border border-slate-200 bg-white"
                        >
                          <img
                            src={log.photoUrls[0]}
                            alt={`Progres Minggu ${log.weekNumber}`}
                            className="w-full h-36 object-cover hover:opacity-95 transition"
                          />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Status Termin Pembayaran
              </h3>
              <div className="space-y-2.5">
                {project.paymentTermins.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {t.terminName}
                      </span>
                      <span className="text-slate-500 block">
                        No. Invoice: {t.invoiceNumber || "-"}
                      </span>
                      {t.paymentProof && (
                        <a
                          href={t.paymentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-1 text-[11px] font-bold text-emerald-700 underline hover:text-emerald-600"
                        >
                          Lihat Bukti Pembayaran / Kwitansi
                        </a>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 block">
                        {formatRupiah(Number(t.amount))}
                      </span>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded font-bold text-[10px] ${
                          t.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t.status === "PAID" ? "LUNAS" : "BELUM DIBAYAR"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* 4. Ringkasan RAB Proyek */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Rincian Anggaran Biaya (RAB) Proyek
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Daftar pekerjaan yang disepakati dalam ruang lingkup proyek
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-3 px-4 rounded-tl-xl">Uraian Pekerjaan</th>
                  <th className="py-3 px-4 text-right">Volume</th>
                  <th className="py-3 px-4 text-center">Satuan</th>
                  <th className="py-3 px-4 text-right">Harga Satuan</th>
                  <th className="py-3 px-4 text-right rounded-tr-xl">Jumlah Harga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {project.rabCategories.map((cat) => (
                  <React.Fragment key={cat.id}>
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={5} className="py-2.5 px-4">
                        {cat.name}
                      </td>
                    </tr>
                    {cat.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-slate-800">
                          {item.description}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium">
                          {Number(item.volume)}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-500">
                          {item.unit}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600">
                          {formatRupiah(Number(item.unitPrice))}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                          {formatRupiah(Number(item.totalPrice))}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
