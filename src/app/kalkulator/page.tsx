import React from "react";
import Link from "next/link";
import { ArrowLeft, Calculator, HardHat, PhoneCall, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import BuildingMaterialCalculator from "@/components/BuildingMaterialCalculator";

export const dynamic = "force-dynamic";

export default async function PublicCalculatorPage() {
  const profile = await prisma.companyProfile.findFirst();
  const companyName = profile?.companyName ?? "A8 Renov";
  const tagline =
    profile?.tagline ??
    "Spesialis Bangun Rumah, Renovasi & Kontrakan Berkualitas";
  const waNumber = profile?.whatsappNumber ?? "6281234567890";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5">
            {profile?.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={companyName}
                className="h-12 w-auto max-w-[160px] object-contain shrink-0"
              />
            ) : (
              <div className="h-11 w-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-xl shadow shrink-0">
                <HardHat className="w-6 h-6" />
              </div>
            )}
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight block leading-tight">
                {companyName}
              </span>
              <span className="text-[11px] text-amber-400 font-medium block mt-0.5">
                {tagline}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-slate-800 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>

            <a
              href={`https://wa.me/${waNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl hidden sm:flex items-center gap-2 transition shadow"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Konsultasi Gratis</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Title */}
      <section className="bg-slate-950 text-white py-12 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kalkulator Konstruksi & Material SNI</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Hitung Estimasi Material Bangunan Anda Secara Mandiri & Akurat
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Pilih kategori pekerjaan di bawah ini untuk menghitung kebutuhan
              bata ringan (hebel), sak semen, dus keramik, cat tembok, kubikasi
              cor beton, rangka atap baja ringan, hingga besi beton sebelum
              memulai pembangunan atau renovasi.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BuildingMaterialCalculator
            mode="PUBLIC"
            waNumber={waNumber}
            companyName={companyName}
          />
        </div>
      </main>

      {/* Footer Ringkas */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-white">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>
              Kalkulator Material Bangunan • {companyName}
            </span>
          </div>
          <div>
            © {new Date().getFullYear()} {companyName}. Seluruh Hak Cipta
            Dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
}
