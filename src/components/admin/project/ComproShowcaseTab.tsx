"use client";

import React, { useState } from "react";
import {
  ImagePlus,
  MessageCircle,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { applyImageWatermark } from "@/lib/watermark";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ComproShowcaseTab({
  project,
  watermarkUrl,
  onUploadFile,
  uploading,
  onRefresh,
}: {
  project: any;
  watermarkUrl?: string;
  onUploadFile: (file: File, folder: string) => Promise<string>;
  uploading: boolean;
  onRefresh: () => void;
}) {
  const [title, setTitle] = useState(project.title || "");
  const [location, setLocation] = useState(project.location || "");
  const [type, setType] = useState(project.type || "RENOVASI");
  const [status, setStatus] = useState(project.status || "ON_PROGRESS");
  const [landArea, setLandArea] = useState(project.landArea || 0);
  const [buildingArea, setBuildingArea] = useState(project.buildingArea || 0);
  const [floors, setFloors] = useState(project.floors || 1);
  const [unitsCount, setUnitsCount] = useState(project.unitsCount || 1);
  const [description, setDescription] = useState(project.description || "");
  const [isPublished, setIsPublished] = useState(Boolean(project.isPublished));
  const [isFeatured, setIsFeatured] = useState(Boolean(project.isFeatured));
  const [thumbnailUrl, setThumbnailUrl] = useState(project.thumbnailUrl || "");
  const [beforeImageUrl, setBeforeImageUrl] = useState(
    project.beforeImageUrl || ""
  );
  const [afterImageUrl, setAfterImageUrl] = useState(
    project.afterImageUrl || ""
  );
  const [useWatermark, setUseWatermark] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "THUMB" | "BEFORE" | "AFTER"
  ) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    let fileToUpload = rawFile;
    if (useWatermark && watermarkUrl) {
      fileToUpload = await applyImageWatermark(rawFile, watermarkUrl);
    }

    const url = await onUploadFile(fileToUpload, "showcase");
    if (!url) return;
    if (target === "THUMB") setThumbnailUrl(url);
    if (target === "BEFORE") setBeforeImageUrl(url);
    if (target === "AFTER") setAfterImageUrl(url);
    toast.success("Foto berhasil diunggah! Klik Simpan di bawah untuk menerapkan.");
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_PROJECT_META",
        title,
        location,
        type,
        status,
        landArea,
        buildingArea,
        floors,
        unitsCount,
        description,
        isPublished,
        isFeatured,
        thumbnailUrl,
        beforeImageUrl,
        afterImageUrl,
      }),
    });
    if (!res.ok) {
      toast.error("Gagal menyimpan perubahan proyek");
      return;
    }
    toast.success("Pengaturan Proyek & Tampilan Compro berhasil disimpan!");
    onRefresh();
  };

  const portalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/portal/${project.shareToken}`
      : `/portal/${project.shareToken}`;

  const clientPhoneClean = (project.client?.phone || "").replace(/^0/, "62").replace(/\D/g, "");
  const waShareUrl = `https://wa.me/${clientPhoneClean}?text=${encodeURIComponent(
    `Halo ${project.client?.name || "Bapak/Ibu"}, berikut adalah Link Portal Pemantauan Progres, Galeri Render 3D & RAB untuk proyek *${project.title}*:\n\n${portalUrl}\n\nSilakan dibuka langsung dari HP tanpa perlu login. Terima kasih!`
  )}`;

  return (
    <form onSubmit={handleSaveMeta} className="space-y-6">
      {/* Bagikan Link Portal ke WhatsApp Klien */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase text-amber-400">
            Link Khusus Klien (Tanpa Login)
          </span>
          <h3 className="font-bold text-base mt-0.5">
            Bagikan Progres & Render 3D ke WhatsApp Klien
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Kode Akses: <code className="text-amber-300">/portal/{project.shareToken}</code>
          </p>
        </div>

        <a
          href={waShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Kirim Link Portal ke WA Klien</span>
        </a>
      </div>

      {/* Pengaturan Foto Sampul & Slider Before-After Compro */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Visual Portofolio & Slider Before-After di Halaman Depan Compro
            </h3>
            <p className="text-xs text-slate-500">
              Atur foto sampul kartu proyek dan foto perbandingan Sebelum vs Sesudah Renovasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
              <input
                type="checkbox"
                checked={useWatermark}
                onChange={(e) => setUseWatermark(e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-xs font-bold text-slate-700">
                Watermark Otomatis (Kanan Atas)
              </span>
            </label>

            <label className="inline-flex items-center gap-2.5 cursor-pointer bg-amber-50 border border-amber-300 px-4 py-2 rounded-xl">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-xs font-extrabold text-amber-950">
                Tayangkan Proyek Ini di Compro Depan
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Foto Thumbnail */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              1. Foto Sampul Utama (Thumbnail)
            </span>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="Thumbnail"
                className="w-full h-36 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full h-36 rounded-lg bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                Belum ada foto
              </div>
            )}
            <label className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5">
              <ImagePlus className="w-3.5 h-3.5 text-amber-400" />
              <span>{uploading ? "Uploading..." : "Ganti Foto Sampul"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadImage(e, "THUMB")}
                className="hidden"
              />
            </label>
          </div>

          {/* Foto Before Renovasi */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              2. Foto Kondisi Awal (Before Slider)
            </span>
            {beforeImageUrl ? (
              <img
                src={beforeImageUrl}
                alt="Before"
                className="w-full h-36 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full h-36 rounded-lg bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                Opsional (Khusus Renovasi)
              </div>
            )}
            <label className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5">
              <ImagePlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Foto Before</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadImage(e, "BEFORE")}
                className="hidden"
              />
            </label>
          </div>

          {/* Foto After Renovasi */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              3. Foto Render / Hasil Jadi (After Slider)
            </span>
            {afterImageUrl ? (
              <img
                src={afterImageUrl}
                alt="After"
                className="w-full h-36 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full h-36 rounded-lg bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                Opsional (Khusus Renovasi)
              </div>
            )}
            <label className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5">
              <ImagePlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Foto After</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadImage(e, "AFTER")}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Detail Informasi Teknis Proyek */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900">
          Detail Spesifikasi Proyek
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Proyek
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lokasi Proyek
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tipe Proyek
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              <option value="RENOVASI">RENOVASI</option>
              <option value="BANGUN_BARU">BANGUN BARU</option>
              <option value="KONTRAKAN">KONTRAKAN</option>
              <option value="INTERIOR">INTERIOR</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              <option value="PLANNING">PLANNING</option>
              <option value="ON_PROGRESS">ON PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ON_HOLD">ON HOLD</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Luas Tanah (m²)
            </label>
            <input
              type="number"
              value={landArea}
              onChange={(e) => setLandArea(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Luas Bangunan (m²)
            </label>
            <input
              type="number"
              value={buildingArea}
              onChange={(e) => setBuildingArea(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jumlah Lantai
            </label>
            <input
              type="number"
              value={floors}
              onChange={(e) => setFloors(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jml Pintu / Unit
            </label>
            <input
              type="number"
              value={unitsCount}
              onChange={(e) => setUnitsCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Deskripsi Proyek (Ditampilkan di Kartu Portofolio Compro)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
          />
        </div>

        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Pengaturan Proyek & Compro</span>
        </button>
      </div>
    </form>
  );
}
