"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Database,
  FolderKanban,
  Globe,
  HardHat,
  LogOut,
  Settings,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("ADMIN PANEL");

  const loadBranding = () => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.logoUrl) setLogoUrl(data.logoUrl);
        else setLogoUrl(null);
        if (data?.companyName) setCompanyName(data.companyName);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadBranding();
    window.addEventListener("company-profile-updated", loadBranding);
    return () =>
      window.removeEventListener("company-profile-updated", loadBranding);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100">
      {/* Sidebar Admin */}
      <aside className="no-print w-full md:w-64 bg-slate-950 text-white shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName}
                className="w-12 h-12 object-contain shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shrink-0">
                <HardHat className="w-6 h-6" />
              </div>
            )}
            <div className="overflow-hidden">
              <span className="font-extrabold text-sm block truncate">
                {companyName}
              </span>
              <span className="text-[11px] text-amber-400 block">
                Panel Manajemen & Compro
              </span>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 text-sm font-medium">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-amber-400 transition"
            >
              <FolderKanban className="w-4 h-4 text-amber-400" />
              <span>Proyek, RAB & Cashflow</span>
            </Link>

            <Link
              href="/admin/master-items"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-amber-400 transition"
            >
              <Database className="w-4 h-4 text-amber-400" />
              <span>Master Harga & Kategori</span>
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-amber-400 transition"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Kustomisasi Compro & Logo</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-amber-400 border border-slate-800 transition"
          >
            <Globe className="w-4 h-4" />
            <span>Lihat Website Compro Depan</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl hover:bg-rose-500/10 text-xs font-semibold text-rose-400 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
