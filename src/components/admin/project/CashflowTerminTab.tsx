"use client";

import React, { useState } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import CurrencyInput from "@/components/ui/CurrencyInput";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function CashflowTerminTab({
  project,
  totalRab,
  onRefresh,
}: {
  project: any;
  totalRab: number;
  onRefresh: () => void;
}) {
  // State Pengeluaran Lapangan
  const [expCategory, setExpCategory] = useState("MATERIAL");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState<number>(0);

  // State Progres Mingguan
  const [weekNumber, setWeekNumber] = useState<number>(
    (project.progressLogs[0]?.weekNumber || 0) + 1
  );
  const [percentage, setPercentage] = useState<number>(
    project.progressLogs[0]?.percentage || 20
  );
  const [progressSummary, setProgressSummary] = useState("");

  // State Termin Pembayaran Klien
  const [terminName, setTerminName] = useState("");
  const [terminAmount, setTerminAmount] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_EXPENSE",
        category: expCategory,
        description: expDesc,
        amount: expAmount,
      }),
    });
    setExpDesc("");
    setExpAmount(0);
    toast.success("Catatan pengeluaran lapangan berhasil disimpan!");
    onRefresh();
  };

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_PROGRESS",
        weekNumber,
        percentage,
        summary: progressSummary,
      }),
    });
    setProgressSummary("");
    toast.success(`Progres Minggu ke-${weekNumber} (${percentage}%) dipublikasikan!`);
    onRefresh();
  };

  const handleAddTermin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_TERMIN",
        terminName,
        amount: terminAmount,
        invoiceNumber,
        status: "UNPAID",
      }),
    });
    setTerminName("");
    setTerminAmount(0);
    setInvoiceNumber("");
    toast.success("Tagihan termin pembayaran berhasil ditambahkan!");
    onRefresh();
  };

  const handleToggleTermin = async (terminId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PAID" ? "UNPAID" : "PAID";
    await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TOGGLE_TERMIN_STATUS",
        terminId,
        status: nextStatus,
      }),
    });
    toast.success(
      nextStatus === "PAID"
        ? "Status termin diubah menjadi LUNAS!"
        : "Status termin diubah menjadi BELUM DIBAYAR."
    );
    onRefresh();
  };

  const handleDeleteItem = async (target: "expense" | "termin", id: string) => {
    await fetch(`/api/projects/${project.id}/extras?target=${target}&id=${id}`, {
      method: "DELETE",
    });
    toast.success("Data berhasil dihapus.");
    onRefresh();
  };

  const totalSpent = project.expenseLogs.reduce(
    (sum: number, exp: any) => sum + Number(exp.amount),
    0
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Catat Pengeluaran Nota Lapangan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              1. Catat Pengeluaran Riil Lapangan (Nota Material & Upah)
            </h3>
            <p className="text-xs text-slate-500">
              Total Terpakai:{" "}
              <strong className="text-rose-600">{formatRupiah(totalSpent)}</strong>{" "}
              dari RAB <strong>{formatRupiah(totalRab)}</strong>
            </p>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Pengeluaran
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  <option value="MATERIAL">Belanja Material / Toko Bangunan</option>
                  <option value="UPAH_TUKANG">Gajian / Kasbon Tukang</option>
                  <option value="SEWA_ALAT">Sewa Alat (Molen/Scaffolding)</option>
                  <option value="OPERASIONAL">Operasional Lapangan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Pengeluaran
                </label>
                <CurrencyInput
                  value={expAmount}
                  onChange={setExpAmount}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Keterangan Nota / Belanja
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Nota TB. Makmur 40 sak semen + pasir 1 truk"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs shadow"
            >
              + Simpan Catatan Pengeluaran
            </button>
          </form>

          <div className="divide-y divide-slate-200 pt-3 max-h-64 overflow-y-auto">
            {project.expenseLogs.map((exp: any) => (
              <div
                key={exp.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block">
                    {exp.description}
                  </span>
                  <span className="text-slate-400">{exp.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className="text-rose-600">
                    {formatRupiah(Number(exp.amount))}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem("expense", exp.id)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Kelola Termin Pembayaran Klien */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              2. Tagihan Termin Pembayaran Klien (Tampil di Portal Klien)
            </h3>
            <p className="text-xs text-slate-500">
              Atur jadwal pembayaran DP, Termin Progres, dan Retensi beserta status lunasnya.
            </p>
          </div>

          <form onSubmit={handleAddTermin} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Termin
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Termin 2 (50%)"
                  value={terminName}
                  onChange={(e) => setTerminName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. Invoice (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="INV/2026/003"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Tagihan
                </label>
                <CurrencyInput
                  value={terminAmount}
                  onChange={setTerminAmount}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow"
            >
              + Tambah Tagihan Termin
            </button>
          </form>

          <div className="space-y-2.5 pt-2">
            {(project.paymentTermins || []).map((t: any) => (
              <div
                key={t.id}
                className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">
                    {t.terminName}
                  </span>
                  <span className="text-slate-500">
                    {t.invoiceNumber} • {formatRupiah(Number(t.amount))}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleTermin(t.id, t.status)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition ${
                      t.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.status === "PAID" ? "LUNAS" : "Tandai Lunas"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem("termin", t.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Update Progres Mingguan Klien */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">
            3. Update Laporan Progres Mingguan (Tampil di Link Portal Klien)
          </h3>
          <p className="text-xs text-slate-500">
            Klien dapat langsung melihat persentase progres terbaru dan ringkasan pekerjaan minggu ini.
          </p>
        </div>

        <form onSubmit={handleAddProgress} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Minggu Ke-
            </label>
            <input
              type="number"
              required
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Progres Total (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              required
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div className="md:col-span-5">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ringkasan Pekerjaan Minggu Ini
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pengecoran dak lantai 2 selesai, lanjut pasangan hebel."
              value={progressSummary}
              onChange={(e) => setProgressSummary(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow"
            >
              + Publikasikan Progres
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
