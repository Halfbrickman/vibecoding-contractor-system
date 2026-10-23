"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  Edit3,
  FileUp,
  ListChecks,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import CurrencyInput from "@/components/ui/CurrencyInput";

interface MasterItem {
  id: string;
  code: string | null;
  name: string;
  category: "PEKERJAAN" | "MATERIAL" | "UPAH";
  workGroup: string | null;
  unit: string;
  defaultPrice: string | number;
  notes: string | null;
}

interface MasterRabCategory {
  id: string;
  name: string;
  sortOrder: number;
  isDefault: boolean;
}

const PAGE_SIZE = 50;

export default function MasterItemsPage() {
  const [activeTab, setActiveTab] = useState<"ITEMS" | "CATEGORIES">("ITEMS");
  const [items, setItems] = useState<MasterItem[]>([]);
  const [categories, setCategories] = useState<MasterRabCategory[]>([]);
  const [filterCat, setFilterCat] = useState<string>("ALL");
  const [filterGroup, setFilterGroup] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [catSearchQuery, setCatSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [importingExcel, setImportingExcel] = useState(false);

  // State tambah MasterItem baru
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"PEKERJAAN" | "MATERIAL" | "UPAH">(
    "PEKERJAAN"
  );
  const [workGroup, setWorkGroup] = useState("");
  const [unit, setUnit] = useState("m2");
  const [defaultPrice, setDefaultPrice] = useState<number>(0);

  // State edit baris MasterItem
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editWorkGroup, setEditWorkGroup] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<
    "PEKERJAAN" | "MATERIAL" | "UPAH"
  >("PEKERJAAN");

  // State CRUD MasterRabCategory
  const [catName, setCatName] = useState("");
  const [catOrder, setCatOrder] = useState<number>(1);
  const [catIsDefault, setCatIsDefault] = useState<boolean>(true);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatOrder, setEditCatOrder] = useState<number>(1);
  const [editCatDefault, setEditCatDefault] = useState<boolean>(true);

  const fetchAll = async () => {
    const [resItems, resCats] = await Promise.all([
      fetch("/api/master-items"),
      fetch("/api/master-categories"),
    ]);
    const dataItems = await resItems.json();
    const dataCats = await resCats.json();
    setItems(dataItems);
    setCategories(dataCats);
    setCatOrder((dataCats?.length || 0) + 1);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Daftar unik kelompok bab pekerjaan untuk filter dropdown
  const uniqueGroups = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.workGroup) set.add(i.workGroup);
    });
    return Array.from(set);
  }, [items]);

  // Filter + Search untuk Katalog Harga Satuan
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      if (filterCat !== "ALL" && item.category !== filterCat) return false;
      if (filterGroup !== "ALL" && item.workGroup !== filterGroup) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        (item.workGroup && item.workGroup.toLowerCase().includes(q))
      );
    });
  }, [items, filterCat, filterGroup, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  // Filter + Search untuk Master Kategori Pekerjaan
  const filteredCategories = useMemo(() => {
    const q = catSearchQuery.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, catSearchQuery]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/master-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code || undefined,
        name,
        category,
        workGroup: workGroup || undefined,
        unit,
        defaultPrice,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Gagal menambah item");
      return;
    }
    setCode("");
    setName("");
    setDefaultPrice(0);
    toast.success("Item berhasil ditambahkan ke Master Harga Satuan!");
    fetchAll();
  };

  // Import Excel AHSP (.xlsx) langsung dari Browser
  const handleExcelMasterImport = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingExcel(true);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
        header: 1,
        defval: "",
      });

      const parsedCategories: string[] = [];
      const parsedItems: {
        code: string | null;
        name: string;
        workGroup: string;
        unit: string;
        defaultPrice: number;
        notes: string | null;
      }[] = [];

      let currentGroup = "1.1 PEKERJAAN PERSIAPAN";

      for (const r of rows) {
        const rowCode = String(r[1] ?? r[0] ?? "").trim();
        const desc = String(r[2] ?? r[1] ?? "").trim();
        const rowUnit = String(r[3] ?? r[2] ?? "").trim();
        const rowNotes = String(r[4] ?? "").trim();
        const rawPrice = Number(r[6] ?? r[4] ?? r[3] ?? 0);

        if (!desc || desc.toUpperCase() === "URAIAN PEKERJAAN") continue;

        const codeParts = rowCode.split(/[.,]/).filter(Boolean);
        if (
          !rowUnit &&
          (!rawPrice || isNaN(rawPrice)) &&
          rowCode &&
          codeParts.length <= 2
        ) {
          currentGroup = `${rowCode} ${desc.toUpperCase()}`
            .replace(/\s+/g, " ")
            .trim();
          if (!parsedCategories.includes(currentGroup)) {
            parsedCategories.push(currentGroup);
          }
          continue;
        }

        if (rowUnit && rawPrice > 0 && !isNaN(rawPrice)) {
          if (!parsedCategories.includes(currentGroup)) {
            parsedCategories.push(currentGroup);
          }
          parsedItems.push({
            code: rowCode || null,
            name: desc,
            workGroup: currentGroup,
            unit: rowUnit,
            defaultPrice: rawPrice,
            notes: rowNotes || null,
          });
        }
      }

      const res = await fetch("/api/master-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "EXCEL_IMPORT",
          clearExisting: true,
          categories: parsedCategories,
          items: parsedItems,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Berhasil mengimpor ${data.importedCount} item pekerjaan & ${parsedCategories.length} bab kategori dari Excel!`
        );
        setCurrentPage(1);
        fetchAll();
      } else {
        toast.error(data.error || "Gagal mengimpor file Excel");
      }
    } catch {
      toast.error("Format file Excel tidak dapat dibaca");
    } finally {
      setImportingExcel(false);
      e.target.value = "";
    }
  };

  const startEditItem = (item: MasterItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditWorkGroup(item.workGroup || "");
    setEditUnit(item.unit);
    setEditPrice(Number(item.defaultPrice));
    setEditCategory(item.category);
  };

  const handleSaveEditItem = async (id: string) => {
    await fetch("/api/master-items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: editName,
        workGroup: editWorkGroup || null,
        unit: editUnit,
        defaultPrice: editPrice,
        category: editCategory,
      }),
    });
    setEditingId(null);
    toast.success("Perubahan harga satuan berhasil disimpan!");
    fetchAll();
  };

  const handleDeleteItem = async (id: string) => {
    await fetch(`/api/master-items?id=${id}`, { method: "DELETE" });
    toast.success("Item dihapus dari Master Harga Satuan.");
    fetchAll();
  };

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/master-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: catName,
        sortOrder: catOrder,
        isDefault: catIsDefault,
      }),
    });
    setCatName("");
    toast.success("Master Kategori Pekerjaan RAB berhasil ditambahkan!");
    fetchAll();
  };

  const startEditCat = (cat: MasterRabCategory) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatOrder(cat.sortOrder);
    setEditCatDefault(cat.isDefault);
  };

  const handleSaveEditCat = async (id: string) => {
    await fetch("/api/master-categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: editCatName,
        sortOrder: editCatOrder,
        isDefault: editCatDefault,
      }),
    });
    setEditingCatId(null);
    toast.success("Master Kategori Pekerjaan berhasil diperbarui!");
    fetchAll();
  };

  const handleDeleteCat = async (id: string) => {
    await fetch(`/api/master-categories?id=${id}`, { method: "DELETE" });
    toast.success("Master Kategori Pekerjaan dihapus.");
    fetchAll();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-amber-500" />
            <span>Master Harga Satuan (AHSP) & Kategori Pekerjaan</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Database terpusat daftar harga satuan pekerjaan, material, upah, dan bab kategori RAB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow transition">
            <FileUp className="w-4 h-4" />
            <span>
              {importingExcel
                ? "Mengimpor Excel..."
                : "Import Excel Master AHSP (.xlsx)"}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelMasterImport}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setActiveTab("ITEMS")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "ITEMS"
                ? "bg-amber-500 text-slate-950 shadow"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>1. Katalog Harga ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CATEGORIES")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "CATEGORIES"
                ? "bg-amber-500 text-slate-950 shadow"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>2. Master Kategori Bab ({categories.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* TAB 1: KATALOG HARGA SATUAN                */}
      {/* ========================================== */}
      {activeTab === "ITEMS" && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateItem}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <h2 className="font-bold text-sm text-slate-900">
              + Tambah Item Baru ke Katalog Master Harga Satuan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Kode (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="1.1.1.1"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Nama Pekerjaan / Material
                </label>
                <input
                  type="text"
                  required
                  placeholder="Pasang Plafon Gypsum 9mm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Kelompok Bab
                </label>
                <input
                  type="text"
                  placeholder="1.1 PEKERJAAN PERSIAPAN"
                  value={workGroup}
                  onChange={(e) => setWorkGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tipe
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value as "PEKERJAAN" | "MATERIAL" | "UPAH"
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  <option value="PEKERJAAN">PEKERJAAN</option>
                  <option value="MATERIAL">MATERIAL</option>
                  <option value="UPAH">UPAH TUKANG</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Satuan
                </label>
                <input
                  type="text"
                  required
                  placeholder="m2"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs text-center"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Harga Satuan
                </label>
                <CurrencyInput
                  value={defaultPrice}
                  onChange={setDefaultPrice}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan ke Katalog Master</span>
              </button>
            </div>
          </form>

          {/* Search Bar & Filter Kelompok Bab */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari kode (mis: 1.1.1), uraian pekerjaan, atau nama bahan..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="md:col-span-4">
                  <select
                    value={filterGroup}
                    onChange={(e) => {
                      setFilterGroup(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                  >
                    <option value="ALL">
                      Semua Kelompok Bab Pekerjaan ({uniqueGroups.length} Bab)
                    </option>
                    {uniqueGroups.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3 flex justify-end gap-1.5">
                  {["ALL", "PEKERJAAN", "MATERIAL", "UPAH"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setFilterCat(cat);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                        filterCat === cat
                          ? "bg-slate-900 text-amber-400"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat === "ALL" ? "Semua" : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>
                  Menampilkan <strong>{paginatedItems.length}</strong> dari{" "}
                  <strong>{filteredItems.length} item</strong> yang cocok
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-slate-800">
                      Hal {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-3 px-4 w-24">Kode</th>
                    <th className="py-3 px-4">Uraian Pekerjaan / Material</th>
                    <th className="py-3 px-4 w-56">Kelompok Bab</th>
                    <th className="py-3 px-4 text-center w-20">Satuan</th>
                    <th className="py-3 px-4 text-right w-44">
                      Harga Satuan (Rp)
                    </th>
                    <th className="py-3 px-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedItems.map((item) => {
                    const isEditing = editingId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">
                          {item.code || "-"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-400 text-xs"
                            />
                          ) : (
                            item.name
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editWorkGroup}
                              onChange={(e) => setEditWorkGroup(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-400 text-xs"
                            />
                          ) : (
                            <span className="line-clamp-1">
                              {item.workGroup || "-"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editUnit}
                              onChange={(e) => setEditUnit(e.target.value)}
                              className="w-16 px-2 py-1.5 rounded-lg border border-amber-400 text-xs text-center"
                            />
                          ) : (
                            item.unit
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {isEditing ? (
                            <CurrencyInput
                              value={editPrice}
                              onChange={setEditPrice}
                            />
                          ) : (
                            formatRupiah(Number(item.defaultPrice))
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveEditItem(item.id)}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="p-1.5 rounded-lg bg-slate-200 text-slate-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditItem(item)}
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: MASTER KATEGORI PEKERJAAN RAB       */}
      {/* ========================================== */}
      {activeTab === "CATEGORIES" && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateCat}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                + Tambah Master Kategori Pekerjaan RAB (Template Bab RAB)
              </h2>
              <p className="text-xs text-slate-500">
                Kategori yang dicentang &ldquo;Default Proyek Baru&rdquo; akan otomatis dibuatkan saat Anda membuat proyek baru.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Nama Bab Kategori Pekerjaan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1.1 PEKERJAAN PERSIAPAN"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Urutan Bab
                </label>
                <input
                  type="number"
                  required
                  value={catOrder}
                  onChange={(e) => setCatOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-2 flex items-center pb-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={catIsDefault}
                    onChange={(e) => setCatIsDefault(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Default Proyek Baru</span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Bab</span>
                </button>
              </div>
            </div>
          </form>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama bab kategori pekerjaan..."
                  value={catSearchQuery}
                  onChange={(e) => setCatSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <span className="text-xs text-slate-500">
                Menampilkan <strong>{filteredCategories.length}</strong> bab kategori
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-3 px-4 w-20 text-center">Urutan</th>
                  <th className="py-3 px-4">Nama Bab Kategori Pekerjaan</th>
                  <th className="py-3 px-4 text-center">
                    Otomatis di Proyek Baru?
                  </th>
                  <th className="py-3 px-4 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCategories.map((cat) => {
                  const isEditing = editingCatId === cat.id;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editCatOrder}
                            onChange={(e) =>
                              setEditCatOrder(Number(e.target.value))
                            }
                            className="w-16 px-2 py-1 rounded border border-amber-400 text-center text-xs"
                          />
                        ) : (
                          cat.sortOrder
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            className="w-full px-3 py-1 rounded border border-amber-400 text-xs"
                          />
                        ) : (
                          cat.name
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editCatDefault}
                            onChange={(e) =>
                              setEditCatDefault(e.target.checked)
                            }
                            className="w-4 h-4 accent-amber-500"
                          />
                        ) : cat.isDefault ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            YA (DEFAULT)
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            OPSIONAL
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveEditCat(cat.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatId(null)}
                              className="p-1.5 rounded-lg bg-slate-200 text-slate-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditCat(cat)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCat(cat.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
