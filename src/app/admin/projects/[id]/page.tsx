import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProjectDetailClient from "./ProjectDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      media: { orderBy: { sortOrder: "asc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
      sketches: { orderBy: { createdAt: "desc" } },
      rabCategories: {
        include: { items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      progressLogs: { orderBy: { weekNumber: "desc" } },
      paymentTermins: { orderBy: { createdAt: "asc" } },
      expenseLogs: { orderBy: { expenseDate: "desc" } },
    },
  });

  if (!project) return notFound();

  const masterCategories = await prisma.masterRabCategory.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const companyProfile = await prisma.companyProfile.findFirst();

  return (
    <ProjectDetailClient
      project={JSON.parse(JSON.stringify(project))}
      masterCategories={JSON.parse(JSON.stringify(masterCategories))}
      companyProfile={JSON.parse(JSON.stringify(companyProfile))}
    />
  );
}
