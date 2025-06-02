# Dockerfile per Amoruso Pass Dashboard
# Utilizza Node.js 18 Alpine per dimensioni ridotte
FROM node:18-alpine AS base

# Installa dipendenze necessarie per build (incluso OpenSSL per Prisma)
RUN apk add --no-cache libc6-compat openssl

# Set working directory
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# ===== DEPENDENCIES =====
FROM base AS deps

# Copia i file di configurazione delle dipendenze
COPY package.json pnpm-lock.yaml ./

# Installa le dipendenze
RUN pnpm install --frozen-lockfile

# ===== BUILDER =====
FROM base AS builder

# Copia dipendenze dalla fase precedente
COPY --from=deps /app/node_modules ./node_modules

# Copia tutto il codice sorgente
COPY . .

# Copia il file di configurazione dell'ambiente per il build
COPY .env.production .env.local

# Genera il client Prisma
RUN npx prisma generate

# Build dell'applicazione Next.js
RUN pnpm build

# ===== RUNNER =====
FROM base AS runner

# Imposta l'ambiente di produzione
ENV NODE_ENV=production

# Disabilita la telemetria di Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Crea un utente non-root per sicurezza
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Crea la directory per i file statici
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia i file necessari dal builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copia il schema Prisma e genera il client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copia le variabili d'ambiente
COPY --from=builder --chown=nextjs:nodejs /app/.env.local ./.env.local

# Switch all'utente non-root
USER nextjs

# Esponi la porta
EXPOSE 3000

# Imposta la porta per Next.js
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando di avvio
CMD ["node", "server.js"]
