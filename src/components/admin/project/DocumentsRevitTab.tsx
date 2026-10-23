"use client";

import React, { useState } from "react";
import { FileUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function DocumentsRevitTab({
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
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("REVIT_2D");
  const [docVersion, setDocVersion] = useState("Rev 01");
  const [docNotes, setDocNotes] = useState("");

  const handleAddDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileUrl = await onUploadFile(file, "documents");
    await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_DOCUMENT",
        title: docTitle || file.name,
        docType,
        version: docVersion,
        notes: docNotes,
        fileUrl,
      }),
    });
    setDocTitle("");
    setDocNotes("");
    toast.success("Dokumen teknis berhasil diunggah!");
    onRefresh();
  };

  const handleDeleteDoc = async (id: string) => {
    await fetch(`/api/projects/${project.id}/extras?target=document&id=${id}`, {
      method: "DELETE",
    });
    toast.success("Dokumen dihapus.");
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 mb-1">
          Upload Gambar Kerja 2D (Revit PDF/DWG) & Model 3D SketchUp (.skp)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Simpan semua revisi gambar kerja di satu tempat agar pelaksanaan di lapangan tidak salah versi gambar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Dokumen / Gambar Kerja
            </label>
            <input
              type="text"
              placeholder="Contoh: Denah Instalasi Listrik & Plumbing"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jenis File
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              <option value="REVIT_2D">Gambar Kerja 2D (Revit PDF/DWG)</option>
              <option value="SKETCHUP_3D">File 3D SketchUp (.skp)</option>
              <option value="RAB_EXCEL">File Master Excel (.xlsx)</option>
              <option value="CONTRACT_PDF">SPK / Kontrak Kerja</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor Revisi
            </label>
            <input
              type="text"
              placeholder="Rev 01 / Rev 02"
              value={docVersion}
              onChange={(e) => setDocVersion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow">
              <FileUp className="w-4 h-4 text-amber-400" />
              <span>{uploading ? "Mengunggah..." : "Upload Dokumen"}</span>
              <input
                type="file"
                onChange={handleAddDocument}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-200">
        {project.documents.map((doc: any) => (
          <div key={doc.id} className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-2">
                {doc.version}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {doc.docType}
              </span>
              <h4 className="font-bold text-sm text-slate-900 mt-1">
                {doc.title}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800"
              >
                Unduh File
              </a>
              <button
                type="button"
                onClick={() => handleDeleteDoc(doc.id)}
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"
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
