# Contractor Operations, Smart RAB & Company Profile System

A full-stack construction management and company profile platform built for a family contracting business. Designed to manage **3D/2D architectural portfolios, interactive field sketches, Bill of Quantities (Smart RAB / AHSP), client progress portals, and project cashflow**, self-hosted on a **Linux (Ubuntu) Home Server** using **Docker Compose** and **Cloudflare Tunnel**.

---

## ✨ Key Features

- **Dynamic Company Profile & Cost Estimator:** Public-facing showcase with customizable branding, Before/After renovation sliders, 360° panorama/3D render galleries, and an instant per-$m^2$ construction cost calculator.
- **Smart RAB (Bill of Quantities) & Excel Integration:** Supports hierarchical work categories (`MasterRabCategory`), unit price analysis (`MasterItem` — Labor, Material, Work), automated volume $\times$ unit price calculation, and `.xlsx` spreadsheet import/export (`xlsx`).
- **Field Survey Sketching & CAD Document Versioning:** Built-in canvas sketch support (`ProjectSketch`) with grid scaling and vector JSON persistence for on-site room measurements, alongside versioned document tracking for SketchUp (`.skp`), Revit 2D DED, and contract PDFs.
- **Passwordless Client Progress Portal:** Generates a unique `shareToken` link per project so clients can transparently monitor weekly field progress (`ProgressLog`), photos, and payment milestones (`PaymentTermin`) without complex login steps.
- **Real-Time Expense & Cashflow Tracking:** Logs field expenditures (`ExpenseLog` — Materials, Labor wages, Equipment rental, Operations) with receipt uploads against contract value and payment termins.

---

## 🖥️ Self-Hosted Home Server & DevOps Architecture

Beyond application features, this project serves as a practical **Linux & Infrastructure Homelab**:

```text
Internet Users / Clients
       │
       ▼
[ Custom Domain + Cloudflare Zero-Trust Tunnel ]
       │ (Encrypted tunnel without exposing router ports)
       ▼
[ Ubuntu Linux Home Server (Repurposed Laptop Hardware) ]
  └── Docker Compose Stack (docker-compose.yml)
       ├── contractor_webapp   (Next.js 15 + React 19 Production Container :3000)
       └── contractor_postgres (PostgreSQL 16 Alpine Container :5432 + Healthchecks & Persistent Volume)
```

### Automated Deployment (`deploy.sh`)
Updates are deployed via SSH to the Ubuntu Home Server using a single automated shell script:
```bash
#!/usr/bin/env bash
set -e
git pull origin main
docker compose up -d --build
docker image prune -f
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router), React 19, TypeScript 5.8 |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Sonner Toast, `clsx` / `tailwind-merge` |
| **Database & Validation** | PostgreSQL 16, Prisma ORM (`@prisma/client`), Zod, SheetJS (`xlsx`) |
| **Infrastructure** | Ubuntu Linux Server, Docker & Docker Compose, Bash Scripting, SSH, Cloudflare Tunnel |

---

## 🚀 Running Locally or via Docker

### Option 1: Docker Compose (Production-like)
```bash
cp .env.example .env
docker compose up -d --build
```
The application will be available at `http://localhost:3000` with an automatically provisioned PostgreSQL 16 container.

### Option 2: Local Node.js Development
```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

---

## 👤 Author

**Faridz Dwi Nurfalah**  
- GitHub: [@Halfbrickman](https://github.com/Halfbrickman)
- Email: [faridzdwin@gmail.com](mailto:faridzdwin@gmail.com)
