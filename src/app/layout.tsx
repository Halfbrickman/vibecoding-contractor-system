import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karya Bangun Mandiri | Kontraktor Bangun Rumah, Renovasi & Kontrakan",
  description:
    "Sistem Informasi Manajemen Kontraktor, Smart RAB, Galeri Render 3D V-Ray/Enscape & Company Profile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="min-h-screen flex flex-col">
        {children}
        <Toaster richColors position="bottom-right" closeButton />
      </body>
    </html>
  );
}
