import React from "react";
import { Calculator } from "lucide-react";
import BuildingMaterialCalculator from "@/components/BuildingMaterialCalculator";

export default function AdminCalculatorPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shrink-0 shadow-sm">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Kalkulator Material Bangunan (Standar SNI)
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Alat bantu hitung cepat di lapangan untuk mengestimasi kebutuhan
              bata ringan (hebel), sak semen, dus keramik, cat tembok, kubikasi
              cor beton, rangka atap baja ringan, hingga berat besi beton.
            </p>
          </div>
        </div>
      </div>

      <BuildingMaterialCalculator mode="ADMIN" />
    </div>
  );
}
