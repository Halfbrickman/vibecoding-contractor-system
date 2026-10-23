FROM node:20-alpine

# Install OpenSSL untuk Prisma ORM di Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package manifest terlebih dahulu agar layer caching Docker cepat
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm install

# Copy seluruh source code aplikasi
COPY . .

# Generate Prisma Client & Build Next.js Production
RUN npx prisma generate
RUN npm run build

# Pastikan folder uploads tersedia
RUN mkdir -p /app/public/uploads

EXPOSE 3000

# Saat container menyala: otomatis sinkronisasi tabel database lalu jalankan server Production
CMD ["sh", "-c", "npx prisma db push && npm run start"]
