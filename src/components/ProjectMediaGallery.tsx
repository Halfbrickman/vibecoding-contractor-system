"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import PanoramaViewerModal from "@/components/PanoramaViewerModal";

export interface MediaGalleryItem {
  id: string;
  title: string | null;
  caption?: string | null;
  fileUrl: string;
  mediaType: string;
  roomName: string | null;
}

/**
 * Membersihkan judul media agar tidak menampilkan nama file mentah / ekstensi (.jpg, .png, .webp, IMG_xxx, 2025xxxx_xxxx)
 */
function getCleanMediaTitle(item: MediaGalleryItem): string | null {
  const raw = (item.title || "").trim();
  if (!raw) return null;

  // Deteksi apakah string memiliki ekstensi file gambar
  const hasFileExt = /\.(jpe?g|png|webp|gif|bmp|heic|svg|tiff?)$/i.test(raw);
  // Deteksi pola nama file kamera / WA otomatis
  const isCameraFilename =
    /^(IMG|DSC|DCIM|PXL|Screenshot|WhatsApp|\d{8}[_-]\d{4,})/i.test(raw);

  if (hasFileExt || isCameraFilename) {
    return null;
  }

  return raw;
}

function formatMediaTypeBadge(mediaType: string): string {
  switch (mediaType) {
    case "RENDER_3D":
      return "RENDER 3D";
    case "PANORAMA_360":
      return "PANORAMA 360°";
    case "REAL_PHOTO":
      return "DOKUMENTASI LAPANGAN";
    case "BEFORE_PHOTO":
      return "BEFORE PHOTO";
    default:
      return mediaType.replace(/_/g, " ");
  }
}

export default function ProjectMediaGallery({
  media,
}: {
  media: MediaGalleryItem[];
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (selectedIndex === null) return;
      setSelectedIndex((selectedIndex - 1 + media.length) % media.length);
    },
    [selectedIndex, media.length]
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (selectedIndex === null) return;
      setSelectedIndex((selectedIndex + 1) % media.length);
    },
    [selectedIndex, media.length]
  );

  // Keyboard navigation (Esc, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (selectedIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIndex, handleClose, handlePrev, handleNext]);

  const activeItem = selectedIndex !== null ? media[selectedIndex] : null;
  const activeCleanTitle = activeItem ? getCleanMediaTitle(activeItem) : null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {media.map((item, idx) => {
          const cleanTitle = getCleanMediaTitle(item);
          const areaLabel = item.roomName || "Fasad / Ruang Utama";

          return (
            <div
              key={item.id}
              className="group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col shadow-sm hover:shadow-md transition"
            >
              {/* Gambar yang bisa diklik untuk Pop-up Fullscreen */}
              <div
                onClick={() => setSelectedIndex(idx)}
                className="relative h-64 bg-slate-900 cursor-zoom-in overflow-hidden"
              >
                <img
                  src={item.fileUrl}
                  alt={cleanTitle || areaLabel}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <span className="absolute top-3 left-3 bg-slate-950/80 text-amber-400 text-[11px] font-bold px-2.5 py-1 rounded-md">
                  {formatMediaTypeBadge(item.mediaType)}
                </span>

                {/* Overlay Hint Klik Perbesar */}
                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="bg-slate-950/85 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg border border-white/15">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Klik untuk Lihat Foto Penuh</span>
                  </span>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between gap-4">
                <div>
                  {cleanTitle && cleanTitle !== areaLabel ? (
                    <>
                      <h3 className="font-bold text-sm text-slate-900">
                        {cleanTitle}
                      </h3>
                      <span className="text-xs text-slate-500">
                        Area: {areaLabel}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-slate-700">
                      Area: {areaLabel}
                    </span>
                  )}
                </div>

                {item.mediaType === "PANORAMA_360" && (
                  <PanoramaViewerModal
                    imageUrl={item.fileUrl}
                    title={cleanTitle || areaLabel}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================
          LIGHTBOX POP-UP MODAL (LIHAT FOTO PENUH)
          ===================================================== */}
      {activeItem && selectedIndex !== null && (
        <div
          onClick={handleClose}
          className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in"
        >
          {/* Top Bar Info & Close */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl flex items-center justify-between text-white mb-3 px-2"
          >
            <div className="flex items-center gap-3">
              <span className="bg-amber-500 text-slate-950 text-[11px] font-extrabold px-2.5 py-1 rounded-md">
                {formatMediaTypeBadge(activeItem.mediaType)}
              </span>
              <div>
                {activeCleanTitle && (
                  <h4 className="font-bold text-sm text-white">
                    {activeCleanTitle}
                  </h4>
                )}
                <span className="text-xs text-slate-300">
                  Area: {activeItem.roomName || "Fasad / Ruang Utama"} • Foto{" "}
                  {selectedIndex + 1} dari {media.length}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white transition flex items-center gap-1.5 text-xs font-bold border border-slate-700"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Tutup</span>
            </button>
          </div>

          {/* Container Gambar Full (Object-Contain) + Tombol Next/Prev */}
          <div className="relative w-full max-w-6xl flex-1 flex items-center justify-center overflow-hidden">
            {media.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 z-10 p-2.5 sm:p-3 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/15 transition shadow-xl"
                title="Foto Sebelumnya"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              onClick={(e) => e.stopPropagation()}
              src={activeItem.fileUrl}
              alt={activeCleanTitle || activeItem.roomName || "Foto Proyek"}
              className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl select-none"
            />

            {media.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 sm:right-4 z-10 p-2.5 sm:p-3 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/15 transition shadow-xl"
                title="Foto Berikutnya"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
