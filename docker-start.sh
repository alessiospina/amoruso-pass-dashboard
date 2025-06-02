#!/bin/bash

# ==============================================
# AMORUSO PASS DASHBOARD - DOCKER STARTUP SCRIPT
# ==============================================

set -e

echo "🚀 Avvio Amoruso Pass Dashboard con Docker"
echo "==========================================="

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
    echo "📋 Copiando .env.docker.example in .env..."
    cp .env.docker.example .env
    echo "✏️  Modifica il file .env con le tue configurazioni prima di continuare."
    echo "📂 File creato: .env"
    exit 1
fi

# Controlla se next.config.js è configurato per standalone
echo "🔧 Verificando configurazione Next.js..."
if ! grep -q "output: 'standalone'" next.config.js; then
    echo "⚙️  Aggiungendo configurazione standalone a next.config.js..."
    
    # Backup del file originale
    cp next.config.js next.config.js.backup
    
    # Aggiunge la configurazione standalone
    cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  // Mantieni le altre configurazioni esistenti
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
EOF
    
    echo "✅ Configurazione Next.js aggiornata"
fi

# Verifica che le variabili critiche siano impostate
echo "🔍 Verificando variabili d'ambiente..."

# Array di variabili richieste
required_vars=("JWT_SECRET" "NEXTAUTH_SECRET" "DB_PASSWORD" "SMTP_HOST" "SMTP_USER" "SMTP_PASSWORD")

# Carica il file .env
set -a
source .env
set +a

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Le seguenti variabili d'ambiente sono mancanti o vuote:"
    printf '   - %s\n' "${missing_vars[@]}"
    echo "📝 Modifica il file .env e riprova."
    exit 1
fi

echo "✅ Variabili d'ambiente verificate"

# Funzione per gestire la chiusura
cleanup() {
    echo ""
    echo "🛑 Fermando i servizi..."
    docker-compose down
    exit 0
}

# Cattura CTRL+C
trap cleanup SIGINT SIGTERM

# Scelta del comando
case "${1:-start}" in
    "build")
        echo "🔨 Building delle immagini Docker..."
        docker-compose build --no-cache
        ;;
    "start")
        echo "▶️  Avvio dei servizi..."
        echo "📊 Database: localhost:${DB_PORT:-3306}"
        echo "🌐 App: http://localhost:${APP_PORT:-3000}"
        echo "🔄 Nginx: http://localhost:${NGINX_PORT:-80}"
        echo ""
        echo "⏳ Avvio in corso... (può richiedere alcuni minuti la prima volta)"
        
        # Avvia i servizi
        docker-compose up --build
        ;;
    "stop")
        echo "🛑 Fermando i servizi..."
        docker-compose down
        ;;
    "restart")
        echo "🔄 Riavvio dei servizi..."
        docker-compose down
        docker-compose up --build
        ;;
    "logs")
        echo "📋 Visualizzando i log..."
        docker-compose logs -f
        ;;
    "db-migrate")
        echo "🗃️  Eseguendo migrazione database..."
        docker-compose exec app npx prisma migrate dev
        ;;
    "db-seed")
        echo "🌱 Popolando il database..."
        docker-compose exec app npx prisma db seed
        ;;
    "clean")
        echo "🧹 Pulizia completa..."
        docker-compose down -v
        docker system prune -f
        docker volume prune -f
        ;;
    "help"|*)
        echo "📖 Comandi disponibili:"
        echo "   ./docker-start.sh build     - Builda le immagini"
        echo "   ./docker-start.sh start     - Avvia tutti i servizi (default)"
        echo "   ./docker-start.sh stop      - Ferma tutti i servizi"
        echo "   ./docker-start.sh restart   - Riavvia tutti i servizi"
        echo "   ./docker-start.sh logs      - Mostra i log in tempo reale"
        echo "   ./docker-start.sh db-migrate - Esegue migrazioni database"
        echo "   ./docker-start.sh db-seed   - Popola il database"
        echo "   ./docker-start.sh clean     - Pulizia completa (rimuove volumi)"
        echo "   ./docker-start.sh help      - Mostra questo help"
        ;;
esac
