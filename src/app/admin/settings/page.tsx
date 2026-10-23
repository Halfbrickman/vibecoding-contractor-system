"use client";

import React, { useEffect, useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { toast } from "sonner";
import CurrencyInput from "@/components/ui/CurrencyInput";

interface WorkflowCard {
  title: string;
  description: string;
}

const DEFAULT_CARDS: WorkflowCard[] = [
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

export default function AdminSettingsPage() {
  const [companyName, setCompanyName] = useState("");
  const [tagline, setTagline] = useState("");
  const [aboutDescription, setAboutDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [letterheadLogoUrl, setLetterheadLogoUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [address, setAddress] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState(15);
  const [completedProjects, setCompletedProjects] = useState(50);

  // Kustomisasi Hero & Workflow Compro
  const [heroBadge, setHeroBadge] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [workflowSectionTitle, setWorkflowSectionTitle] = useState("");
  const [workflowSectionSubtitle, setWorkflowSectionSubtitle] = useState("");
  const [workflowCards, setWorkflowCards] =
    useState<WorkflowCard[]>(DEFAULT_CARDS);

  // Harga per m2 untuk Kalkulator Compro
  const [priceRenovasiPerM2, setPriceRenovasiPerM2] = useState(3500000);
  const [priceBangunStdPerM2, setPriceBangunStdPerM2] = useState(4500000);
  const [priceBangunLuxPerM2, setPriceBangunLuxPerM2] = useState(6500000);
  const [priceKontrakanPerM2, setPriceKontrakanPerM2] = useState(3200000);

  const [savedToast, setSavedToast] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setCompanyName(data.companyName || "");
        setTagline(data.tagline || "");
        setAboutDescription(data.aboutDescription || "");
        setLogoUrl(data.logoUrl || "");
        setLetterheadLogoUrl(data.letterheadLogoUrl || "");
        setWhatsappNumber(data.whatsappNumber || "");
        setAddress(data.address || "");
        setYearsOfExperience(Number(data.yearsOfExperience) || 15);
        setCompletedProjects(Number(data.completedProjects) || 50);

        setHeroBadge(
          data.heroBadge || "Spesialis Renovasi Rumah, Bangun Baru & Kontrakan"
        );
        setHeroTitle(
          data.heroTitle ||
            "Wujudkan Bangunan Impian Tanpa Drama & Biaya Membengkak."
        );
        setHeroImageUrl(data.heroImageUrl || "");
        setWorkflowSectionTitle(
          data.workflowSectionTitle ||
            "Bukan Sekadar Tukang, Kami Bekerja dengan Sistem Teknik Lengkap"
        );
        setWorkflowSectionSubtitle(
          data.workflowSectionSubtitle ||
            "Setiap proyek rumah maupun kontrakan direncanakan secara presisi sebelum satu bata pun dipasang di lapangan."
        );

        if (data.workflowCardsJson) {
          try {
            const parsed = JSON.parse(data.workflowCardsJson);
            if (Array.isArray(parsed) && parsed.length === 4) {
              setWorkflowCards(parsed);
            }
          } catch {
            // Gunakan default
          }
        }

        setPriceRenovasiPerM2(Number(data.priceRenovasiPerM2) || 3500000);
        setPriceBangunStdPerM2(Number(data.priceBangunStdPerM2) || 4500000);
        setPriceBangunLuxPerM2(Number(data.priceBangunLuxPerM2) || 6500000);
        setPriceKontrakanPerM2(Number(data.priceKontrakanPerM2) || 3200000);
      });
  }, []);

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "MAIN" | "LETTERHEAD" | "HERO"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "branding");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploadingLogo(false);
    if (!res.ok) {
      toast.error(data.error || "Gagal mengunggah gambar");
      return;
    }
    if (target === "MAIN") setLogoUrl(data.fileUrl);
    else if (target === "LETTERHEAD") setLetterheadLogoUrl(data.fileUrl);
    else if (target === "HERO") setHeroImageUrl(data.fileUrl);
    toast.success("Gambar berhasil diunggah! Jangan lupa klik Simpan di bawah.");
  };

  const handleCardChange = (
    idx: number,
    field: "title" | "description",
    val: string
  ) => {
    setWorkflowCards((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: val } : c))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName,
        tagline,
        aboutDescription,
        logoUrl,
        letterheadLogoUrl,
        whatsappNumber,
        address,
        yearsOfExperience,
        completedProjects,
        heroBadge,
        heroTitle,
        heroImageUrl,
        workflowSectionTitle,
        workflowSectionSubtitle,
        workflowCardsJson: JSON.stringify(workflowCards),
        priceRenovasiPerM2,
        priceBangunStdPerM2,
        priceBangunLuxPerM2,
        priceKontrakanPerM2,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Gagal menyimpan pengaturan");
      return;
    }
    toast.success("Seluruh pengaturan Company Profile & Logo berhasil disimpan!");
    window.dispatchEvent(new Event("company-profile-updated"));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Kustomisasi Penuh Company Profile, Logo & Tarif Kalkulator
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Semua teks, gambar banner Hero, 4 kartu keunggulan workflow, logo, hingga tarif per m² dapat dikelola dari halaman ini.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Bagian 1: Upload Logo Compro, Kop Surat & Banner Hero */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-slate-900">
            1. Logo Website, Logo Kop Surat PDF & Gambar Banner Hero
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo Utama"
                  className="w-16 h-16 rounded-xl object-contain bg-white border p-1"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                  No Logo
                </div>
              )}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Logo Navbar Compro
                </span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg">
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>{uploadingLogo ? "Uploading..." : "Upload Logo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImage(e, "MAIN")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4">
              {letterheadLogoUrl ? (
                <img
                  src={letterheadLogoUrl}
                  alt="Logo Kop Surat"
                  className="w-16 h-16 rounded-xl object-contain bg-white border p-1"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-xs text-slate-500 text-center">
                  Ikut Logo Utama
                </div>
              )}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Logo Kop Surat RAB PDF
                </span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>Upload Kop Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImage(e, "LETTERHEAD")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4">
              {heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt="Hero Banner"
                  className="w-16 h-16 rounded-xl object-cover bg-white border"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-xs text-slate-500 text-center">
                  Otomatis Proyek
                </div>
              )}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Foto Utama Hero Compro
                </span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                  <ImagePlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload Foto Hero</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImage(e, "HERO")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bagian 2: Informasi Perusahaan & Teks Hero */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-slate-900">
            2. Identitas Perusahaan & Teks Hero Halaman Depan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Brand / Perusahaan Kontraktor
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp Konsultasi (Format 628...)
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Badge Atas Hero
              </label>
              <input
                type="text"
                value={heroBadge}
                onChange={(e) => setHeroBadge(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tagline Perusahaan (Muncul di Kop Surat)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Besar Utama (Headline Hero)
            </label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Paragraf Penjelasan di Bawah Headline Hero
            </label>
            <textarea
              rows={3}
              value={aboutDescription}
              onChange={(e) => setAboutDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Workshop / Kantor
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pengalaman (Tahun)
              </label>
              <input
                type="number"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Proyek Selesai
              </label>
              <input
                type="number"
                value={completedProjects}
                onChange={(e) => setCompletedProjects(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Bagian 3: Kustomisasi 4 Kartu Workflow / Keunggulan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-slate-900">
            3. Kustomisasi Seksi Keunggulan & 4 Kartu Workflow Kerja
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul Seksi Workflow
              </label>
              <input
                type="text"
                value={workflowSectionTitle}
                onChange={(e) => setWorkflowSectionTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subjudul Seksi Workflow
              </label>
              <input
                type="text"
                value={workflowSectionSubtitle}
                onChange={(e) => setWorkflowSectionSubtitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {workflowCards.map((card, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
              >
                <label className="block text-xs font-extrabold text-slate-700">
                  Kartu Keunggulan #{idx + 1}
                </label>
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) =>
                    handleCardChange(idx, "title", e.target.value)
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                />
                <textarea
                  rows={2}
                  value={card.description}
                  onChange={(e) =>
                    handleCardChange(idx, "description", e.target.value)
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bagian 4: Parameter Kalkulator Estimasi Biaya per m2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-slate-900">
            4. Harga Acuan per m² (Untuk Kalkulator Simulasi di Halaman Depan)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Renovasi Rumah (/m²)
              </label>
              <CurrencyInput
                value={priceRenovasiPerM2}
                onChange={setPriceRenovasiPerM2}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bangun Baru Standar (/m²)
              </label>
              <CurrencyInput
                value={priceBangunStdPerM2}
                onChange={setPriceBangunStdPerM2}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bangun Baru Premium (/m²)
              </label>
              <CurrencyInput
                value={priceBangunLuxPerM2}
                onChange={setPriceBangunLuxPerM2}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bangun Kontrakan (/m²)
              </label>
              <CurrencyInput
                value={priceKontrakanPerM2}
                onChange={setPriceKontrakanPerM2}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-lg transition text-sm"
        >
          <Save className="w-5 h-5" />
          <span>Simpan Seluruh Pengaturan Compro</span>
        </button>
      </form>
    </div>
  );
}
