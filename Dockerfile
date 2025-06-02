# Dockerfile semplificato per sviluppo locale
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

# Copia file env
COPY .env.production .env.local

# Genera Prisma client
RUN npx prisma generate

# Build dell'app
RUN pnpm build

# Esponi porta
EXPOSE 3000

# Avvia l'applicazione
CMD ["pnpm", "start"]
