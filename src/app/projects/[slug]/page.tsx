import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  HardHat,
  MapPin,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatProjectStatus } from "@/lib/format";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import PanoramaViewerModal from "@/components/PanoramaViewerModal";

export const dynamic = "force-dynamic";

export default async function PublicProjectShowcasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      media: {
        where: { isPublic: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!project || !project.isPublished) return notFound();

  const profile = await prisma.companyProfile.findFirst();
  const waNumber = (profile?.whatsappNumber ?? "6281234567890").replace(
    /\D/g,
    ""
  );

  const waConsultText = encodeURIComponent(
    `Halo, saya melihat portofolio proyek *${project.title}* (${project.buildingArea} m²) di website ${
      profile?.companyName || "Anda"
    }.\n\nSaya tertarik untuk konsultasi rencana bangun/renovasi serupa. Bisa dibantu infonya?`
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Showcase Publik */}
      <header className="bg-slate-950 text-white py-10 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Link
            href="/#portfolio"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Katalog Portofolio</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-amber-500 text-slate-950">
                  {project.type.replace("_", " ")}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                  Status: {formatProjectStatus(project.status)}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {project.title}
              </h1>

              <p className="text-sm text-slate-400 flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Area: {project.location || "Jabodetabek"}</span>
              </p>
            </div>

            <a
              href={`https://wa.me/${waNumber}?text=${waConsultText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-lg shrink-0 transition"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Ingin Bangun / Renovasi Serupa? Tanya via WA</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 space-y-10">
        {/* Ringkasan Spesifikasi Arsitektur (Tanpa Data Privasi Klien / RAB) */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
            <div className="bg-slate-50 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">Luas Tanah</span>
              <strong className="text-lg font-extrabold text-slate-900">
                {project.landArea || "-"} m²
              </strong>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">Luas Bangunan</span>
              <strong className="text-lg font-extrabold text-slate-900">
                {project.buildingArea || "-"} m²
              </strong>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">
                {project.type === "KONTRAKAN" ? "Jumlah Pintu" : "Jumlah Lantai"}
              </span>
              <strong className="text-lg font-extrabold text-slate-900">
                {project.type === "KONTRAKAN"
                  ? `${project.unitsCount} Pintu`
                  : `${project.floors} Lantai`}
              </strong>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">Status Proyek</span>
              <strong className="text-lg font-extrabold text-amber-600">
                {formatProjectStatus(project.status)}
              </strong>
            </div>
          </div>

          <div className="pt-6">
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>Konsep Desain & Ruang Lingkup Pekerjaan</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {project.description ||
                "Proyek dikerjakan dengan standar perencanaan 3D SketchUp + Enscape/V-Ray serta gambar kerja teknis 2D Revit."}
            </p>
          </div>
        </section>

        {/* Perbandingan Before-After jika proyek ini memiliki foto Before & After */}
        {project.beforeImageUrl && project.afterImageUrl && (
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Transformasi Sebelum & Sesudah (Before vs After)
              </h2>
              <p className="text-xs text-slate-500">
                Geser garis tengah untuk melihat perbandingan kondisi awal dengan hasil desain/pembangunan.
              </p>
            </div>
            <BeforeAfterSlider
              beforeUrl={project.beforeImageUrl}
              afterUrl={project.afterImageUrl}
            />
          </section>
        )}

        {/* Galeri Visual 3D (SketchUp + V-Ray / Enscape & Panorama 360) */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Galeri Render 3D (V-Ray / Enscape), Panorama 360° & Dokumentasi</span>
            </h2>
            <p className="text-xs text-slate-500">
              Visualisasi desain arsitektur, interior ruangan, dan hasil pelaksanaan di lapangan
            </p>
          </div>

          {project.media.length === 0 ? (
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <img
                src={
                  project.thumbnailUrl ||
                  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
                }
                alt={project.title}
                className="w-full h-96 object-cover"
              />
            </div>
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
                        Area: {item.roomName || "Bangunan Utama"}
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
      </main>
    </div>
  );
}
