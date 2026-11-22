"use client";

import React, { useState, useMemo } from "react";
import {
  BrickWall,
  Grid,
  Layers,
  PaintBucket,
  Home,
  Wrench,
  Copy,
  Check,
  PhoneCall,
  RotateCcw,
  Info,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";

type CalcCategory =
  | "DINDING"
  | "KERAMIK"
  | "BETON"
  | "CAT"
  | "ATAP_PLAFON"
  | "BESI";

interface BuildingMaterialCalculatorProps {
  mode?: "PUBLIC" | "ADMIN";
  waNumber?: string;
  companyName?: string;
}

export default function BuildingMaterialCalculator({
  mode = "PUBLIC",
  waNumber = "6281234567890",
  companyName = "A8 Renov",
}: BuildingMaterialCalculatorProps) {
  const [activeTab, setActiveTab] = useState<CalcCategory>("DINDING");
  const [copied, setCopied] = useState(false);

  // =====================================================
  // 1. STATE KALKULATOR DINDING & PLESTERAN
  // =====================================================
  const [wallLength, setWallLength] = useState<number>(10); // meter
  const [wallHeight, setWallHeight] = useState<number>(3.5); // meter
  const [wallOpeningArea, setWallOpeningArea] = useState<number>(2); // m2 pintu/jendela
  const [brickType, setBrickType] = useState<"HEBEL_10" | "HEBEL_75" | "BATA_MERAH">("HEBEL_10");
  const [includePlaster, setIncludePlaster] = useState<boolean>(true);
  const [plasterSides, setPlasterSides] = useState<1 | 2>(2); // 1 sisi atau 2 sisi bolak-balik

  // =====================================================
  // 2. STATE KALKULATOR KERAMIK & GRANIT
  // =====================================================
  const [tileLength, setTileLength] = useState<number>(6);
  const [tileWidth, setTileWidth] = useState<number>(4);
  const [tileCustomArea, setTileCustomArea] = useState<number | "">("");
  const [tileSize, setTileSize] = useState<string>("60x60");
  const [tileWaste, setTileWaste] = useState<number>(5); // % cadangan potong

  // =====================================================
  // 3. STATE KALKULATOR COR BETON
  // =====================================================
  const [concreteLength, setConcreteLength] = useState<number>(6);
  const [concreteWidth, setConcreteWidth] = useState<number>(4);
  const [concreteThickCm, setConcreteThickCm] = useState<number>(12); // cm
  const [concreteGrade, setConcreteGrade] = useState<"K175" | "K225" | "K250" | "K300">("K225");
  const [cementBagWeight, setCementBagWeight] = useState<40 | 50>(50);

  // =====================================================
  // 4. STATE KALKULATOR CAT TEMBOK
  // =====================================================
  const [paintLength, setPaintLength] = useState<number>(12);
  const [paintHeight, setPaintHeight] = useState<number>(3.5);
  const [paintSides, setPaintSides] = useState<1 | 2>(1);
  const [paintCoats, setPaintCoats] = useState<2 | 3>(2); // lapis cat

  // =====================================================
  // 5. STATE KALKULATOR ATAP BAJA RINGAN & PLAFON
  // =====================================================
  const [roofSubType, setRoofSubType] = useState<"ATAP" | "PLAFON">("ATAP");
  const [roofLength, setRoofLength] = useState<number>(10);
  const [roofWidth, setRoofWidth] = useState<number>(8);
  const [roofOverstek, setRoofOverstek] = useState<number>(0.8); // meter tritisan
  const [roofPitchDeg, setRoofPitchDeg] = useState<number>(30); // derajat kemiringan
  const [roofCoverType, setRoofCoverType] = useState<"SPANDEK" | "GENTENG_METAL" | "GENTENG_KERAMIK">("SPANDEK");

  // =====================================================
  // 6. STATE KALKULATOR BESI BETON (SNI)
  // =====================================================
  const [rebarMode, setRebarMode] = useState<"WEIGHT" | "SLOOF_KOLOM">("WEIGHT");
  const [rebarDiameter, setRebarDiameter] = useState<number>(10); // mm
  const [rebarCount, setRebarCount] = useState<number>(25); // batang (12m)
  const [structureLength, setStructureLength] = useState<number>(20); // total panjang sloof/kolom (m)
  const [mainBarCount, setMainBarCount] = useState<number>(4); // 4 batang tulangan pokok
  const [stirrupSpacingCm, setStirrupSpacingCm] = useState<number>(15); // jarak begel cm
  const [sectionWidthCm, setSectionWidthCm] = useState<number>(15);
  const [sectionHeightCm, setSectionHeightCm] = useState<number>(20);

  // =====================================================
  // PERHITUNGAN KOEFISIEN SNI & LAPANGAN
  // =====================================================

  // 1. Hasil Dinding
  const wallResult = useMemo(() => {
    const grossArea = Math.max(0, wallLength * wallHeight);
    const netArea = Math.max(0, grossArea - wallOpeningArea);

    let brickCount = 0;
    let brickUnitLabel = "Pcs (Batang)";
    let brickKubik = 0;
    let mortarCementBags = 0;
    let mortarTypeLabel = "Semen Perekat (Mortar Instant 40kg)";
    let pairSandM3 = 0;

    if (brickType === "HEBEL_10") {
      // Hebel 60x20x10 cm -> 8.33 pcs per m2, 1 m3 = 83.3 pcs (+3% waste)
      brickCount = Math.ceil(netArea * 8.33 * 1.03);
      brickKubik = Number((brickCount / 83.33).toFixed(2));
      // 1 sak mortar perekat 40kg untuk ~10 m2 hebel 10cm
      mortarCementBags = Math.ceil(netArea / 10);
    } else if (brickType === "HEBEL_75") {
      // Hebel 60x20x7.5 cm -> 8.33 pcs per m2, 1 m3 = 111.1 pcs (+3% waste)
      brickCount = Math.ceil(netArea * 8.33 * 1.03);
      brickKubik = Number((brickCount / 111.11).toFixed(2));
      // 1 sak mortar perekat 40kg untuk ~13 m2 hebel 7.5cm
      mortarCementBags = Math.ceil(netArea / 13);
    } else {
      // Bata Merah -> ~70 pcs per m2 (+5% waste)
      brickCount = Math.ceil(netArea * 70 * 1.05);
      brickUnitLabel = "Buah Bata Merah";
      // Koefisien SNI pasangan bata merah: 11.5 kg semen/m2 & 0.043 m3 pasir/m2
      mortarCementBags = Math.ceil((netArea * 11.5) / 50);
      mortarTypeLabel = "Semen Pasangan Bata (Sak 50kg)";
      pairSandM3 = Number((netArea * 0.043).toFixed(2));
    }

    // Plesteran & Acian (Koefisien SNI: Plester tebal 15mm = 6.24 kg semen/m2 + 0.024 m3 pasir/m2, Acian = 3.25 kg semen/m2)
    const plasterArea = includePlaster ? netArea * plasterSides : 0;
    const plasterCementBags = includePlaster
      ? Math.ceil((plasterArea * 6.24) / 50)
      : 0;
    const acianCementBags = includePlaster
      ? Math.ceil((plasterArea * 3.25) / 50)
      : 0;
    const plasterSandM3 = includePlaster
      ? Number((plasterArea * 0.024).toFixed(2))
      : 0;

    return {
      grossArea: Number(grossArea.toFixed(2)),
      netArea: Number(netArea.toFixed(2)),
      brickCount,
      brickUnitLabel,
      brickKubik,
      mortarCementBags,
      mortarTypeLabel,
      pairSandM3,
      plasterArea: Number(plasterArea.toFixed(2)),
      plasterCementBags,
      acianCementBags,
      totalSandM3: Number((pairSandM3 + plasterSandM3).toFixed(2)),
    };
  }, [
    wallLength,
    wallHeight,
    wallOpeningArea,
    brickType,
    includePlaster,
    plasterSides,
  ]);

  // 2. Hasil Keramik
  const tileResult = useMemo(() => {
    const baseArea =
      tileCustomArea !== "" && Number(tileCustomArea) > 0
        ? Number(tileCustomArea)
        : Math.max(0, tileLength * tileWidth);

    const specs: Record<
      string,
      { pcsPerBox: number; boxAreaM2: number; tileAreaM2: number }
    > = {
      "60x60": { pcsPerBox: 4, boxAreaM2: 1.44, tileAreaM2: 0.36 },
      "80x80": { pcsPerBox: 3, boxAreaM2: 1.92, tileAreaM2: 0.64 },
      "50x50": { pcsPerBox: 4, boxAreaM2: 1.0, tileAreaM2: 0.25 },
      "40x40": { pcsPerBox: 6, boxAreaM2: 0.96, tileAreaM2: 0.16 },
      "30x30": { pcsPerBox: 11, boxAreaM2: 0.99, tileAreaM2: 0.09 },
      "25x40": { pcsPerBox: 10, boxAreaM2: 1.0, tileAreaM2: 0.1 },
    };

    const spec = specs[tileSize] || specs["60x60"];
    const areaWithWaste = baseArea * (1 + tileWaste / 100);
    const totalBoxes = Math.ceil(areaWithWaste / spec.boxAreaM2);
    const totalPieces = totalBoxes * spec.pcsPerBox;

    // Koefisien SNI pasang keramik: ~10 kg semen/m2, 0.045 m3 pasir/m2, 0.5 kg semen nat/m2
    const cementBags50kg = Math.ceil((baseArea * 10) / 50);
    const sandM3 = Number((baseArea * 0.045).toFixed(2));
    const groutKg = Math.ceil(baseArea * 0.5);

    return {
      baseArea: Number(baseArea.toFixed(2)),
      areaWithWaste: Number(areaWithWaste.toFixed(2)),
      pcsPerBox: spec.pcsPerBox,
      boxAreaM2: spec.boxAreaM2,
      totalBoxes,
      totalPieces,
      cementBags50kg,
      sandM3,
      groutKg,
    };
  }, [tileLength, tileWidth, tileCustomArea, tileSize, tileWaste]);

  // 3. Hasil Cor Beton
  const concreteResult = useMemo(() => {
    const volumeM3 = Math.max(
      0,
      concreteLength * concreteWidth * (concreteThickCm / 100)
    );

    // Standar SNI DT-91-0008-2007 kebutuhan per 1 m3 beton
    const gradeSpecs: Record<
      string,
      { cementKg: number; sandM3: number; splitM3: number; label: string }
    > = {
      K175: {
        cementKg: 326,
        sandM3: 0.54,
        splitM3: 0.76,
        label: "K-175 (Lantai Kerja / Rabat / Non-Struktural)",
      },
      K225: {
        cementKg: 371,
        sandM3: 0.5,
        splitM3: 0.77,
        label: "K-225 (Standar Rumah 1-2 Lantai: Sloof, Kolom, Dak)",
      },
      K250: {
        cementKg: 384,
        sandM3: 0.49,
        splitM3: 0.77,
        label: "K-250 (Struktural Beban Menengah / Dak Lantai 2)",
      },
      K300: {
        cementKg: 413,
        sandM3: 0.48,
        splitM3: 0.77,
        label: "K-300 (Struktural Berat / Jalan Beton)",
      },
    };

    const g = gradeSpecs[concreteGrade];
    const totalCementKg = Math.ceil(volumeM3 * g.cementKg);
    const totalCementBags = Math.ceil(totalCementKg / cementBagWeight);
    const totalSandM3 = Number((volumeM3 * g.sandM3).toFixed(2));
    const totalSplitM3 = Number((volumeM3 * g.splitM3).toFixed(2));

    return {
      volumeM3: Number(volumeM3.toFixed(2)),
      gradeLabel: g.label,
      totalCementKg,
      totalCementBags,
      totalSandM3,
      totalSplitM3,
    };
  }, [
    concreteLength,
    concreteWidth,
    concreteThickCm,
    concreteGrade,
    cementBagWeight,
  ]);

  // 4. Hasil Cat Tembok
  const paintResult = useMemo(() => {
    const areaM2 = Math.max(0, paintLength * paintHeight * paintSides);
    // Rata-rata daya sebar cat tembok = 10 m2 / liter per 1 lapis
    const totalCoverageArea = areaM2 * paintCoats;
    const litersNeeded = Number((totalCoverageArea / 10).toFixed(1));
    // Cat dasar (Alkali Sealer) 1 lapis = areaM2 / 11
    const sealerLiters = Number((areaM2 / 11).toFixed(1));

    // Konversi ke Galon (2.5 Liter / ~5 Kg) atau Pail (20 Liter / ~25 Kg)
    const gallonsOnly = Math.ceil(litersNeeded / 2.5);
    const pailsCount = Math.floor(litersNeeded / 20);
    const remainingGallons = Math.ceil((litersNeeded - pailsCount * 20) / 2.5);
    const sealerGallons = Math.ceil(sealerLiters / 2.5);

    return {
      areaM2: Number(areaM2.toFixed(2)),
      litersNeeded,
      sealerLiters,
      gallonsOnly,
      pailsCount,
      remainingGallons,
      sealerGallons,
    };
  }, [paintLength, paintHeight, paintSides, paintCoats]);

  // 5. Hasil Atap Baja Ringan & Plafon
  const roofResult = useMemo(() => {
    if (roofSubType === "ATAP") {
      const flatLength = roofLength + roofOverstek * 2;
      const flatWidth = roofWidth + roofOverstek * 2;
      const flatArea = flatLength * flatWidth;
      const cosPitch = Math.cos((roofPitchDeg * Math.PI) / 180) || 0.866;
      const slopeArea = Number((flatArea / cosPitch).toFixed(2));

      // Estimasi Baja Ringan: Kanal C75.75 (panjang 6m) ~ 0.42 batang/m2, Reng ~ 0.65 batang/m2
      const kanalCBars = Math.ceil(slopeArea * 0.42);
      const rengBars = Math.ceil(slopeArea * 0.65);
      const roofingScrews = Math.ceil(slopeArea * 12);
      const trussScrews = Math.ceil(slopeArea * 28);

      let coverCount = 0;
      let coverUnit = "Lembar";
      if (roofCoverType === "SPANDEK") {
        // Lebar efektif 1m x 6m (rata-rata dihitung per m2 efektif + overlap 10%)
        coverCount = Math.ceil((slopeArea * 1.1) / 4); // asumsi lembar 4m efektif
        coverUnit = "Lembar Spandek (4m x 1m)";
      } else if (roofCoverType === "GENTENG_METAL") {
        // 1 lembar genteng metal 2x4 = ~0.62 m2 efektif
        coverCount = Math.ceil(slopeArea / 0.62);
        coverUnit = "Lembar Genteng Metal (2x4)";
      } else {
        // Genteng Keramik ~ 14.5 buah / m2
        coverCount = Math.ceil(slopeArea * 14.5);
        coverUnit = "Buah Genteng Keramik";
      }

      return {
        slopeArea,
        kanalCBars,
        rengBars,
        coverCount,
        coverUnit,
        roofingScrews,
        trussScrews,
        gypsumSheets: 0,
        hollow4x4: 0,
        hollow2x4: 0,
        corniceCompoundBags: 0,
      };
    } else {
      // PLAFON GYPSUM
      const ceilingArea = Number((roofLength * roofWidth).toFixed(2));
      // 1 lembar Gypsum = 1.2m x 2.4m = 2.88 m2 (+5% waste)
      const gypsumSheets = Math.ceil((ceilingArea * 1.05) / 2.88);
      // Rangka Hollow 4m: Hollow 4x4 ~ 0.55 btg/m2, Hollow 2x4 ~ 0.85 btg/m2
      const hollow4x4 = Math.ceil(ceilingArea * 0.55);
      const hollow2x4 = Math.ceil(ceilingArea * 0.85);
      const corniceCompoundBags = Math.ceil(ceilingArea / 25); // 1 sak 20kg untuk ~25m2

      return {
        slopeArea: ceilingArea,
        kanalCBars: 0,
        rengBars: 0,
        coverCount: 0,
        coverUnit: "",
        roofingScrews: 0,
        trussScrews: 0,
        gypsumSheets,
        hollow4x4,
        hollow2x4,
        corniceCompoundBags,
      };
    }
  }, [
    roofSubType,
    roofLength,
    roofWidth,
    roofOverstek,
    roofPitchDeg,
    roofCoverType,
  ]);

  // 6. Hasil Besi Beton SNI
  const rebarResult = useMemo(() => {
    // Rumus SNI Berat Besi: 0.006165 x d^2 x Panjang (12m)
    const weightPerMeter = 0.006165 * rebarDiameter * rebarDiameter;
    const weightPerBar12m = Number((weightPerMeter * 12).toFixed(2));
    const totalWeightKg = Number((weightPerBar12m * rebarCount).toFixed(2));

    // Untuk mode Sloof/Kolom
    // Panjang total tulangan pokok = structureLength * mainBarCount (+5% overlap sambungan)
    const mainTotalMeters = structureLength * mainBarCount * 1.05;
    const mainBars12m = Math.ceil(mainTotalMeters / 12);

    // Begel (Sengkang) Ø8: keliling = 2*( (W-4) + (H-4) ) + 10cm kait
    const stirrupPerimeterM =
      (2 * (Math.max(5, sectionWidthCm - 4) + Math.max(5, sectionHeightCm - 4)) +
        10) /
      100;
    const totalStirrupsCount =
      Math.ceil((structureLength * 100) / Math.max(5, stirrupSpacingCm)) + 1;
    const stirrupTotalMeters = totalStirrupsCount * stirrupPerimeterM * 1.05;
    const stirrupBars12m = Math.ceil(stirrupTotalMeters / 12);
    const bendratWireKg = Math.max(1, Math.ceil((mainBars12m + stirrupBars12m) * 0.15));

    return {
      weightPerMeter: Number(weightPerMeter.toFixed(3)),
      weightPerBar12m,
      totalWeightKg,
      mainBars12m,
      totalStirrupsCount,
      stirrupPerimeterCm: Math.round(stirrupPerimeterM * 100),
      stirrupBars12m,
      bendratWireKg,
    };
  }, [
    rebarDiameter,
    rebarCount,
    structureLength,
    mainBarCount,
    stirrupSpacingCm,
    sectionWidthCm,
    sectionHeightCm,
  ]);

  // =====================================================
  // RINGKASAN TEKS UNTUK COPY / WHATSAPP
  // =====================================================
  const summaryText = useMemo(() => {
    if (activeTab === "DINDING") {
      return [
        `📋 *ESTIMASI MATERIAL DINDING & PLESTERAN (${companyName})*`,
        `• Ukuran Dinding: ${wallLength}m × ${wallHeight}m (Bersih: ${wallResult.netArea} m²)`,
        `• Kebutuhan Bata: *${wallResult.brickCount.toLocaleString("id-ID")} ${wallResult.brickUnitLabel}* ${
          wallResult.brickKubik > 0 ? `(± ${wallResult.brickKubik} m³ Hebel)` : ""
        }`,
        `• ${wallResult.mortarTypeLabel}: *${wallResult.mortarCementBags} Sak*`,
        includePlaster
          ? `• Semen Plester (${plasterSides} Sisi): *${wallResult.plasterCementBags} Sak (50kg)*`
          : "",
        includePlaster
          ? `• Semen Acian (${plasterSides} Sisi): *${wallResult.acianCementBags} Sak (50kg)*`
          : "",
        wallResult.totalSandM3 > 0
          ? `• Pasir Pasang/Plester: *± ${wallResult.totalSandM3} m³*`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (activeTab === "KERAMIK") {
      return [
        `📋 *ESTIMASI MATERIAL KERAMIK / GRANIT (${companyName})*`,
        `• Luas Area: ${tileResult.baseArea} m² (+${tileWaste}% Cadangan Potong = ${tileResult.areaWithWaste} m²)`,
        `• Ukuran Keramik: *${tileSize} cm* (${tileResult.pcsPerBox} keping/dus)`,
        `• Kebutuhan Keramik: *${tileResult.totalBoxes} Dus* (${tileResult.totalPieces} Keping)`,
        `• Semen Pasang: *${tileResult.cementBags50kg} Sak (50kg)*`,
        `• Pasir Pasang: *± ${tileResult.sandM3} m³*`,
        `• Semen Nat: *${tileResult.groutKg} Bungkus (1kg)*`,
      ].join("\n");
    }

    if (activeTab === "BETON") {
      return [
        `📋 *ESTIMASI MATERIAL COR BETON (${companyName})*`,
        `• Dimensi Cor: ${concreteLength}m × ${concreteWidth}m × Tebal ${concreteThickCm}cm`,
        `• Total Volume Cor: *${concreteResult.volumeM3} m³* (${concreteGrade})`,
        `• Semen Portland: *${concreteResult.totalCementBags} Sak (${cementBagWeight}kg)*`,
        `• Pasir Beton: *± ${concreteResult.totalSandM3} m³*`,
        `• Batu Split / Kerikil: *± ${concreteResult.totalSplitM3} m³*`,
      ].join("\n");
    }

    if (activeTab === "CAT") {
      return [
        `📋 *ESTIMASI MATERIAL CAT TEMBOK (${companyName})*`,
        `• Luas Bidang Cat: ${paintResult.areaM2} m² (${paintCoats} Lapis Cat Akhir)`,
        `• Total Volume Cat: *± ${paintResult.litersNeeded} Liter*`,
        `• Konversi Kemasan: *${paintResult.gallonsOnly} Galon (2.5L / 5kg)* ATAU *${paintResult.pailsCount} Pail (20L) + ${paintResult.remainingGallons} Galon*`,
        `• Cat Dasar (Sealer): *${paintResult.sealerGallons} Galon (± ${paintResult.sealerLiters} Liter)*`,
      ].join("\n");
    }

    if (activeTab === "ATAP_PLAFON") {
      if (roofSubType === "ATAP") {
        return [
          `📋 *ESTIMASI RANGKA ATAP BAJA RINGAN (${companyName})*`,
          `• Luas Miring Atap: *${roofResult.slopeArea} m²* (Kemiringan ${roofPitchDeg}°)`,
          `• Baja Ringan Kanal C75: *${roofResult.kanalCBars} Batang (6m)*`,
          `• Reng Baja Ringan: *${roofResult.rengBars} Batang (6m)*`,
          `• Penutup Atap: *${roofResult.coverCount} ${roofResult.coverUnit}*`,
          `• Baut Truss & Roofing: *${roofResult.trussScrews} pcs Baut Baja + ${roofResult.roofingScrews} pcs Baut Atap*`,
        ].join("\n");
      }
      return [
        `📋 *ESTIMASI MATERIAL PLAFON GYPSUM (${companyName})*`,
        `• Luas Plafon: *${roofResult.slopeArea} m²*`,
        `• Papan Gypsum (120x240cm): *${roofResult.gypsumSheets} Lembar*`,
        `• Besi Hollow 4x4 (4m): *${roofResult.hollow4x4} Batang*`,
        `• Besi Hollow 2x4 (4m): *${roofResult.hollow2x4} Batang*`,
        `• Kompon / Cornice: *${roofResult.corniceCompoundBags} Sak (20kg)*`,
      ].join("\n");
    }

    // BESI
    if (rebarMode === "WEIGHT") {
      return [
        `📋 *ESTIMASI BERAT BESI BETON SNI (${companyName})*`,
        `• Diameter Besi: *Ø ${rebarDiameter} mm* (Panjang 12 Meter)`,
        `• Berat per Batang: *${rebarResult.weightPerBar12m} Kg/Batang*`,
        `• Total (${rebarCount} Batang): *${rebarResult.totalWeightKg} Kg*`,
      ].join("\n");
    }
    return [
      `📋 *ESTIMASI TULANGAN SLOOF / KOLOM (${companyName})*`,
      `• Panjang Struktur: ${structureLength} Meter (Penampang ${sectionWidthCm}×${sectionHeightCm} cm)`,
      `• Besi Pokok (Ø${rebarDiameter}mm - ${mainBarCount} jalur): *${rebarResult.mainBars12m} Batang (12m)*`,
      `• Besi Begel / Cincin (Ø8mm jarak ${stirrupSpacingCm}cm): *${rebarResult.stirrupBars12m} Batang (12m)* (Jadi ${rebarResult.totalStirrupsCount} cincin)`,
      `• Kawat Bendrat: *± ${rebarResult.bendratWireKg} Kg*`,
    ].join("\n");
  }, [
    activeTab,
    companyName,
    wallLength,
    wallHeight,
    wallResult,
    includePlaster,
    plasterSides,
    tileResult,
    tileWaste,
    tileSize,
    concreteLength,
    concreteWidth,
    concreteThickCm,
    concreteResult,
    concreteGrade,
    cementBagWeight,
    paintResult,
    paintCoats,
    roofSubType,
    roofResult,
    roofPitchDeg,
    rebarMode,
    rebarDiameter,
    rebarResult,
    rebarCount,
    structureLength,
    sectionWidthCm,
    sectionHeightCm,
    mainBarCount,
    stirrupSpacingCm,
  ]);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryText.replace(/\*/g, ""));
    setCopied(true);
    toast.success("Rincian kebutuhan material berhasil disalin!");
    setTimeout(() => setCopied(false), 2500);
  };

  const waUrl = `https://wa.me/${waNumber.replace(
    /\D/g,
    ""
  )}?text=${encodeURIComponent(
    `Halo Tim ${companyName}, saya sudah menghitung estimasi kebutuhan material di Kalkulator Bangunan:\n\n${summaryText}\n\nMohon info konsultasi & estimasi pengerjaannya. Terima kasih.`
  )}`;

  const tabs: { id: CalcCategory; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      id: "DINDING",
      label: "Dinding & Plester",
      sub: "Hebel, Bata, Semen, Acian",
      icon: <BrickWall className="w-4 h-4" />,
    },
    {
      id: "KERAMIK",
      label: "Keramik & Granit",
      sub: "Jumlah Dus, Keping & Nat",
      icon: <Grid className="w-4 h-4" />,
    },
    {
      id: "BETON",
      label: "Cor Beton",
      sub: "Kubikasi, Semen, Pasir, Split",
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: "CAT",
      label: "Cat Tembok",
      sub: "Liter, Galon, Pail & Sealer",
      icon: <PaintBucket className="w-4 h-4" />,
    },
    {
      id: "ATAP_PLAFON",
      label: "Atap & Plafon",
      sub: "Baja Ringan, Gypsum, Hollow",
      icon: <Home className="w-4 h-4" />,
    },
    {
      id: "BESI",
      label: "Besi Beton SNI",
      sub: "Berat Besi, Sloof & Begel",
      icon: <Wrench className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Navigasi Kategori Kalkulator */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                isActive
                  ? "bg-slate-950 text-white border-slate-950 shadow-lg ring-2 ring-amber-400/50"
                  : "bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50/30"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isActive
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.icon}
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm leading-tight">
                  {tab.label}
                </div>
                <div
                  className={`text-[10px] mt-0.5 line-clamp-1 ${
                    isActive ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {tab.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Panel Utama: Kiri Input, Kanan Hasil Material */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* ===================================================
              KOLOM KIRI: INPUT DIMENSI & SPESIFIKASI
              =================================================== */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200">
            {/* 1. FORM DINDING */}
            {activeTab === "DINDING" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      🧱 Kalkulator Dinding, Plester & Acian
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hitung akurat kebutuhan Bata Ringan (Hebel) / Bata Merah
                      beserta semen mortar, plesteran, dan acian sesuai SNI.
                    </p>
                  </div>
                </div>

                {/* Jenis Bata */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Pilih Material Bata:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: "HEBEL_10",
                        title: "Hebel Tebal 10 cm",
                        sub: "60×20×10 cm (83 pcs/m³)",
                      },
                      {
                        id: "HEBEL_75",
                        title: "Hebel Tebal 7.5 cm",
                        sub: "60×20×7.5 cm (111 pcs/m³)",
                      },
                      {
                        id: "BATA_MERAH",
                        title: "Bata Merah Press",
                        sub: "Standar (± 70 pcs/m²)",
                      },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          setBrickType(
                            b.id as "HEBEL_10" | "HEBEL_75" | "BATA_MERAH"
                          )
                        }
                        className={`p-3 rounded-xl border text-left transition ${
                          brickType === b.id
                            ? "border-amber-500 bg-amber-50 text-slate-950 ring-2 ring-amber-500/20"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="font-bold text-xs">{b.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {b.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Ukuran Dinding */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Total Panjang Dinding (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={wallLength}
                      onChange={(e) =>
                        setWallLength(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tinggi Dinding (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={wallHeight}
                      onChange={(e) =>
                        setWallHeight(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Potongan Pintu/Jendela (m²)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={wallOpeningArea}
                      onChange={(e) =>
                        setWallOpeningArea(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Opsi Plester & Acian */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePlaster}
                        onChange={(e) => setIncludePlaster(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Hitung Sekalian Material Plesteran & Acian
                      </span>
                    </label>
                  </div>

                  {includePlaster && (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs text-slate-600 font-medium">
                        Jumlah Sisi Dinding:
                      </span>
                      <button
                        type="button"
                        onClick={() => setPlasterSides(2)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          plasterSides === 2
                            ? "bg-slate-900 text-white"
                            : "bg-white border border-slate-200 text-slate-700"
                        }`}
                      >
                        2 Sisi (Luar & Dalam)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlasterSides(1)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          plasterSides === 1
                            ? "bg-slate-900 text-white"
                            : "bg-white border border-slate-200 text-slate-700"
                        }`}
                      >
                        1 Sisi Saja
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. FORM KERAMIK */}
            {activeTab === "KERAMIK" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    🔲 Kalkulator Keramik & Granit Lantai/Dinding
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hitung kebutuhan jumlah Dus keramik/granit, jumlah kepingan,
                    hingga semen dan nat keramik.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Panjang Ruangan (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={tileLength}
                      onChange={(e) => {
                        setTileCustomArea("");
                        setTileLength(Math.max(0, Number(e.target.value)));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Lebar Ruangan (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={tileWidth}
                      onChange={(e) => {
                        setTileCustomArea("");
                        setTileWidth(Math.max(0, Number(e.target.value)));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Atau Input Total Luas (m²)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder={`${(tileLength * tileWidth).toFixed(1)} m²`}
                      value={tileCustomArea}
                      onChange={(e) =>
                        setTileCustomArea(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Pilihan Ukuran Keramik */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Pilih Ukuran Keramik / Granit (cm):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "60x60", label: "60 × 60 cm", sub: "Granit (4 pcs / 1.44 m²)" },
                      { id: "80x80", label: "80 × 80 cm", sub: "Granit Besar (3 pcs / 1.92 m²)" },
                      { id: "50x50", label: "50 × 50 cm", sub: "Keramik (4 pcs / 1.0 m²)" },
                      { id: "40x40", label: "40 × 40 cm", sub: "Keramik (6 pcs / 0.96 m²)" },
                      { id: "30x30", label: "30 × 30 cm", sub: "Keramik (11 pcs / 0.99 m²)" },
                      { id: "25x40", label: "25 × 40 cm", sub: "Dinding KM (10 pcs / 1.0 m²)" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTileSize(t.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          tileSize === t.id
                            ? "border-amber-500 bg-amber-50 text-slate-950 ring-2 ring-amber-500/20"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="font-bold text-xs">{t.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {t.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toleransi Potong */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Cadangan Potong / Waste Lapangan:
                  </label>
                  <div className="flex items-center gap-2">
                    {[5, 10].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setTileWaste(w)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                          tileWaste === w
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        +{w}% ({w === 5 ? "Pola Lurus Standar" : "Pola Diagonal / Banyak Sudut"})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. FORM COR BETON */}
            {activeTab === "BETON" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    🏗️ Kalkulator Cor Beton (Dak, Sloof, Kolom, Jalan)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hitung volume kubikasi beton ($m^3$) beserta takaran semen,
                    pasir beton, dan batu split sesuai mutu SNI.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Panjang Cor (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={concreteLength}
                      onChange={(e) =>
                        setConcreteLength(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Lebar Cor (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={concreteWidth}
                      onChange={(e) =>
                        setConcreteWidth(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tebal Cor (cm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={concreteThickCm}
                      onChange={(e) =>
                        setConcreteThickCm(Math.max(1, Number(e.target.value)))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Pilih Mutu Beton (SNI):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        id: "K175",
                        title: "Mutu K-175 (Campuran 1 : 2 : 3)",
                        sub: "Lantai kerja, rabat beton, carport ringan",
                      },
                      {
                        id: "K225",
                        title: "Mutu K-225 (Standar Struktural)",
                        sub: "Dak rumah 2 lantai, sloof, kolom, balok",
                      },
                      {
                        id: "K250",
                        title: "Mutu K-250 (Struktural Menengah)",
                        sub: "Dak bentang lebar, pondasi cakar ayam",
                      },
                      {
                        id: "K300",
                        title: "Mutu K-300 (Struktural Berat)",
                        sub: "Jalan lingkungan, beban kendaraan berat",
                      },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() =>
                          setConcreteGrade(
                            g.id as "K175" | "K225" | "K250" | "K300"
                          )
                        }
                        className={`p-3 rounded-xl border text-left transition ${
                          concreteGrade === g.id
                            ? "border-amber-500 bg-amber-50 text-slate-950 ring-2 ring-amber-500/20"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="font-bold text-xs">{g.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {g.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">
                    Kemasan Sak Semen:
                  </span>
                  {[50, 40].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setCementBagWeight(w as 40 | 50)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                        cementBagWeight === w
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Sak {w} Kg
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. FORM CAT TEMBOK */}
            {activeTab === "CAT" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    🎨 Kalkulator Cat Tembok & Sealer
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hitung kebutuhan liter cat tembok dan konversi otomatis ke
                    kemasan Kaleng Galon (5 kg) atau Pail Besar (25 kg).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Total Panjang Dinding (m)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={paintLength}
                      onChange={(e) =>
                        setPaintLength(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tinggi Dinding (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={paintHeight}
                      onChange={(e) =>
                        setPaintHeight(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Sisi Pengecatan:
                    </label>
                    <div className="flex gap-2">
                      {[1, 2].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPaintSides(s as 1 | 2)}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                            paintSides === s
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {s} Sisi {s === 2 ? "(Bolak-balik)" : ""}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Jumlah Lapisan Cat:
                    </label>
                    <div className="flex gap-2">
                      {[2, 3].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPaintCoats(c as 2 | 3)}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                            paintCoats === c
                              ? "bg-amber-500 text-slate-950 border-amber-500"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {c} Lapis {c === 2 ? "(Standar)" : "(Maksimal)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. FORM ATAP & PLAFON */}
            {activeTab === "ATAP_PLAFON" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      🏠 Kalkulator Atap Baja Ringan & Plafon
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Estimasi kebutuhan rangka atap baja ringan atau plafon
                      gypsum beserta rangka hollow.
                    </p>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setRoofSubType("ATAP")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        roofSubType === "ATAP"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600"
                      }`}
                    >
                      Rangka Atap
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoofSubType("PLAFON")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        roofSubType === "PLAFON"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600"
                      }`}
                    >
                      Plafon Gypsum
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Panjang Bangunan / Ruangan (m)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={roofLength}
                      onChange={(e) =>
                        setRoofLength(Math.max(1, Number(e.target.value)))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Lebar Bangunan / Ruangan (m)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={roofWidth}
                      onChange={(e) =>
                        setRoofWidth(Math.max(1, Number(e.target.value)))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                {roofSubType === "ATAP" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Lebar Overstek / Tritisan (m)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={roofOverstek}
                          onChange={(e) =>
                            setRoofOverstek(Math.max(0, Number(e.target.value)))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Sudut Kemiringan Atap (°)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="5"
                          max="60"
                          value={roofPitchDeg}
                          onChange={(e) =>
                            setRoofPitchDeg(
                              Math.min(60, Math.max(5, Number(e.target.value)))
                            )
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Jenis Penutup Atap:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          { id: "SPANDEK", label: "Atap Spandek / Alderon" },
                          { id: "GENTENG_METAL", label: "Genteng Metal Pasir" },
                          { id: "GENTENG_KERAMIK", label: "Genteng Keramik / Beton" },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              setRoofCoverType(
                                c.id as
                                  | "SPANDEK"
                                  | "GENTENG_METAL"
                                  | "GENTENG_KERAMIK"
                              )
                            }
                            className={`p-3 rounded-xl border text-xs font-bold transition ${
                              roofCoverType === c.id
                                ? "border-amber-500 bg-amber-50 text-slate-950"
                                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 6. FORM BESI BETON */}
            {activeTab === "BESI" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      🔩 Kalkulator Besi Beton & Begel (SNI)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hitung berat besi beton per batang (12m) atau jumlah
                      batang tulangan sloof & kolom.
                    </p>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setRebarMode("WEIGHT")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        rebarMode === "WEIGHT"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600"
                      }`}
                    >
                      Cek Berat SNI
                    </button>
                    <button
                      type="button"
                      onClick={() => setRebarMode("SLOOF_KOLOM")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        rebarMode === "SLOOF_KOLOM"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600"
                      }`}
                    >
                      Hitung Sloof/Kolom
                    </button>
                  </div>
                </div>

                {/* Pilihan Diameter Besi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Pilih Diameter Besi Beton (mm):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[6, 8, 10, 12, 13, 16, 19].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setRebarDiameter(d)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition ${
                          rebarDiameter === d
                            ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Ø {d} mm
                      </button>
                    ))}
                  </div>
                </div>

                {rebarMode === "WEIGHT" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Jumlah Batang Besi (Panjang Standar 12 Meter)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={rebarCount}
                      onChange={(e) =>
                        setRebarCount(Math.max(1, Number(e.target.value)))
                      }
                      className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Total Panjang Sloof / Kolom (m)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={structureLength}
                        onChange={(e) =>
                          setStructureLength(Math.max(1, Number(e.target.value)))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Jumlah Tulangan Pokok (Jalur)
                      </label>
                      <select
                        value={mainBarCount}
                        onChange={(e) => setMainBarCount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm bg-white outline-none"
                      >
                        <option value={4}>4 Batang (Standar Praktis)</option>
                        <option value={6}>6 Batang (2 Lantai)</option>
                        <option value={8}>8 Batang (Kolom Utama)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Ukuran Penampang L × T (cm)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="10"
                          value={sectionWidthCm}
                          onChange={(e) =>
                            setSectionWidthCm(Number(e.target.value))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm"
                        />
                        <span className="font-bold text-slate-400">×</span>
                        <input
                          type="number"
                          min="10"
                          value={sectionHeightCm}
                          onChange={(e) =>
                            setSectionHeightCm(Number(e.target.value))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Jarak Cincin Begel (cm)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={stirrupSpacingCm}
                        onChange={(e) =>
                          setStirrupSpacingCm(Number(e.target.value))
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info Catatan Koefisien SNI */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Catatan Teknis:</strong> Perhitungan ini mengacu pada
                koefisien <strong>SNI (Standar Nasional Indonesia)</strong>{" "}
                dengan toleransi waste wajar lapangan. Kebutuhan riil dapat
                sedikit bervariasi mengikuti kondisi permukaan & metode tukang.
              </div>
            </div>
          </div>

          {/* ===================================================
              KOLOM KANAN: HASIL PERHITUNGAN MATERIAL
              =================================================== */}
          <div className="lg:col-span-5 bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      Hasil Estimasi Material
                    </div>
                    <div className="text-base font-extrabold text-white">
                      Rincian Kebutuhan Belanja
                    </div>
                  </div>
                </div>
              </div>

              {/* HASIL 1: DINDING */}
              {activeTab === "DINDING" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">
                        Luas Bersih Dinding
                      </div>
                      <div className="text-xl font-extrabold text-white">
                        {wallResult.netArea} m²
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      Luas Kotor: {wallResult.grossArea} m²
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <div className="text-xs text-amber-300 font-semibold">
                      Kebutuhan Bata / Hebel (+Waste):
                    </div>
                    <div className="text-2xl font-extrabold text-amber-400 mt-0.5">
                      {wallResult.brickCount.toLocaleString("id-ID")}{" "}
                      <span className="text-sm font-bold text-amber-200">
                        {wallResult.brickUnitLabel}
                      </span>
                    </div>
                    {wallResult.brickKubik > 0 && (
                      <div className="text-xs text-amber-200/80 mt-1">
                        Setara ± <strong>{wallResult.brickKubik} m³</strong>{" "}
                        (Kubik) Bata Ringan
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">
                        {wallResult.mortarTypeLabel}
                      </div>
                      <div className="text-lg font-extrabold text-white mt-0.5">
                        {wallResult.mortarCementBags} Sak
                      </div>
                    </div>

                    {includePlaster && (
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Semen Plester ({plasterSides} Sisi)
                        </div>
                        <div className="text-lg font-extrabold text-white mt-0.5">
                          {wallResult.plasterCementBags} Sak{" "}
                          <span className="text-xs font-normal text-slate-400">
                            (50kg)
                          </span>
                        </div>
                      </div>
                    )}

                    {includePlaster && (
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Semen Acian Halus
                        </div>
                        <div className="text-lg font-extrabold text-white mt-0.5">
                          {wallResult.acianCementBags} Sak{" "}
                          <span className="text-xs font-normal text-slate-400">
                            (50kg)
                          </span>
                        </div>
                      </div>
                    )}

                    {wallResult.totalSandM3 > 0 && (
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Pasir Pasang / Plester
                        </div>
                        <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                          ± {wallResult.totalSandM3} m³
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* HASIL 2: KERAMIK */}
              {activeTab === "KERAMIK" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <div className="text-xs text-amber-300 font-semibold">
                      Total Kebutuhan Keramik / Granit ({tileSize} cm):
                    </div>
                    <div className="text-3xl font-extrabold text-amber-400 mt-0.5">
                      {tileResult.totalBoxes} Dus
                    </div>
                    <div className="text-xs text-amber-200/80 mt-1">
                      Total <strong>{tileResult.totalPieces} Keping</strong>{" "}
                      (Isi {tileResult.pcsPerBox} pcs/dus • Termasuk +{tileWaste}%
                      cadangan)
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">
                        Semen Pasang
                      </div>
                      <div className="text-base font-extrabold text-white mt-1">
                        {tileResult.cementBags50kg} Sak
                      </div>
                      <div className="text-[10px] text-slate-500">Sak 50kg</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">
                        Pasir Pasang
                      </div>
                      <div className="text-base font-extrabold text-emerald-400 mt-1">
                        {tileResult.sandM3} m³
                      </div>
                      <div className="text-[10px] text-slate-500">Kubik</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">
                        Semen Nat
                      </div>
                      <div className="text-base font-extrabold text-white mt-1">
                        {tileResult.groutKg} Bks
                      </div>
                      <div className="text-[10px] text-slate-500">@ 1 Kg</div>
                    </div>
                  </div>
                </div>
              )}

              {/* HASIL 3: COR BETON */}
              {activeTab === "BETON" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <div className="text-xs text-amber-300 font-semibold">
                      Volume Kubikasi Cor Beton:
                    </div>
                    <div className="text-3xl font-extrabold text-amber-400 mt-0.5">
                      {concreteResult.volumeM3} m³
                    </div>
                    <div className="text-xs text-amber-200/80 mt-1">
                      {concreteResult.gradeLabel}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">
                        Semen ({cementBagWeight}kg)
                      </div>
                      <div className="text-lg font-extrabold text-white mt-1">
                        {concreteResult.totalCementBags} Sak
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ({concreteResult.totalCementKg} Kg)
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">
                        Pasir Beton
                      </div>
                      <div className="text-lg font-extrabold text-emerald-400 mt-1">
                        {concreteResult.totalSandM3} m³
                      </div>
                      <div className="text-[10px] text-slate-500">Kubik</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">
                        Batu Split
                      </div>
                      <div className="text-lg font-extrabold text-sky-400 mt-1">
                        {concreteResult.totalSplitM3} m³
                      </div>
                      <div className="text-[10px] text-slate-500">Kerikil</div>
                    </div>
                  </div>
                </div>
              )}

              {/* HASIL 4: CAT TEMBOK */}
              {activeTab === "CAT" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">
                        Total Luas Bidang Cat
                      </div>
                      <div className="text-xl font-extrabold text-white">
                        {paintResult.areaM2} m²
                      </div>
                    </div>
                    <div className="text-right text-xs text-amber-400 font-bold">
                      {paintCoats} Lapis Cat Akhir
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="text-xs text-amber-300 font-semibold">
                      Kebutuhan Cat Tembok (± {paintResult.litersNeeded} Liter):
                    </div>
                    <div className="text-2xl font-extrabold text-amber-400">
                      {paintResult.gallonsOnly} Kaleng Galon{" "}
                      <span className="text-xs font-normal text-amber-200">
                        (Uk. 2.5L / 5Kg)
                      </span>
                    </div>
                    {paintResult.pailsCount > 0 && (
                      <div className="text-xs text-white bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        💡 <strong>Lebih Hemat Pail Besar:</strong> Beli{" "}
                        <strong className="text-amber-400">
                          {paintResult.pailsCount} Pail (20L/25Kg)
                        </strong>
                        {paintResult.remainingGallons > 0
                          ? ` + ${paintResult.remainingGallons} Galon (5Kg)`
                          : ""}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">
                        Cat Dasar (Alkali Sealer - 1 Lapis)
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {paintResult.sealerGallons} Galon{" "}
                        <span className="text-xs font-normal text-slate-400">
                          (± {paintResult.sealerLiters} Liter)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HASIL 5: ATAP & PLAFON */}
              {activeTab === "ATAP_PLAFON" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <div className="text-xs text-amber-300 font-semibold">
                      {roofSubType === "ATAP"
                        ? `Estimasi Luas Miring Atap (${roofPitchDeg}°):`
                        : "Luas Area Plafon:"}
                    </div>
                    <div className="text-2xl font-extrabold text-amber-400 mt-0.5">
                      {roofResult.slopeArea} m²
                    </div>
                  </div>

                  {roofSubType === "ATAP" ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Kanal C75 Baja Ringan
                        </div>
                        <div className="text-lg font-extrabold text-white mt-0.5">
                          {roofResult.kanalCBars} Btg
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Panjang 6m
                        </div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Reng Baja Ringan
                        </div>
                        <div className="text-lg font-extrabold text-white mt-0.5">
                          {roofResult.rengBars} Btg
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Panjang 6m
                        </div>
                      </div>
                      <div className="col-span-2 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Kebutuhan Penutup Atap
                        </div>
                        <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                          {roofResult.coverCount} {roofResult.coverUnit}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="col-span-2 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Papan Gypsum / PVC (Uk. 120×240 cm)
                        </div>
                        <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                          {roofResult.gypsumSheets} Lembar
                        </div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Hollow 4×4 (4m)
                        </div>
                        <div className="text-lg font-extrabold text-white mt-0.5">
                          {roofResult.hollow4x4} Batang
                        </div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Hollow 2×4 (4m)
                        </div>
                        <div className="text-lg font-extrabold text-white mt-0.5">
                          {roofResult.hollow2x4} Batang
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* HASIL 6: BESI BETON */}
              {activeTab === "BESI" && (
                <div className="space-y-3">
                  {rebarMode === "WEIGHT" ? (
                    <>
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                        <div className="text-xs text-amber-300 font-semibold">
                          Total Berat Besi Ø{rebarDiameter}mm ({rebarCount}{" "}
                          Batang):
                        </div>
                        <div className="text-3xl font-extrabold text-amber-400 mt-0.5">
                          {rebarResult.totalWeightKg} Kg
                        </div>
                        <div className="text-xs text-amber-200/80 mt-1">
                          Berat SNI per Batang (12m):{" "}
                          <strong>{rebarResult.weightPerBar12m} Kg</strong> (
                          {rebarResult.weightPerMeter} kg/m)
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                        <div className="text-xs text-amber-300 font-semibold">
                          Besi Tulangan Pokok (Ø{rebarDiameter}mm -{" "}
                          {mainBarCount} Jalur):
                        </div>
                        <div className="text-2xl font-extrabold text-amber-400 mt-0.5">
                          {rebarResult.mainBars12m} Batang{" "}
                          <span className="text-xs font-normal text-amber-200">
                            (Panjang 12m)
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                          <div className="text-[11px] text-slate-400">
                            Besi Begel Ø8mm (Jarak {stirrupSpacingCm}cm)
                          </div>
                          <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                            {rebarResult.stirrupBars12m} Batang
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Jadi {rebarResult.totalStirrupsCount} cincin
                          </div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                          <div className="text-[11px] text-slate-400">
                            Kawat Bendrat Ikat
                          </div>
                          <div className="text-lg font-extrabold text-white mt-0.5">
                            ± {rebarResult.bendratWireKg} Kg
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Kawat Beton
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* TOMBOL AKSI BAWAH (SALIN & KONSULTASI WA) */}
            <div className="pt-6 mt-6 border-t border-slate-800 space-y-2.5">
              <button
                type="button"
                onClick={handleCopySummary}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">
                      Rincian Material Tersalin!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>Salin Rincian Kebutuhan Material</span>
                  </>
                )}
              </button>

              {mode === "PUBLIC" && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Konsultasikan Hasil Ini via WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
