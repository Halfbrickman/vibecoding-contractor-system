"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ExternalLink,
  FileSpreadsheet,
  FolderPlus,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatProjectStatus, formatRupiah } from "@/lib/format";
import { toast } from "sonner";

interface ProjectSummary {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  location: string;
  buildingArea: number;
  floors: number;
  unitsCount: number;
  contractValue: string | number;
  shareToken: string;
  isPublished: boolean;
  client?: { name: string; phone: string } | null;
  expenseLogs: { amount: string | number }[];
}

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // State Pencarian & Filter Daftar Proyek
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  // State Konfirmasi Hapus Proyek
  const [projectToDelete, setProjectToDelete] =
    useState<ProjectSummary | null>(null);

  // Form Proyek Baru
  const [title, setTitle] = useState("");
  const [type, setType] = useState("RENOVASI");
  const [location, setLocation] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [buildingArea, setBuildingArea] = useState(100);
  const [floors, setFloors] = useState(2);
  const [unitsCount, setUnitsCount] = useState(1);

  const fetchProjects = async () => {
    setLoading(true);
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return projects.filter((p) => {
      if (filterType !== "ALL" && p.type !== filterType) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.client?.name && p.client.name.toLowerCase().includes(q))
      );
    });
  }, [projects, searchQuery, filterType]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        type,
        location,
        clientName,
        clientPhone,
        buildingArea,
        floors,
        unitsCount,
        isPublished: true,
      }),
    });
    setShowModal(false);
    setTitle("");
    toast.success("Proyek baru berhasil dibuat!");
    fetchProjects();
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    const res = await fetch(`/api/projects?id=${projectToDelete.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success(`Proyek "${projectToDelete.title}" berhasil dihapus.`);
      setProjectToDelete(null);
      fetchProjects();
    } else {
      toast.error("Gagal menghapus proyek.");
    }
  };

  const totalContract = projects.reduce(
    (sum, p) => sum + Number(p.contractValue || 0),
    0
  );
  const totalExpenses = projects.reduce(
    (sum, p) =>
      sum +
      (p.expenseLogs?.reduce((eSum, e) => eSum + Number(e.amount || 0), 0) ||
        0),
    0
  );
  const estimatedMargin = totalContract - totalExpenses;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Dashboard Proyek, RAB & Cashflow
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola RAB Excel, file Render V-Ray/Enscape, gambar kerja Revit, dan pengeluaran lapangan
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow transition text-sm"
        >
          <FolderPlus className="w-5 h-5" />
          <span>+ Buat Proyek Baru</span>
        </button>
      </div>

      {/* Ringkasan Keuangan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
            <span>Total Nilai Kontrak / RAB</span>
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatRupiah(totalContract)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dari {projects.length} proyek terdaftar
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
            <span>Pengeluaran Riil Lapangan</span>
            <Wallet className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">
            {formatRupiah(totalExpenses)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Akumulasi belanja material & opname tukang
          </p>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-400">
            <span>Selisih / Margin Berjalan</span>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 mt-2">
            {formatRupiah(estimatedMargin)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sisa anggaran terhadap pengeluaran riil
          </p>
        </div>
      </div>

      {/* Daftar Proyek + Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-bold text-slate-900">
            Daftar Proyek ({filteredProjects.length})
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari proyek, lokasi, atau klien..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="RENOVASI">Renovasi</option>
              <option value="BANGUN_BARU">Bangun Baru</option>
              <option value="KONTRAKAN">Kontrakan</option>
              <option value="INTERIOR">Interior</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Memuat data proyek...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Tidak ditemukan proyek yang sesuai pencarian.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredProjects.map((project) => {
              const spent =
                project.expenseLogs?.reduce(
                  (s, e) => s + Number(e.amount || 0),
                  0
                ) || 0;
              return (
                <div
                  key={project.id}
                  className="p-6 hover:bg-slate-50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-amber-100 text-amber-900">
                        {project.type.replace("_", " ")}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-slate-200 text-slate-800">
                        {formatProjectStatus(project.status)}
                      </span>
                      {project.isPublished && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Tayang di Compro
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Lokasi: {project.location || "-"} • Klien:{" "}
                      <strong>{project.client?.name || "Belum diisi"}</strong> • Luas:{" "}
                      {project.buildingArea} m²
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right mr-2">
                      <span className="block text-[11px] text-slate-400">
                        Nilai RAB / Kontrak
                      </span>
                      <strong className="text-sm font-extrabold text-slate-900">
                        {formatRupiah(Number(project.contractValue))}
                      </strong>
                      <span className="block text-[11px] text-rose-600">
                        Terpakai: {formatRupiah(spent)}
                      </span>
                    </div>

                    <Link
                      href={`/portal/${project.shareToken}`}
                      target="_blank"
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                    >
                      <span>Portal Klien</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <span>Kelola RAB, 3D & File</span>
                      <ArrowUpRight className="w-4 h-4 text-amber-400" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setProjectToDelete(project)}
                      className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                      title="Hapus Proyek"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Hapus Proyek */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">
              Hapus Proyek Ini?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus proyek{" "}
              <strong className="text-slate-900">
                &ldquo;{projectToDelete.title}&rdquo;
              </strong>
              ? Seluruh tabel RAB, catatan pengeluaran, dan galeri proyek ini akan ikut terhapus permanen.
            </p>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow"
              >
                Ya, Hapus Proyek
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Proyek */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProject}
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-extrabold text-slate-900">
              Buat Proyek Baru (Rumah / Renovasi / Kontrakan)
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Proyek
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Renovasi Rumah 2 Lantai Pak Budi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Proyek
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  <option value="RENOVASI">Renovasi Rumah</option>
                  <option value="BANGUN_BARU">Bangun Rumah Baru</option>
                  <option value="KONTRAKAN">Bangun Kontrakan</option>
                  <option value="INTERIOR">Interior</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi Proyek
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bintaro, Tangerang"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Klien / Pemilik
                </label>
                <input
                  type="text"
                  placeholder="Nama Klien"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. WhatsApp Klien
                </label>
                <input
                  type="text"
                  placeholder="0812..."
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Luas Bangunan (m²)
                </label>
                <input
                  type="number"
                  value={buildingArea}
                  onChange={(e) => setBuildingArea(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Lantai
                </label>
                <input
                  type="number"
                  value={floors}
                  onChange={(e) => setFloors(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jml Pintu (Kontrakan)
                </label>
                <input
                  type="number"
                  value={unitsCount}
                  onChange={(e) => setUnitsCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                Simpan & Buka RAB
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
