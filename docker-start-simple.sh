#!/bin/bash

# ==============================================
# AMORUSO PASS DASHBOARD - DOCKER SIMPLE
# ==============================================

set -e

echo "🚀 Avvio Amoruso Pass Dashboard (Database Esterno)"
echo "=================================================="

# Controlla se Docker è installato
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non è installato. Installalo da https://docker.com"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose non è installato. Installalo da https://docs.docker.com/compose/install/"
    exit 1
fi

# Controlla se il file .env esiste
if [ ! -f .env ]; then
    echo "⚠️  File .env non trovato!"
    echo "📋 Copiando .env.simple.example in .env..."
    cp .env.simple.example .env
    echo "✏️  Modifica il file .env con le tue configurazioni prima di continuare."
    echo "📂 File creato: .env"
    echo ""
    echo "🔑 IMPORTANTE: Configura DATABASE_URL nel file .env"
    echo "    Esempio: DATABASE_URL=mysql://user:pass@host:3306/database"
    exit 1
fi

# Verifica che DATABASE_URL sia configurato
echo "🔍 Verificando configurazione database..."

# Carica il file .env
set -a
source .env
set +a

if [ -z "$DATABASE_URL" ] || [[ "$DATABASE_URL" == *"username:password@host"* ]]; then
    echo "❌ DATABASE_URL non configurato correttamente nel file .env"
    echo "📝 Esempio: DATABASE_URL=mysql://user:pass@host:3306/database"
    exit 1
fi

echo "✅ Database URL configurato"

# Funzione per gestire la chiusura
cleanup() {
    echo ""
    echo "🛑 Fermando i servizi..."
    docker-compose -f docker-compose.simple.yml down
    exit 0
}

# Cattura CTRL+C
trap cleanup SIGINT SIGTERM

# Scelta del comando
case "${1:-start}" in
    "build")
        echo "🔨 Building dell'immagine Docker..."
        docker-compose -f docker-compose.simple.yml build --no-cache
        ;;
    "start")
        echo "▶️  Avvio dei servizi..."
        echo "🌐 App: http://localhost:${APP_PORT:-3000}"
        echo "🔄 Nginx: http://localhost:${NGINX_PORT:-80}"
        echo ""
        echo "⏳ Avvio in corso... (può richiedere alcuni minuti la prima volta)"
        
        # Avvia i servizi
        docker-compose -f docker-compose.simple.yml up --build
        ;;
    "stop")
        echo "🛑 Fermando i servizi..."
        docker-compose -f docker-compose.simple.yml down
        ;;
    "restart")
        echo "🔄 Riavvio dei servizi..."
        docker-compose -f docker-compose.simple.yml down
        docker-compose -f docker-compose.simple.yml up --build
        ;;
    "logs")
        echo "📋 Visualizzando i log..."
        docker-compose -f docker-compose.simple.yml logs -f
        ;;
    "migrate")
        echo "🗃️  Eseguendo migrazione database..."
        docker-compose -f docker-compose.simple.yml exec app npx prisma migrate deploy
        ;;
    "generate")
        echo "⚙️  Generando client Prisma..."
        docker-compose -f docker-compose.simple.yml exec app npx prisma generate
        ;;
    "clean")
        echo "🧹 Pulizia..."
        docker-compose -f docker-compose.simple.yml down
        docker system prune -f
        ;;
    "help"|*)
        echo "📖 Comandi disponibili:"
        echo "   ./docker-start-simple.sh build     - Builda l'immagine"
        echo "   ./docker-start-simple.sh start     - Avvia i servizi (default)"
        echo "   ./docker-start-simple.sh stop      - Ferma i servizi"
        echo "   ./docker-start-simple.sh restart   - Riavvia i servizi"
        echo "   ./docker-start-simple.sh logs      - Mostra i log"
        echo "   ./docker-start-simple.sh migrate   - Esegue migrazioni"
        echo "   ./docker-start-simple.sh generate  - Genera client Prisma"
        echo "   ./docker-start-simple.sh clean     - Pulizia"
        echo "   ./docker-start-simple.sh help      - Mostra questo help"
        echo ""
        echo "💾 Database esterno richiesto!"
        echo "   Configura DATABASE_URL nel file .env"
        ;;
esac
