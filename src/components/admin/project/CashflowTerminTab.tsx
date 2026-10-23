"use client";

import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  ImagePlus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import CurrencyInput from "@/components/ui/CurrencyInput";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function CashflowTerminTab({
  project,
  totalRab,
  onUploadFile,
  uploading,
  onRefresh,
}: {
  project: any;
  totalRab: number;
  onUploadFile: (file: File, folder: string) => Promise<string>;
  uploading: boolean;
  onRefresh: () => void;
}) {
  // ==========================================
  // 1. STATE PENGELUARAN LAPANGAN (NOTA)
  // ==========================================
  const [expCategory, setExpCategory] = useState("MATERIAL");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expReceiptUrl, setExpReceiptUrl] = useState<string>("");

  // State Edit Pengeluaran
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editExpCategory, setEditExpCategory] = useState("MATERIAL");
  const [editExpDesc, setEditExpDesc] = useState("");
  const [editExpAmount, setEditExpAmount] = useState<number>(0);
  const [editExpReceiptUrl, setEditExpReceiptUrl] = useState<string>("");

  // ==========================================
  // 2. STATE TERMIN PEMBAYARAN KLIEN
  // ==========================================
  const [terminName, setTerminName] = useState("");
  const [terminAmount, setTerminAmount] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [terminProofUrl, setTerminProofUrl] = useState<string>("");

  // State Edit Termin
  const [editingTerminId, setEditingTerminId] = useState<string | null>(null);
  const [editTerminName, setEditTerminName] = useState("");
  const [editTerminInvoice, setEditTerminInvoice] = useState("");
  const [editTerminAmount, setEditTerminAmount] = useState<number>(0);
  const [editTerminStatus, setEditTerminStatus] = useState("UNPAID");
  const [editTerminProofUrl, setEditTerminProofUrl] = useState<string>("");

  // ==========================================
  // 3. STATE PROGRES MINGGUAN LAPANGAN
  // ==========================================
  const [weekNumber, setWeekNumber] = useState<number>(
    (project.progressLogs[0]?.weekNumber || 0) + 1
  );
  const [percentage, setPercentage] = useState<number>(
    project.progressLogs[0]?.percentage || 20
  );
  const [progressSummary, setProgressSummary] = useState("");
  const [progressPhotoUrl, setProgressPhotoUrl] = useState<string>("");

  // State Edit Progres Mingguan
  const [editingProgId, setEditingProgId] = useState<string | null>(null);
  const [editWeekNumber, setEditWeekNumber] = useState<number>(1);
  const [editPercentage, setEditPercentage] = useState<number>(0);
  const [editProgressSummary, setEditProgressSummary] = useState("");
  const [editProgressPhotoUrl, setEditProgressPhotoUrl] = useState<string>("");

  // Modal Preview Gambar Bukti / Nota
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Helper Upload Gambar Bukti
  const handleUploadAttachment = async (
    e: React.ChangeEvent<HTMLInputElement>,
    folder: string,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await onUploadFile(file, folder);
      if (url) {
        setter(url);
        toast.success("Foto bukti berhasil dilampirkan!");
      }
    } catch {
      toast.error("Gagal mengunggah foto bukti");
    }
  };

  // --- HANDLERS PENGELUARAN ---
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_EXPENSE",
        category: expCategory,
        description: expDesc,
        amount: expAmount,
        receiptFileUrl: expReceiptUrl || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Gagal menyimpan pengeluaran");
      return;
    }
    setExpDesc("");
    setExpAmount(0);
    setExpReceiptUrl("");
    toast.success("Catatan pengeluaran lapangan berhasil disimpan!");
    onRefresh();
  };

  const startEditExpense = (exp: any) => {
    setEditingExpId(exp.id);
    setEditExpCategory(exp.category || "MATERIAL");
    setEditExpDesc(exp.description || "");
    setEditExpAmount(Number(exp.amount) || 0);
    setEditExpReceiptUrl(exp.receiptFileUrl || "");
  };

  const handleSaveEditExpense = async (expenseId: string) => {
    const res = await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_EXPENSE",
        expenseId,
        category: editExpCategory,
        description: editExpDesc,
        amount: editExpAmount,
        receiptFileUrl: editExpReceiptUrl || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Gagal memperbarui pengeluaran");
      return;
    }
    setEditingExpId(null);
    toast.success("Data pengeluaran & foto nota berhasil diperbarui!");
    onRefresh();
  };

  // --- HANDLERS TERMIN ---
  const handleAddTermin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_TERMIN",
        terminName,
        amount: terminAmount,
        invoiceNumber,
        status: terminProofUrl ? "PAID" : "UNPAID",
        paymentProof: terminProofUrl || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Gagal menyimpan termin");
      return;
    }
    setTerminName("");
    setTerminAmount(0);
    setInvoiceNumber("");
    setTerminProofUrl("");
    toast.success("Tagihan termin pembayaran berhasil ditambahkan!");
    onRefresh();
  };

  const startEditTermin = (t: any) => {
    setEditingTerminId(t.id);
    setEditTerminName(t.terminName || "");
    setEditTerminInvoice(t.invoiceNumber || "");
    setEditTerminAmount(Number(t.amount) || 0);
    setEditTerminStatus(t.status || "UNPAID");
    setEditTerminProofUrl(t.paymentProof || "");
  };

  const handleSaveEditTermin = async (terminId: string) => {
    const res = await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_TERMIN",
        terminId,
        terminName: editTerminName,
        invoiceNumber: editTerminInvoice,
        amount: editTerminAmount,
        status: editTerminStatus,
        paymentProof: editTerminProofUrl || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Gagal memperbarui termin");
      return;
    }
    setEditingTerminId(null);
    toast.success("Data termin & bukti bayar berhasil diperbarui!");
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

  // --- HANDLERS PROGRES MINGGUAN ---
  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_PROGRESS",
        weekNumber,
        percentage,
        summary: progressSummary,
        photoUrl: progressPhotoUrl || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Gagal menyimpan progres");
      return;
    }
    setProgressSummary("");
    setProgressPhotoUrl("");
    setWeekNumber((prev) => prev + 1);
    toast.success(
      `Progres Minggu ke-${weekNumber} (${percentage}%) dipublikasikan!`
    );
    onRefresh();
  };

  const startEditProgress = (log: any) => {
    setEditingProgId(log.id);
    setEditWeekNumber(Number(log.weekNumber) || 1);
    setEditPercentage(Number(log.percentage) || 0);
    setEditProgressSummary(log.summary || "");
    setEditProgressPhotoUrl(log.photoUrls?.[0] || "");
  };

  const handleSaveEditProgress = async (progressId: string) => {
    const res = await fetch(`/api/projects/${project.id}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_PROGRESS",
        progressId,
        weekNumber: editWeekNumber,
        percentage: editPercentage,
        summary: editProgressSummary,
        photoUrl: editProgressPhotoUrl || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Gagal memperbarui laporan progres");
      return;
    }
    setEditingProgId(null);
    toast.success("Laporan progres & foto berhasil diperbarui!");
    onRefresh();
  };

  const handleDeleteItem = async (
    target: "expense" | "termin" | "progress",
    id: string
  ) => {
    await fetch(
      `/api/projects/${project.id}/extras?target=${target}&id=${id}`,
      {
        method: "DELETE",
      }
    );
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
        {/* ===================================================== */}
        {/* 1. CATAT PENGELUARAN NOTA LAPANGAN                     */}
        {/* ===================================================== */}
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

            {/* Upload Foto Nota Opsional */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {expReceiptUrl ? (
                  <img
                    src={expReceiptUrl}
                    alt="Preview Nota"
                    className="w-11 h-11 rounded-lg object-cover border bg-white shrink-0"
                  />
                ) : null}
                <div className="text-xs">
                  <span className="font-bold text-slate-700 block">
                    Foto Nota / Struk Belanja (Opsional)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {expReceiptUrl
                      ? "Foto nota siap disimpan (bisa diganti/dihapus)"
                      : "Boleh dikosongkan jika tidak ada foto struk"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition">
                  <ImagePlus className="w-3.5 h-3.5 text-rose-600" />
                  <span>{expReceiptUrl ? "Ganti Foto" : "Upload Nota"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleUploadAttachment(e, "receipts", setExpReceiptUrl)
                    }
                    className="hidden"
                  />
                </label>
                {expReceiptUrl && (
                  <button
                    type="button"
                    onClick={() => setExpReceiptUrl("")}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                    title="Hapus Foto Nota"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs shadow"
            >
              + Simpan Catatan Pengeluaran
            </button>
          </form>

          {/* Daftar Riwayat Pengeluaran (Editable) */}
          <div className="divide-y divide-slate-200 pt-3 max-h-80 overflow-y-auto">
            {project.expenseLogs.map((exp: any) => (
              <div key={exp.id} className="py-3 text-xs">
                {editingExpId === exp.id ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editExpCategory}
                        onChange={(e) => setEditExpCategory(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                      >
                        <option value="MATERIAL">MATERIAL</option>
                        <option value="UPAH_TUKANG">UPAH_TUKANG</option>
                        <option value="SEWA_ALAT">SEWA_ALAT</option>
                        <option value="OPERASIONAL">OPERASIONAL</option>
                      </select>
                      <CurrencyInput
                        value={editExpAmount}
                        onChange={setEditExpAmount}
                      />
                    </div>
                    <input
                      type="text"
                      value={editExpDesc}
                      onChange={(e) => setEditExpDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {editExpReceiptUrl && (
                          <img
                            src={editExpReceiptUrl}
                            alt="Nota"
                            className="w-9 h-9 rounded object-cover border"
                          />
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-bold hover:bg-slate-100">
                          <ImagePlus className="w-3.5 h-3.5 text-rose-600" />
                          <span>
                            {editExpReceiptUrl ? "Ganti Foto Nota" : "Upload Foto Nota"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleUploadAttachment(
                                e,
                                "receipts",
                                setEditExpReceiptUrl
                              )
                            }
                            className="hidden"
                          />
                        </label>
                        {editExpReceiptUrl && (
                          <button
                            type="button"
                            onClick={() => setEditExpReceiptUrl("")}
                            className="text-[11px] text-rose-600 hover:underline"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveEditExpense(exp.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingExpId(null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-[11px]"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {exp.description}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">
                          {exp.category}
                        </span>
                        {exp.receiptFileUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: exp.receiptFileUrl,
                                title: `Nota: ${exp.description}`,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat Nota</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <strong className="text-rose-600">
                        {formatRupiah(Number(exp.amount))}
                      </strong>
                      <button
                        type="button"
                        onClick={() => startEditExpense(exp)}
                        className="p-1 text-slate-400 hover:text-amber-600"
                        title="Edit Pengeluaran / Ganti Foto Nota"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem("expense", exp.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Hapus Pengeluaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===================================================== */}
        {/* 2. KELOLA TERMIN PEMBAYARAN KLIEN                      */}
        {/* ===================================================== */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              2. Tagihan Termin Pembayaran Klien (Tampil di Portal Klien)
            </h3>
            <p className="text-xs text-slate-500">
              Atur jadwal pembayaran DP, Termin Progres, dan lampirkan bukti transfer/kwitansi (opsional).
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

            {/* Upload Bukti Transfer Termin Opsional */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {terminProofUrl ? (
                  <img
                    src={terminProofUrl}
                    alt="Preview Bukti Bayar"
                    className="w-11 h-11 rounded-lg object-cover border bg-white shrink-0"
                  />
                ) : null}
                <div className="text-xs">
                  <span className="font-bold text-slate-700 block">
                    Bukti Transfer / Kwitansi (Opsional)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {terminProofUrl
                      ? "Bukti bayar terlampir (bisa diganti/dihapus kapan saja)"
                      : "Bisa diupload sekarang atau menyusul saat klien membayar"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition">
                  <ImagePlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{terminProofUrl ? "Ganti Bukti" : "Upload Bukti"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleUploadAttachment(e, "termins", setTerminProofUrl)
                    }
                    className="hidden"
                  />
                </label>
                {terminProofUrl && (
                  <button
                    type="button"
                    onClick={() => setTerminProofUrl("")}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                    title="Hapus Bukti"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow"
            >
              + Tambah Tagihan Termin
            </button>
          </form>

          {/* Daftar Termin (Editable) */}
          <div className="space-y-2.5 pt-2 max-h-80 overflow-y-auto">
            {(project.paymentTermins || []).map((t: any) => (
              <div
                key={t.id}
                className="p-3 rounded-xl border border-slate-200 text-xs"
              >
                {editingTerminId === t.id ? (
                  <div className="space-y-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-300">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editTerminName}
                        onChange={(e) => setEditTerminName(e.target.value)}
                        placeholder="Nama Termin"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                      <input
                        type="text"
                        value={editTerminInvoice}
                        onChange={(e) => setEditTerminInvoice(e.target.value)}
                        placeholder="No. Invoice"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                      <CurrencyInput
                        value={editTerminAmount}
                        onChange={setEditTerminAmount}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {editTerminProofUrl && (
                          <img
                            src={editTerminProofUrl}
                            alt="Bukti Bayar"
                            className="w-9 h-9 rounded object-cover border"
                          />
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-bold hover:bg-slate-100">
                          <ImagePlus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {editTerminProofUrl
                              ? "Ganti Foto Bukti"
                              : "Upload Bukti Bayar"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleUploadAttachment(
                                e,
                                "termins",
                                setEditTerminProofUrl
                              )
                            }
                            className="hidden"
                          />
                        </label>
                        {editTerminProofUrl && (
                          <button
                            type="button"
                            onClick={() => setEditTerminProofUrl("")}
                            className="text-[11px] text-rose-600 hover:underline"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveEditTermin(t.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTerminId(null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-[11px]"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {t.terminName}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-500">
                          {t.invoiceNumber} • {formatRupiah(Number(t.amount))}
                        </span>
                        {t.paymentProof && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: t.paymentProof,
                                title: `Bukti Pembayaran: ${t.terminName}`,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat Bukti</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
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
                        <span>
                          {t.status === "PAID" ? "LUNAS" : "Tandai Lunas"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditTermin(t)}
                        className="p-1 text-slate-400 hover:text-amber-600"
                        title="Edit Termin / Upload & Ganti Foto Bukti"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem("termin", t.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Hapus Termin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* 3. UPDATE LAPORAN PROGRES MINGGUAN KLIEN              */}
      {/* ===================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <h3 className="font-bold text-base text-slate-900">
            3. Update Laporan Progres Mingguan (Tampil di Link Portal Klien)
          </h3>
          <p className="text-xs text-slate-500">
            Klien dapat langsung melihat persentase progres terbaru, ringkasan pekerjaan, dan foto lapangan minggu ini.
          </p>
        </div>

        <form onSubmit={handleAddProgress} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
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
            <div className="md:col-span-3 flex items-center gap-2">
              <label className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition">
                <ImagePlus className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {progressPhotoUrl ? "Ganti Foto" : "Foto Lapangan (Opsional)"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleUploadAttachment(e, "progress", setProgressPhotoUrl)
                  }
                  className="hidden"
                />
              </label>
              {progressPhotoUrl && (
                <button
                  type="button"
                  onClick={() => setProgressPhotoUrl("")}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200"
                  title="Hapus Foto"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {progressPhotoUrl && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950">
              <img
                src={progressPhotoUrl}
                alt="Preview Progres"
                className="w-12 h-12 rounded-lg object-cover border bg-white"
              />
              <span>
                Foto dokumentasi lapangan siap dipublikasikan bersama laporan Minggu ke-{weekNumber}.
              </span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow"
            >
              + Publikasikan Progres Mingguan
            </button>
          </div>
        </form>

        {/* Daftar Riwayat Progres Mingguan (Editable) */}
        {(project.progressLogs || []).length > 0 && (
          <div className="pt-3 border-t border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700">
              Riwayat Laporan Progres Mingguan (Klik Ikon Pensil Jika Salah Upload Foto / Teks)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {project.progressLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs"
                >
                  {editingProgId === log.id ? (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500">
                            Minggu Ke-
                          </label>
                          <input
                            type="number"
                            value={editWeekNumber}
                            onChange={(e) =>
                              setEditWeekNumber(Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500">
                            Progres (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editPercentage}
                            onChange={(e) =>
                              setEditPercentage(Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={editProgressSummary}
                        onChange={(e) => setEditProgressSummary(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          {editProgressPhotoUrl && (
                            <img
                              src={editProgressPhotoUrl}
                              alt="Foto Progres"
                              className="w-9 h-9 rounded object-cover border"
                            />
                          )}
                          <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-bold hover:bg-slate-100">
                            <ImagePlus className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {editProgressPhotoUrl
                                ? "Ganti Foto"
                                : "Upload Foto"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleUploadAttachment(
                                  e,
                                  "progress",
                                  setEditProgressPhotoUrl
                                )
                              }
                              className="hidden"
                            />
                          </label>
                          {editProgressPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setEditProgressPhotoUrl("")}
                              className="text-[11px] text-rose-600 hover:underline"
                            >
                              Hapus Foto
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveEditProgress(log.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Simpan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProgId(null)}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-[11px]"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {log.photoUrls?.[0] && (
                          <img
                            src={log.photoUrls[0]}
                            alt={`Minggu ${log.weekNumber}`}
                            onClick={() =>
                              setPreviewImage({
                                url: log.photoUrls[0],
                                title: `Foto Progres Minggu Ke-${log.weekNumber} (${log.percentage}%)`,
                              })
                            }
                            className="w-14 h-14 rounded-lg object-cover border bg-white cursor-pointer shrink-0 hover:opacity-90"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">
                              Minggu Ke-{log.weekNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {log.percentage}%
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed">
                            {log.summary}
                          </p>
                          {log.photoUrls?.[0] && (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewImage({
                                  url: log.photoUrls[0],
                                  title: `Foto Progres Minggu Ke-${log.weekNumber} (${log.percentage}%)`,
                                })
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1 hover:underline"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat Foto Lapangan</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditProgress(log)}
                          className="p-1 text-slate-400 hover:text-amber-600"
                          title="Edit Laporan / Ganti Foto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem("progress", log.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Hapus Laporan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Lightbox Lihat Foto Nota / Bukti Bayar / Foto Progres */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-bold text-xs sm:text-sm truncate pr-4">
                {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[68vh] w-auto object-contain rounded-lg shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
