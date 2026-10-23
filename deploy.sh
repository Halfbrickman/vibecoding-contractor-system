#!/usr/bin/env bash
set -e

echo "===================================================="
echo "🚀 DEPLOYING CONTRACTOR SYSTEM TO HOME SERVER..."
echo "===================================================="

echo "1️⃣ Menarik update kode terbaru dari Git (git pull)..."
git pull origin main

echo "2️⃣ Membangun & menyalakan ulang Container Production..."
docker compose up -d --build

echo "3️⃣ Membersihkan image Docker lama yang tidak terpakai..."
docker image prune -f

echo "✅ DEPLOYMENT SELESAI! Aplikasi berjalan di Port 3000."
echo "===================================================="
docker compose ps
