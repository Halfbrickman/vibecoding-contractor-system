"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  FileSpreadsheet,
  Globe,
  ImagePlus,
  Layers,
  Printer,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import RabManagerTab from "@/components/admin/project/RabManagerTab";
import Media3DTab from "@/components/admin/project/Media3DTab";
import DocumentsRevitTab from "@/components/admin/project/DocumentsRevitTab";
import CashflowTerminTab from "@/components/admin/project/CashflowTerminTab";
import ComproShowcaseTab from "@/components/admin/project/ComproShowcaseTab";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ProjectDetailClient({
  project,
  masterItems,
  masterCategories,
  companyProfile,
}: {
  project: any;
  masterItems: any[];
  masterCategories: any[];
  companyProfile: any;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "RAB" | "MEDIA_3D" | "REVIT_DOC" | "CASHFLOW" | "COMPRO"
  >("RAB");
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteProject = async () => {
    const res = await fetch(`/api/projects?id=${project.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Proyek berhasil dihapus.");
      router.push("/admin");
      router.refresh();
    } else {
      toast.error("Gagal menghapus proyek.");
    }
  };

  const uploadFileToServer = async (file: File, folder: string) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      alert(data.error || "Gagal mengunggah file");
      return "";
    }
    return data.fileUrl as string;
  };

  const totalRab = project.rabCategories.reduce(
    (sum: number, cat: any) =>
      sum +
      cat.items.reduce(
        (iSum: number, item: any) => iSum + Number(item.totalPrice),
        0
      ),
    0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Action Bar (Disembunyikan saat Cetak PDF) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Proyek</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {project.title}
          </h1>
          <p className="text-xs text-slate-500">
            Lokasi: {project.location} • Luas Bangunan: {project.buildingArea} m² •
            Klien: <strong>{project.client?.name || "-"}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/portal/${project.shareToken}`}
            target="_blank"
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <span>Buka Portal Klien</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setActiveTab("RAB");
              setTimeout(() => window.print(), 150);
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Cetak PDF Penawaran RAB</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
            title="Hapus Proyek Ini"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">
              Hapus Proyek Ini?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seluruh data RAB, gambar render, dokumen, dan catatan keuangan pada proyek{" "}
              <strong>{project.title}</strong> akan dihapus permanen.
            </p>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigasi Tab Modul (Disembunyikan saat Cetak PDF) */}
      <div className="no-print flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("RAB")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "RAB"
              ? "bg-amber-500 text-slate-950 shadow"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>1. Smart RAB & Bab Kategori</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MEDIA_3D")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "MEDIA_3D"
              ? "bg-amber-500 text-slate-950 shadow"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ImagePlus className="w-4 h-4" />
          <span>2. Render 3D & 360° ({project.media.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("REVIT_DOC")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "REVIT_DOC"
              ? "bg-amber-500 text-slate-950 shadow"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. File 2D Revit & SketchUp ({project.documents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CASHFLOW")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "CASHFLOW"
              ? "bg-amber-500 text-slate-950 shadow"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>4. Nota, Termin & Progres</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("COMPRO")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "COMPRO"
              ? "bg-amber-500 text-slate-950 shadow"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>5. Tampilan Compro & Link WA Klien</span>
        </button>
      </div>

      {/* Render Komponen Tab Aktif */}
      {activeTab === "RAB" && (
        <RabManagerTab
          project={project}
          masterItems={masterItems}
          masterCategories={masterCategories}
          companyProfile={companyProfile}
          onRefresh={() => router.refresh()}
        />
      )}

      {activeTab === "MEDIA_3D" && (
        <Media3DTab
          project={project}
          onUploadFile={uploadFileToServer}
          uploading={uploading}
          onRefresh={() => router.refresh()}
        />
      )}

      {activeTab === "REVIT_DOC" && (
        <DocumentsRevitTab
          project={project}
          onUploadFile={uploadFileToServer}
          uploading={uploading}
          onRefresh={() => router.refresh()}
        />
      )}

      {activeTab === "CASHFLOW" && (
        <CashflowTerminTab
          project={project}
          totalRab={totalRab}
          onRefresh={() => router.refresh()}
        />
      )}

      {activeTab === "COMPRO" && (
        <ComproShowcaseTab
          project={project}
          onUploadFile={uploadFileToServer}
          uploading={uploading}
          onRefresh={() => router.refresh()}
        />
      )}
    </div>
  );
}
