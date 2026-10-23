import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Compass,
  FileSpreadsheet,
  HardHat,
  Layers,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import BeforeAfterShowcase from "@/components/BeforeAfterShowcase";
import CostCalculator from "@/components/CostCalculator";
import { DEFAULT_WORKFLOW_CARDS, formatProjectStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await prisma.companyProfile.findFirst();
  const publishedProjects = await prisma.project.findMany({
    where: { isPublished: true },
    include: { media: true },
    orderBy: { createdAt: "desc" },
  });

  const companyName = profile?.companyName ?? "Karya Bangun Mandiri";
  const tagline =
    profile?.tagline ??
    "Spesialis Bangun Rumah, Renovasi & Kontrakan Berkualitas";
  const waNumber = profile?.whatsappNumber ?? "6281234567890";

  const heroBadge =
    profile?.heroBadge ?? "Spesialis Renovasi Rumah, Bangun Baru & Kontrakan";
  const heroTitle =
    profile?.heroTitle ??
    "Wujudkan Bangunan Impian Tanpa Drama & Biaya Membengkak.";
  const heroImageUrl =
    profile?.heroImageUrl ||
    publishedProjects[0]?.thumbnailUrl ||
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80";

  const workflowSectionTitle =
    profile?.workflowSectionTitle ??
    "Bukan Sekadar Tukang, Kami Bekerja dengan Sistem Teknik Lengkap";
  const workflowSectionSubtitle =
    profile?.workflowSectionSubtitle ??
    "Setiap proyek rumah maupun kontrakan direncanakan secara presisi sebelum satu bata pun dipasang di lapangan.";

  let workflowCards = DEFAULT_WORKFLOW_CARDS;
  if (profile?.workflowCardsJson) {
    try {
      const parsed = JSON.parse(profile.workflowCardsJson);
      if (Array.isArray(parsed) && parsed.length === 4) {
        workflowCards = parsed;
      }
    } catch {
      // Gunakan default
    }
  }

  // Ambil SEMUA proyek publik yang punya foto Before & After untuk ditampilkan di slider
  const showcaseRenovList = publishedProjects
    .filter((p) => p.beforeImageUrl && p.afterImageUrl)
    .map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      location: p.location,
      beforeImageUrl: p.beforeImageUrl as string,
      afterImageUrl: p.afterImageUrl as string,
    }));

  const cardIcons = [
    <Compass key="0" className="w-6 h-6" />,
    <Layers key="1" className="w-6 h-6" />,
    <FileSpreadsheet key="2" className="w-6 h-6" />,
    <ShieldCheck key="3" className="w-6 h-6" />,
  ];

  const cardColors = [
    "bg-amber-100 text-amber-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-purple-100 text-purple-700",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {profile?.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={companyName}
                className="h-14 w-auto max-w-[180px] object-contain shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-xl shadow shrink-0">
                <HardHat className="w-6 h-6" />
              </div>
            )}
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight block leading-tight">
                {companyName}
              </span>
              <span className="text-xs text-amber-400 font-medium block mt-0.5">
                {tagline}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#keunggulan" className="hover:text-amber-400 transition">
              Workflow Kerja
            </a>
            <a href="#before-after" className="hover:text-amber-400 transition">
              Transformasi Renovasi
            </a>
            <a href="#portfolio" className="hover:text-amber-400 transition">
              Portofolio Proyek
            </a>
            <a href="#kalkulator" className="hover:text-amber-400 transition">
              Simulasi Biaya
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${waNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Konsultasi WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-slate-950 text-white py-20 lg:py-28 overflow-hidden border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>{heroBadge}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
                {heroTitle}
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
                {profile?.aboutDescription ?? tagline}
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="#kalkulator"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-4 rounded-xl flex items-center gap-2 transition shadow-lg"
                >
                  <span>Hitung Estimasi Biaya</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#portfolio"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-4 rounded-xl border border-slate-700 transition"
                >
                  Lihat Hasil Render & Proyek
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/80">
                <div>
                  <div className="text-3xl font-extrabold text-amber-400">
                    {profile?.yearsOfExperience ?? 15}+ Thn
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Pengalaman Konstruksi
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-amber-400">
                    {profile?.completedProjects ?? 60}+ Unit
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Rumah & Kontrakan Terbangun
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-amber-400">
                    100%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Transparansi RAB & Gambar 3D
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual Showcase */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-900">
                <img
                  src={heroImageUrl}
                  alt="Showcase Proyek"
                  className="w-full h-[420px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        Workflow Standar Kami
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        SketchUp 3D • V-Ray/Enscape • Revit 2D • Excel RAB
                      </h3>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan Workflow Teknis (Dinamis dari Pengaturan Admin) */}
      <section id="keunggulan" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
            Standar Kerja Profesional
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            {workflowSectionTitle}
          </h2>
          <p className="text-slate-600 mt-3 text-sm sm:text-base">
            {workflowSectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {workflowCards.map((card, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  cardColors[index % cardColors.length]
                }`}
              >
                {cardIcons[index % cardIcons.length]}
              </div>
              <h3 className="font-bold text-lg text-slate-900">{card.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Multi-Project Before-After Slider Section */}
      <BeforeAfterShowcase items={showcaseRenovList} />

      {/* Portfolio Showcase */}
      <section id="portfolio" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
              Portofolio & Hasil Karya
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Proyek Renovasi, Rumah Baru & Kontrakan
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-2 md:mt-0">
            Klik pada proyek untuk membuka halaman <strong>Client Showcase & Galeri 3D</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publishedProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition flex flex-col"
            >
              <div className="relative h-60 bg-slate-200">
                <img
                  src={
                    project.thumbnailUrl ??
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-slate-950/85 text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
                    {project.type.replace("_", " ")}
                  </span>
                  <span className="bg-white/95 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">
                    {formatProjectStatus(project.status)}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>{project.location || "Jabodetabek"}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mb-4">
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <span className="block text-[10px] text-slate-400">Luas Bangunan</span>
                      <strong className="text-slate-900">{project.buildingArea ?? 0} m²</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <span className="block text-[10px] text-slate-400">Lantai / Pintu</span>
                      <strong className="text-slate-900">
                        {project.type === "KONTRAKAN"
                          ? `${project.unitsCount} Pintu`
                          : `${project.floors} Lantai`}
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <span className="block text-[10px] text-slate-400">Visual 3D</span>
                      <strong className="text-amber-600">{project.media.length} File</strong>
                    </div>
                  </div>

                  <Link
                    href={`/projects/${project.slug}`}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <span>Buka Galeri Render & Detail Proyek</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Kalkulator Estimasi Biaya */}
      <section id="kalkulator" className="py-20 bg-slate-100 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <CostCalculator
            whatsappNumber={waNumber}
            prices={{
              renovasi: Number(profile?.priceRenovasiPerM2 ?? 3500000),
              bangunStd: Number(profile?.priceBangunStdPerM2 ?? 4500000),
              bangunLux: Number(profile?.priceBangunLuxPerM2 ?? 6500000),
              kontrakan: Number(profile?.priceKontrakanPerM2 ?? 3200000),
            }}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div>
            <span className="font-bold text-white">{companyName}</span> —{" "}
            <span>{profile?.address ?? "Indonesia"}</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <Link href="/admin" className="text-slate-500 hover:text-amber-400 transition">
              Portal Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
