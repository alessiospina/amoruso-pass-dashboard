#!/bin/bash

# ==============================================
# MIGRAZIONE DATABASE PRODUZIONE
# ==============================================

set -e

echo "🚀 Migrazione Database Produzione"
echo "=================================="

# Carica le variabili da .env.production
echo "📂 Caricando configurazioni da .env.production..."
export $(grep -v '^#' .env.production | grep -v '^$' | xargs)

echo "🔍 Database: ${DATABASE_URL%%\?*}"

# Scelta del comando
case "${1:-push}" in
    "migrate")
        echo "🔄 Eseguendo migrazione..."
        npx prisma migrate dev --name init
        ;;
    "push")
        echo "📤 Push diretto dello schema..."
        PRISMA_MIGRATE_SKIP_GENERATE=true npx prisma db push --accept-data-loss
        echo "⚙️ Generando client..."
        npx prisma generate
        ;;
    "deploy")
        echo "🚀 Deploy migrazioni..."
        npx prisma migrate deploy
        ;;
    "generate")
        echo "⚙️ Generando client..."
        npx prisma generate
        ;;
    "studio")
        echo "🔍 Aprendo Prisma Studio..."
        npx prisma studio
        ;;
    *)
        echo "📖 Comandi disponibili:"
        echo "   ./migrate-prod.sh push      - Push schema (default)"
        echo "   ./migrate-prod.sh migrate   - Crea migrazione"
        echo "   ./migrate-prod.sh deploy    - Deploy migrazioni"
        echo "   ./migrate-prod.sh generate  - Genera client"
        echo "   ./migrate-prod.sh studio    - Apri Prisma Studio"
        ;;
esac

echo "✅ Operazione completata!"
