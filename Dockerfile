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

# Argomento per il file env
ARG ENV_FILE=.env.production

# Copia file env specificato
COPY ${ENV_FILE} .env.local

# Genera Prisma client
RUN npx prisma generate

# Build dell'app
RUN pnpm build

# Copia file statici per standalone
RUN cp -r .next/static .next/standalone/.next/
RUN cp -r public .next/standalone/

# Esponi porta
EXPOSE 3000

# Avvia l'applicazione in modalità standalone
CMD ["node", ".next/standalone/server.js"]
