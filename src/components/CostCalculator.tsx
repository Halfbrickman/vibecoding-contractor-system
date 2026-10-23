"use client";

import React, { useState } from "react";
import { Calculator, MessageCircle, Building2, Home, Hammer } from "lucide-react";
import { formatRupiah } from "@/lib/format";

interface CostCalculatorProps {
  whatsappNumber: string;
  prices: {
    renovasi: number;
    bangunStd: number;
    bangunLux: number;
    kontrakan: number;
  };
}

export default function CostCalculator({
  whatsappNumber,
  prices,
}: CostCalculatorProps) {
  const [projectType, setProjectType] = useState<
    "RENOVASI" | "BANGUN_STD" | "BANGUN_LUX" | "KONTRAKAN"
  >("RENOVASI");
  const [buildingArea, setBuildingArea] = useState<number>(90);
  const [floorsOrUnits, setFloorsOrUnits] = useState<number>(2);

  const getRatePerM2 = () => {
    switch (projectType) {
      case "RENOVASI":
        return prices.renovasi;
      case "BANGUN_STD":
        return prices.bangunStd;
      case "BANGUN_LUX":
        return prices.bangunLux;
      case "KONTRAKAN":
        return prices.kontrakan;
    }
  };

  const getLabel = () => {
    switch (projectType) {
      case "RENOVASI":
        return "Renovasi Rumah";
      case "BANGUN_STD":
        return "Bangun Rumah Baru (Spesifikasi Standar)";
      case "BANGUN_LUX":
        return "Bangun Rumah Baru (Spesifikasi Premium/Luxury)";
      case "KONTRAKAN":
        return "Bangun Kontrakan / Kos-kosan";
    }
  };

  const rate = getRatePerM2();
  const estimatedTotal = buildingArea * rate;
  const minEstimate = estimatedTotal * 0.92;
  const maxEstimate = estimatedTotal * 1.08;

  const waText = encodeURIComponent(
    `Halo Pak, saya mencoba Kalkulator Estimasi di website.\n\n` +
      `- Rencana: ${getLabel()}\n` +
      `- Total Luas Bangunan: ${buildingArea} m2\n` +
      `- ${projectType === "KONTRAKAN" ? "Jumlah Pintu" : "Jumlah Lantai"}: ${floorsOrUnits}\n` +
      `- Estimasi Kasar Website: ${formatRupiah(estimatedTotal)}\n\n` +
      `Boleh diskusi untuk survei lokasi & pembuatan RAB detailnya, Pak?`
  );

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Simulasi Estimasi Biaya Kasar
          </h3>
          <p className="text-sm text-slate-500">
            Hitung perkiraan awal sebelum dibuatkan gambar 3D SketchUp & RAB detail
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              1. Pilih Jenis Pekerjaan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setProjectType("RENOVASI")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm font-medium transition ${
                  projectType === "RENOVASI"
                    ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Hammer className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Renovasi Rumah</span>
              </button>

              <button
                type="button"
                onClick={() => setProjectType("BANGUN_STD")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm font-medium transition ${
                  projectType === "BANGUN_STD"
                    ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Home className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bangun Baru (Standar)</span>
              </button>

              <button
                type="button"
                onClick={() => setProjectType("BANGUN_LUX")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm font-medium transition ${
                  projectType === "BANGUN_LUX"
                    ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Home className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bangun Baru (Premium)</span>
              </button>

              <button
                type="button"
                onClick={() => setProjectType("KONTRAKAN")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm font-medium transition ${
                  projectType === "KONTRAKAN"
                    ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bangun Kontrakan</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
              <span>2. Total Luas Bangunan (m²)</span>
              <span className="text-amber-600 font-bold">{buildingArea} m²</span>
            </div>
            <input
              type="range"
              min={20}
              max={500}
              step={5}
              value={buildingArea}
              onChange={(e) => setBuildingArea(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>20 m²</span>
              <span>250 m²</span>
              <span>500 m²</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              3. {projectType === "KONTRAKAN" ? "Jumlah Pintu Kontrakan" : "Jumlah Lantai"}
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={floorsOrUnits}
              onChange={(e) => setFloorsOrUnits(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
        </div>

        {/* Result Box */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="inline-block text-xs uppercase tracking-wider font-semibold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full mb-3">
              Hasil Simulasi Kasar
            </span>
            <p className="text-sm text-slate-300">{getLabel()}</p>
            <div className="my-4">
              <div className="text-3xl md:text-4xl font-extrabold text-amber-400">
                {formatRupiah(estimatedTotal)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Rentang wajar: {formatRupiah(minEstimate)} – {formatRupiah(maxEstimate)}
              </p>
            </div>

            <div className="border-t border-slate-800 pt-4 mt-4 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Harga Acuan per m²:</span>
                <span className="font-semibold text-white">{formatRupiah(rate)} / m²</span>
              </div>
              <div className="flex justify-between">
                <span>Luas Bangunan:</span>
                <span className="font-semibold text-white">{buildingArea} m²</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 leading-relaxed">
                *Catatan: Angka di atas adalah estimasi kasar per m². Biaya pasti akan dihitung menggunakan RAB detail setelah survei lokasi & kesepakatan spesifikasi material.
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Konsultasi & Minta Survei via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
