"use client";

import React, { useState } from "react";
import {
  Camera,
  CheckCircle2,
  Compass,
  HelpCircle,
  ImagePlus,
  Layers,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import PanoramaViewerModal from "@/components/PanoramaViewerModal";
import { applyImageWatermark } from "@/lib/watermark";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Media3DTab({
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
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaType, setMediaType] = useState("RENDER_3D");
  const [roomName, setRoomName] = useState("Fasad / Ruang Utama");
  const [useWatermark, setUseWatermark] = useState(true);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    let fileToUpload = rawFile;
    if (useWatermark && mediaType !== "PANORAMA_360" && watermarkUrl) {
      fileToUpload = await applyImageWatermark(rawFile, watermarkUrl);
    }

    const fileUrl = await onUploadFile(fileToUpload, "renders");
    await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_MEDIA",
        title: mediaTitle || rawFile.name,
        mediaType,
        roomName,
        fileUrl,
      }),
    });
    setMediaTitle("");
    toast.success("File visual 3D / foto berhasil diunggah!");
    onRefresh();
  };

  const handleDeleteMedia = async (id: string) => {
    await fetch(`/api/projects/${project.id}/extras?target=media&id=${id}`, {
      method: "DELETE",
    });
    toast.success("File visual dihapus.");
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Upload Hasil Render V-Ray / Enscape / Panorama 360° ke Server
            </h3>
            <p className="text-xs text-slate-500">
              File gambar resolusi tinggi akan disimpan di Storage Server dan langsung tampil di Galeri Klien.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTutorialModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Tutorial Memasang Gambar 360°</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Visual / Sudut Pandang
            </label>
            <input
              type="text"
              placeholder="Misal: Render Fasad Malam"
              value={mediaTitle}
              onChange={(e) => setMediaTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Ruangan / Area
            </label>
            <input
              type="text"
              placeholder="Misal: Ruang Keluarga Lt. 1"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tipe Visual
            </label>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              <option value="RENDER_3D">Render 3D (V-Ray / Enscape)</option>
              <option value="PANORAMA_360">Panorama 360° Interaktif (Enscape)</option>
              <option value="REAL_PHOTO">Foto Hasil Jadi Lapangan</option>
              <option value="BEFORE_PHOTO">Foto Sebelum Renovasi (Before)</option>
            </select>
          </div>
          <div>
            <label className="w-full cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow">
              <ImagePlus className="w-4 h-4" />
              <span>{uploading ? "Mengunggah..." : "Pilih & Upload Gambar"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAddMedia}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Opsi Toggle Watermark Otomatis */}
        {mediaType !== "PANORAMA_360" && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
              <input
                type="checkbox"
                checked={useWatermark}
                onChange={(e) => setUseWatermark(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span>
                Pasang Watermark Otomatis di Pojok Kanan Atas (Transparan)
              </span>
            </label>
            {!watermarkUrl && (
              <span className="text-[11px] text-amber-700">
                *Belum ada gambar Watermark/Logo di Pengaturan Compro
              </span>
            )}
          </div>
        )}

        {mediaType === "PANORAMA_360" && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Mode <strong>Panorama 360° Interaktif</strong> aktif. Pastikan file yang diupload adalah gambar <em>Equirectangular</em> (rasio 2:1) hasil export Panorama dari Enscape atau V-Ray.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTutorialModal(true)}
              className="underline font-bold shrink-0 hover:text-amber-700"
            >
              Lihat Cara Export
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {project.media.map((item: any) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div className="relative">
              <img
                src={item.fileUrl}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
              {item.mediaType === "PANORAMA_360" && (
                <div className="absolute bottom-2.5 right-2.5">
                  <PanoramaViewerModal
                    imageUrl={item.fileUrl}
                    title={item.title || "Panorama 360°"}
                    roomName={item.roomName}
                  />
                </div>
              )}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  {item.mediaType}
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500">{item.roomName}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteMedia(item.id)}
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"
                title="Hapus Visual"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tutorial Memasang Gambar 360° */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm sm:text-base">
                  Panduan Cara Export & Memasang Gambar Panorama 360°
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTutorialModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                <strong className="block font-extrabold mb-1">
                  Apa itu Gambar Panorama 360° (Equirectangular)?
                </strong>
                Gambar Panorama 360° tetap berupa file gambar biasa (<strong>.jpg</strong> atau <strong>.png</strong>) dengan perbandingan ukuran <strong>Lebar : Tinggi = 2 : 1</strong> (contoh: <code>4096 x 2048 px</code>). Saat diupload ke sistem ini, sistem otomatis membungkus gambar tersebut menjadi bola 3D interaktif sehingga klien bisa menengok ke segala arah (360 derajat).
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>Opsi A: Cara Export dari Enscape (SketchUp / Revit)</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <li>
                    Buka model 3D di SketchUp/Revit dan nyalakan jendela <strong>Enscape</strong>.
                  </li>
                  <li>
                    Posisikan kamera berdiri <strong>tepat di tengah ruangan</strong> setinggi pandangan mata manusia (±160 cm dari lantai).
                  </li>
                  <li>
                    Pada toolbar Enscape, klik tombol <strong>Render Panorama (Mono Panorama)</strong>, lalu tunggu proses render selesai.
                  </li>
                  <li>
                    Buka menu <strong>Upload Management</strong> di Enscape, arahkan ke hasil panorama tadi, lalu klik ikon <strong>Save Panorama to File (.jpg / .png)</strong> ke komputer Anda.
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Opsi B: Cara Export dari V-Ray (SketchUp)</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <li>
                    Posisikan kamera di tengah ruangan, lalu buka <strong>V-Ray Asset Editor</strong>.
                  </li>
                  <li>
                    Masuk ke bagian <strong>Camera</strong> → ubah <em>Type</em> menjadi <strong>Spherical Panorama</strong> (atau <em>VR Cubemap / Equirectangular</em>) dan aktifkan <em>Override FOV = 360°</em>.
                  </li>
                  <li>
                    Masuk ke bagian <strong>Render Output</strong> → ubah <em>Aspect Ratio</em> menjadi <strong>2:1</strong> (misal resolusi <code>4000 x 2000</code>).
                  </li>
                  <li>
                    Klik <strong>Render</strong>, lalu simpan hasilnya sebagai file <strong>.jpg</strong> atau <strong>.png</strong>.
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Langkah Terakhir: Cara Upload ke Sistem Website</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-950">
                  <li>
                    Ketik <strong>Judul Visual</strong> dan <strong>Nama Ruangan</strong> (misal: <em>Ruang Tamu & Keluarga</em>).
                  </li>
                  <li>
                    Pada kolom <strong>Tipe Visual</strong>, wajib pilih <strong>Panorama 360° Interaktif (Enscape)</strong>.
                  </li>
                  <li>
                    Klik tombol <strong>Pilih & Upload Gambar</strong> dan pilih file <code>.jpg/.png</code> hasil export tadi.
                  </li>
                  <li>
                    Selesai! Tombol <strong>Buka View 360°</strong> akan langsung muncul di Galeri Proyek dan Portal Klien.
                  </li>
                </ol>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTutorialModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                Mengerti, Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
