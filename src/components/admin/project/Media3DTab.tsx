"use client";

import React, { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Media3DTab({
  project,
  onUploadFile,
  uploading,
  onRefresh,
}: {
  project: any;
  onUploadFile: (file: File, folder: string) => Promise<string>;
  uploading: boolean;
  onRefresh: () => void;
}) {
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaType, setMediaType] = useState("RENDER_3D");
  const [roomName, setRoomName] = useState("Fasad / Ruang Utama");

  const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileUrl = await onUploadFile(file, "renders");
    await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_MEDIA",
        title: mediaTitle || file.name,
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
        <h3 className="font-bold text-base text-slate-900 mb-1">
          Upload Hasil Render V-Ray / Enscape / Panorama 360° ke Server
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          File gambar resolusi tinggi akan disimpan di Storage Server dan langsung tampil di Galeri Klien.
        </p>

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {project.media.map((item: any) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <img
              src={item.fileUrl}
              alt={item.title}
              className="w-full h-48 object-cover"
            />
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
    </div>
  );
}
