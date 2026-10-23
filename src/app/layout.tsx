import type { Metadata } from "next";
import { Toaster } from "sonner";
import { prisma } from "@/lib/prisma";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await prisma.companyProfile.findFirst();
  const companyName = profile?.companyName || "Karya Bangun Mandiri";
  const tagline =
    profile?.tagline || "Kontraktor Bangun Rumah, Renovasi & Kontrakan";
  const iconUrl = profile?.faviconUrl || profile?.logoUrl || undefined;

  return {
    title: `${companyName} | ${tagline}`,
    description:
      profile?.aboutDescription ||
      "Sistem Informasi Manajemen Kontraktor, Smart RAB, Galeri Render 3D V-Ray/Enscape & Company Profile.",
    icons: iconUrl
      ? {
          icon: iconUrl,
          shortcut: iconUrl,
          apple: iconUrl,
        }
      : undefined,
  };
}

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
