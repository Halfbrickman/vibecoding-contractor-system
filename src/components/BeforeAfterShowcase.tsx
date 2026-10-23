"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import BeforeAfterSlider from "./BeforeAfterSlider";

interface ShowcaseItem {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  beforeImageUrl: string;
  afterImageUrl: string;
}

export default function BeforeAfterShowcase({
  items,
}: {
  items: ShowcaseItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) return null;

  const current = items[activeIndex] || items[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <section id="before-after" className="py-16 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
              Bukti Transformasi Renovasi ({activeIndex + 1} dari {items.length})
            </span>

            <h2 className="text-3xl font-extrabold leading-tight">
              Geser untuk Melihat Perbandingan Sebelum & Sesudah Renovasi
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed">
              Proyek: <strong>{current.title}</strong> (
              {current.location || "Jabodetabek"}). Dari bangunan lama menjadi
              hunian modern dengan pencahayaan alami dan struktur kokoh.
            </p>

            {/* Pemilih Proyek bila ada > 1 proyek yang punya foto Before-After */}
            {items.length > 1 && (
              <div className="pt-2 space-y-2">
                <span className="text-xs text-slate-400 block font-semibold">
                  Pilih Proyek Transformasi Lainnya:
                </span>
                <div className="flex flex-wrap gap-2">
                  {items.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                        idx === activeIndex
                          ? "bg-amber-500 text-slate-950 border-amber-500"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {idx + 1}. {item.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 flex items-center justify-between">
              <Link
                href={`/projects/${current.slug}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300"
              >
                <span>Lihat Detail Portofolio & Galeri 3D</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {items.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    title="Proyek Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    title="Proyek Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <BeforeAfterSlider
              key={current.id}
              beforeUrl={current.beforeImageUrl}
              afterUrl={current.afterImageUrl}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
