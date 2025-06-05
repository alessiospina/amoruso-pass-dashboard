# Dockerfile per modalità development
FROM node:18-alpine

# Installa dipendenze necessarie
RUN apk add --no-cache libc6-compat openssl

# Set working directory
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Copia package files
COPY package.json pnpm-lock.yaml ./

# Installa dipendenze
RUN pnpm install

# Copia tutto il codice
COPY . .

# Genera Prisma client
RUN npx prisma generate

# Esponi porta 8000
EXPOSE 8000

# Avvia l'applicazione in modalità development
CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "8000"]
