"use client";

import React, { useState } from "react";
import { MoveHorizontal } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Kondisi Awal (Before)",
  afterLabel = "Render 3D / Hasil Jadi (After)",
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="relative w-full h-[340px] md:h-[440px] rounded-2xl overflow-hidden shadow-xl select-none border border-slate-200 group">
      {/* After Image (Full Background) */}
      <img
        src={afterUrl}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <span className="absolute top-4 right-4 z-10 bg-amber-500/95 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-full shadow">
        {afterLabel}
      </span>

      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <span className="absolute top-4 left-4 z-10 bg-slate-900/85 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
          {beforeLabel}
        </span>
      </div>

      {/* Divider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white">
          <MoveHorizontal className="w-5 h-5" />
        </div>
      </div>

      {/* Range Input Overlay */}
      <input
        type="range"
        min={5}
        max={95}
        value={sliderPos}
        onChange={(e) => setSliderPos(Number(e.target.value))}
        aria-label="Geser perbandingan sebelum dan sesudah renovasi"
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
      />
    </div>
  );
}
