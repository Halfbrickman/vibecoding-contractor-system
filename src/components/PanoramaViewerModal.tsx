"use client";

import React, { useState } from "react";
import { Compass, X } from "lucide-react";

interface PanoramaViewerProps {
  imageUrl: string;
  title: string;
}

export default function PanoramaViewerModal({
  imageUrl,
  title,
}: PanoramaViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [posX, setPosX] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = (e.clientX - startX) * 0.15;
    setPosX((prev) => (prev - delta + 100) % 100);
    setStartX(e.clientX);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg hover:bg-amber-400 transition shadow"
      >
        <Compass className="w-4 h-4" />
        <span>Buka Panorama 360° (Enscape)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl h-[75vh] bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="font-bold text-sm">{title} — Geser Kiri/Kanan (360° View)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              className="flex-1 w-full cursor-grab active:cursor-grabbing select-none relative"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "240% 100%",
                backgroundPosition: `${posX}% center`,
                backgroundRepeat: "repeat-x",
              }}
            >
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-4 py-2 rounded-full pointer-events-none">
                Klik tahan & geser ke kiri/kanan untuk melihat keliling ruangan 360°
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
