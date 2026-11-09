FROM node:20-alpine

# Install OpenSSL untuk Prisma ORM di Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package manifest terlebih dahulu agar layer caching Docker maksimal
COPY package.json package-lock.json* ./

# Install dependencies (hanya re-run jika package.json berubah)
RUN npm install --no-audit --prefer-offline

# Copy schema prisma & generate client secara terpisah
COPY prisma ./prisma/
RUN npx prisma generate

# Copy seluruh source code aplikasi
COPY . .

# Build Next.js Production
RUN npm run build

# Pastikan folder uploads tersedia
RUN mkdir -p /app/public/uploads

EXPOSE 3000

# Saat container menyala: otomatis sinkronisasi tabel database lalu jalankan server Production
CMD ["sh", "-c", "npx prisma db push && npm run start"]
