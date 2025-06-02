#!/bin/bash

# ==============================================
# SETUP DATABASE PRODUZIONE - AMORUSO PASS
# ==============================================

set -e

echo "🚀 Setup Database Produzione"
echo "=============================="

# Verifica che il file di produzione esista
if [ ! -f .env.production.local ]; then
    echo "❌ File .env.production.local non trovato!"
    echo "📝 Crea il file .env.production.local con le configurazioni di produzione"
    exit 1
fi

# Carica le variabili di produzione
echo "📂 Caricando configurazioni di produzione..."
set -a
source .env.production.local
set +a

# Verifica che DATABASE_URL sia configurato
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL non configurato in .env.production.local"
    exit 1
fi

echo "🔍 Database configurato: ${DATABASE_URL%%\?*}"

# Scelta del comando
case "${1:-deploy}" in
    "migrate")
        echo "🔄 Eseguendo migrazioni di sviluppo..."
        npx prisma migrate dev --name production_init
        ;;
    "deploy")
        echo "🚀 Deployando migrazioni in produzione..."
        npx prisma migrate deploy
        ;;
    "push")
        echo "📤 Push diretto dello schema..."
        npx prisma db push
        ;;
    "generate")
        echo "⚙️ Generando client Prisma..."
        npx prisma generate
        ;;
    "studio")
        echo "🔍 Aprendo Prisma Studio..."
        npx prisma studio
        ;;
    "reset")
        echo "⚠️ ATTENZIONE: Questo cancellerà tutti i dati!"
        read -p "Sei sicuro? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npx prisma migrate reset --force
        fi
        ;;
    "help"|*)
        echo "📖 Comandi disponibili:"
        echo "   ./setup-prod-db.sh migrate   - Crea migrazione di sviluppo"
        echo "   ./setup-prod-db.sh deploy    - Deploya migrazioni (default)"
        echo "   ./setup-prod-db.sh push      - Push diretto schema"
        echo "   ./setup-prod-db.sh generate  - Genera client"
        echo "   ./setup-prod-db.sh studio    - Apri Prisma Studio"
        echo "   ./setup-prod-db.sh reset     - Reset database (PERICOLO!)"
        echo "   ./setup-prod-db.sh help      - Mostra questo help"
        ;;
esac

echo "✅ Operazione completata!"
