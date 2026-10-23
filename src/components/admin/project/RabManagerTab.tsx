"use client";

import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Edit3,
  FileUp,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import CurrencyInput from "@/components/ui/CurrencyInput";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function RabManagerTab({
  project,
  masterItems,
  masterCategories,
  companyProfile,
  onRefresh,
}: {
  project: any;
  masterItems: any[];
  masterCategories: any[];
  companyProfile: any;
  onRefresh: () => void;
}) {
  // State Form Tambah Item RAB
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    project.rabCategories[0]?.id || ""
  );
  const [description, setDescription] = useState("");
  const [volume, setVolume] = useState<number>(1);
  const [unit, setUnit] = useState("m2");
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState("");

  // State Pencarian Pintar (Autocomplete) Master Harga Satuan (2.667 item)
  const [masterSearch, setMasterSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // State Pencarian di dalam Tabel RAB Proyek
  const [rabTableSearch, setRabTableSearch] = useState("");

  // State CRUD Kategori Bab RAB
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");

  // State Edit Inline Item RAB
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemDesc, setEditItemDesc] = useState("");
  const [editItemVol, setEditItemVol] = useState<number>(1);
  const [editItemUnit, setEditItemUnit] = useState("m2");
  const [editItemPrice, setEditItemPrice] = useState<number>(0);

  // Filter maksimal 15 hasil teratas saat mengetik di kotak pencarian Master AHSP
  const matchingMasterItems = useMemo(() => {
    const q = masterSearch.toLowerCase().trim();
    if (!q) return masterItems.slice(0, 12);
    return masterItems
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.code && m.code.toLowerCase().includes(q)) ||
          (m.workGroup && m.workGroup.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [masterItems, masterSearch]);

  const handlePickMasterItem = (found: any) => {
    setDescription(found.name);
    setUnit(found.unit);
    setUnitPrice(Number(found.defaultPrice));
    setMasterSearch(`${found.code ? `[${found.code}] ` : ""}${found.name}`);
    setShowSuggestions(false);
    toast.success("Item dari Master Harga Satuan diterapkan ke form!");
  };

  const handleAddRabItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const targetCatId = selectedCategoryId || project.rabCategories[0]?.id;
    if (!targetCatId) {
      setErrorMsg("Buat minimal 1 Bab Kategori Pekerjaan terlebih dahulu.");
      return;
    }

    const res = await fetch(`/api/projects/${project.id}/rab`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: targetCatId,
        description,
        volume,
        unit,
        unitPrice,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setErrorMsg(err.error || "Gagal menyimpan item RAB");
      toast.error(err.error || "Gagal menyimpan item RAB");
      return;
    }

    setDescription("");
    setMasterSearch("");
    setVolume(1);
    toast.success("Item pekerjaan berhasil ditambahkan ke RAB!");
    onRefresh();
  };

  const handleAddCategory = async (nameToCreate: string) => {
    if (!nameToCreate.trim()) return;
    setErrorMsg("");
    const res = await fetch(`/api/projects/${project.id}/rab`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "ADD_CATEGORY",
        name: nameToCreate.toUpperCase(),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setErrorMsg(err.error || "Gagal menambah bab kategori");
      toast.error(err.error || "Gagal menambah bab kategori");
      return;
    }

    setNewCatName("");
    toast.success(`Bab "${nameToCreate.toUpperCase()}" berhasil ditambahkan!`);
    onRefresh();
  };

  const handleSaveCategoryEdit = async (categoryId: string, sortOrder: number) => {
    await fetch(`/api/projects/${project.id}/rab`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "UPDATE_CATEGORY",
        categoryId,
        name: editCatName,
        sortOrder,
      }),
    });
    setEditingCatId(null);
    toast.success("Nama bab kategori berhasil diperbarui!");
    onRefresh();
  };

  const handleMoveCategory = async (cat: any, direction: "UP" | "DOWN") => {
    const newOrder =
      direction === "UP"
        ? Math.max(1, (cat.sortOrder || 1) - 1)
        : (cat.sortOrder || 1) + 1;

    await fetch(`/api/projects/${project.id}/rab`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "UPDATE_CATEGORY",
        categoryId: cat.id,
        name: cat.name,
        sortOrder: newOrder,
      }),
    });
    toast.success("Urutan bab kategori diperbarui!");
    onRefresh();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    await fetch(`/api/projects/${project.id}/rab?categoryId=${categoryId}`, {
      method: "DELETE",
    });
    toast.success("Bab kategori RAB dihapus.");
    onRefresh();
  };

  const startEditItem = (item: any) => {
    setEditingItemId(item.id);
    setEditItemDesc(item.description);
    setEditItemVol(Number(item.volume));
    setEditItemUnit(item.unit);
    setEditItemPrice(Number(item.unitPrice));
  };

  const handleSaveItemEdit = async (itemId: string) => {
    await fetch(`/api/projects/${project.id}/rab`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "UPDATE_ITEM",
        itemId,
        description: editItemDesc,
        volume: editItemVol,
        unit: editItemUnit,
        unitPrice: editItemPrice,
      }),
    });
    setEditingItemId(null);
    toast.success("Baris item RAB berhasil diperbarui!");
    onRefresh();
  };

  const handleDeleteRabItem = async (itemId: string) => {
    await fetch(`/api/projects/${project.id}/rab?itemId=${itemId}`, {
      method: "DELETE",
    });
    toast.success("Baris item RAB dihapus.");
    onRefresh();
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonRows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

    const normalizedRows = jsonRows
      .map((r) => ({
        description:
          r["Uraian Pekerjaan"] ||
          r["Uraian"] ||
          r["Pekerjaan"] ||
          r["Deskripsi"] ||
          Object.values(r)[0],
        volume: r["Volume"] || r["Vol"] || r["Qty"] || 0,
        unit: r["Satuan"] || r["Sat"] || r["Unit"] || "ls",
        unitPrice: r["Harga Satuan"] || r["Harga"] || r["Unit Price"] || 0,
      }))
      .filter((r) => r.description);

    await fetch(`/api/projects/${project.id}/rab`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "EXCEL_IMPORT",
        rows: normalizedRows,
      }),
    });

    e.target.value = "";
    toast.success("File Excel RAB berhasil diimpor ke proyek!");
    onRefresh();
  };

  const handleExportExcel = () => {
    const rows: any[] = [];
    project.rabCategories.forEach((cat: any) => {
      rows.push({
        "Uraian Pekerjaan": cat.name,
        Volume: "",
        Satuan: "",
        "Harga Satuan": "",
        "Jumlah Harga": "",
      });
      cat.items.forEach((item: any) => {
        rows.push({
          "Uraian Pekerjaan": item.description,
          Volume: Number(item.volume),
          Satuan: item.unit,
          "Harga Satuan": Number(item.unitPrice),
          "Jumlah Harga": Number(item.totalPrice),
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RAB Proyek");
    XLSX.writeFile(wb, `RAB-${project.slug}.xlsx`);
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
    <div className="space-y-6">
      {errorMsg && (
        <div className="no-print p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {/* Toolbar Input RAB & Kelola Bab Kategori */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 mb-4">
            + Tambah Item Pekerjaan ke RAB
          </h3>

          <form onSubmit={handleAddRabItem} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  1. Pilih Bab Kategori Pekerjaan
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  {project.rabCategories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Searchable Combobox untuk 2.667 Item Master Harga Satuan */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  2. Cari di Master Harga Satuan ({masterItems.length} Item AHSP)
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-amber-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ketik kata kunci (mis: bata ringan, beton, pagar)..."
                    value={masterSearch}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setMasterSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    className="w-full pl-8 pr-8 py-2 rounded-xl border border-amber-300 bg-amber-50/40 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {masterSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setMasterSearch("");
                        setShowSuggestions(false);
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {showSuggestions && (
                  <div className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white rounded-xl border border-slate-300 shadow-2xl divide-y divide-slate-100">
                    {matchingMasterItems.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">
                        Tidak ditemukan item yang cocok
                      </div>
                    ) : (
                      matchingMasterItems.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handlePickMasterItem(m)}
                          className="w-full text-left p-2.5 hover:bg-amber-50 transition flex items-start justify-between gap-2"
                        >
                          <div className="text-xs">
                            <span className="font-mono text-[10px] text-slate-500 block">
                              {m.code || "-"} • {m.workGroup}
                            </span>
                            <span className="font-semibold text-slate-900 line-clamp-2">
                              {m.name}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-amber-700 block">
                              {formatRupiah(Number(m.defaultPrice))}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              per {m.unit}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Uraian Pekerjaan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pasang Dinding Bata Ringan 10cm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Volume
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Satuan
                </label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs text-center"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Harga Satuan
                </label>
                <CurrencyInput
                  value={unitPrice}
                  onChange={setUnitPrice}
                  required
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500">
                Subtotal Baris:{" "}
                <strong className="text-slate-900">
                  {formatRupiah(volume * unitPrice)}
                </strong>
              </span>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Masukkan ke Tabel RAB</span>
              </button>
            </div>
          </form>
        </div>

        {/* Panel Bab Kategori & Import/Export Excel */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900">
              Kelola Bab Kategori & Excel (.xlsx)
            </h3>

            {masterCategories.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Tambah Cepat dari Template Master Kategori ({masterCategories.length} Bab):
                </label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddCategory(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  <option value="">-- Pilih Bab Kategori Standar --</option>
                  {masterCategories.map((mc: any) => (
                    <option key={mc.id} value={mc.name}>
                      + {mc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddCategory(newCatName);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Ketik Bab Baru (mis: V. PEK. ATAP)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0"
              >
                + Bab
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            <label className="w-full cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow">
              <FileUp className="w-4 h-4" />
              <span>Import File Excel RAB (.xlsx)</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleExportExcel}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download RAB ke Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lembar Dokumen RAB (Siap Cetak PDF Ber-Kop Surat) */}
      <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200">
        {/* Search Bar di dalam Tabel RAB (Tidak ikut tercetak saat Print PDF) */}
        <div className="no-print mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari item pekerjaan di dalam tabel RAB ini..."
              value={rabTableSearch}
              onChange={(e) => setRabTableSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <span className="text-xs text-slate-500">
            Total Anggaran: <strong className="text-slate-900">{formatRupiah(totalRab)}</strong>
          </span>
        </div>

        {/* Kop Surat Resmi */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5 mb-6">
          <div className="flex items-center gap-4">
            {(companyProfile?.letterheadLogoUrl || companyProfile?.logoUrl) && (
              <img
                src={
                  companyProfile.letterheadLogoUrl || companyProfile.logoUrl
                }
                alt="Logo Kop Surat"
                className="h-16 w-16 object-contain"
              />
            )}
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 uppercase">
                {companyProfile?.companyName || "KARYA BANGUN MANDIRI"}
              </h2>
              <p className="text-xs text-slate-600">{companyProfile?.tagline}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {companyProfile?.address} • Telp/WA:{" "}
                {companyProfile?.whatsappNumber}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-extrabold uppercase tracking-wider bg-slate-900 text-amber-400 px-3 py-1 rounded">
              RENCANA ANGGARAN BIAYA (RAB)
            </span>
            <p className="text-xs text-slate-600 mt-2">
              Proyek: <strong>{project.title}</strong>
            </p>
            <p className="text-xs text-slate-500">
              Lokasi: {project.location} ({project.buildingArea} m²)
            </p>
          </div>
        </div>

        {/* Tabel RAB */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-3 px-4">Uraian Pekerjaan</th>
                <th className="py-3 px-4 text-right">Volume</th>
                <th className="py-3 px-4 text-center">Satuan</th>
                <th className="py-3 px-4 text-right">Harga Satuan (Rp)</th>
                <th className="py-3 px-4 text-right">Jumlah Harga (Rp)</th>
                <th className="no-print py-3 px-3 text-center w-32">Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {project.rabCategories.map((cat: any) => {
                const q = rabTableSearch.toLowerCase().trim();
                const visibleItems = q
                  ? cat.items.filter((i: any) =>
                      i.description.toLowerCase().includes(q)
                    )
                  : cat.items;

                if (q && visibleItems.length === 0 && !cat.name.toLowerCase().includes(q)) {
                  return null;
                }

                const subTotal = cat.items.reduce(
                  (s: number, i: any) => s + Number(i.totalPrice),
                  0
                );
                const isEditingCat = editingCatId === cat.id;

                return (
                  <React.Fragment key={cat.id}>
                    <tr className="bg-slate-100 font-extrabold text-slate-900">
                      <td colSpan={4} className="py-2.5 px-4">
                        {isEditingCat ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editCatName}
                              onChange={(e) => setEditCatName(e.target.value)}
                              className="px-2.5 py-1 rounded-lg border border-amber-500 text-xs font-bold w-full max-w-md"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleSaveCategoryEdit(cat.id, cat.sortOrder)
                              }
                              className="p-1.5 rounded bg-emerald-600 text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatId(null)}
                              className="p-1.5 rounded bg-slate-300 text-slate-700"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span>{cat.name}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {formatRupiah(subTotal)}
                      </td>
                      <td className="no-print py-2 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(cat, "UP")}
                            className="p-1 rounded hover:bg-slate-200 text-slate-600"
                            title="Geser Bab ke Atas"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(cat, "DOWN")}
                            className="p-1 rounded hover:bg-slate-200 text-slate-600"
                            title="Geser Bab ke Bawah"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditCatName(cat.name);
                            }}
                            className="p-1 rounded hover:bg-slate-200 text-blue-600"
                            title="Ubah Nama Bab Kategori"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 rounded hover:bg-rose-100 text-rose-600"
                            title="Hapus Bab Kategori beserta isinya"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {visibleItems.map((item: any) => {
                      const isEditingItem = editingItemId === item.id;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 text-slate-800">
                            {isEditingItem ? (
                              <input
                                type="text"
                                value={editItemDesc}
                                onChange={(e) => setEditItemDesc(e.target.value)}
                                className="w-full px-2 py-1 rounded border border-amber-400 text-xs"
                              />
                            ) : (
                              item.description
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium">
                            {isEditingItem ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editItemVol}
                                onChange={(e) =>
                                  setEditItemVol(Number(e.target.value))
                                }
                                className="w-20 px-2 py-1 rounded border border-amber-400 text-xs text-right"
                              />
                            ) : (
                              Number(item.volume)
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center text-slate-500">
                            {isEditingItem ? (
                              <input
                                type="text"
                                value={editItemUnit}
                                onChange={(e) => setEditItemUnit(e.target.value)}
                                className="w-14 px-2 py-1 rounded border border-amber-400 text-xs text-center"
                              />
                            ) : (
                              item.unit
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-600">
                            {isEditingItem ? (
                              <div className="w-36 ml-auto">
                                <CurrencyInput
                                  value={editItemPrice}
                                  onChange={setEditItemPrice}
                                />
                              </div>
                            ) : (
                              formatRupiah(Number(item.unitPrice))
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                            {formatRupiah(
                              isEditingItem
                                ? editItemVol * editItemPrice
                                : Number(item.totalPrice)
                            )}
                          </td>
                          <td className="no-print py-2.5 px-3 text-center">
                            {isEditingItem ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveItemEdit(item.id)}
                                  className="p-1 rounded bg-emerald-600 text-white"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingItemId(null)}
                                  className="p-1 rounded bg-slate-200 text-slate-700"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => startEditItem(item)}
                                  className="text-slate-500 hover:text-blue-600 p-1"
                                  title="Edit Baris"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRabItem(item.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                  title="Hapus Baris"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-extrabold text-base">
                <td colSpan={4} className="py-4 px-4 text-right">
                  TOTAL ESTIMASI ANGGARAN BIAYA (RAB)
                </td>
                <td className="py-4 px-4 text-right text-amber-400">
                  {formatRupiah(totalRab)}
                </td>
                <td className="no-print" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
