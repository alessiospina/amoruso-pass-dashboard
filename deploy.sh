#!/bin/bash

# ==============================================
# AMORUSO PASS DASHBOARD - DEPLOY COMPLETO
# ==============================================

set -e

echo "🚀 Deploy completo Amoruso Pass Dashboard"
echo "=========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzioni utility
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Controlla prerequisiti
print_step "Controllo prerequisiti..."

if ! command -v docker &> /dev/null; then
    print_error "Docker non installato!"
    echo "Installa Docker da: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose non installato!"
    echo "Installa Docker Compose da: https://docs.docker.com/compose/install/"
    exit 1
fi

print_success "Prerequisiti OK"

# Configura ambiente
print_step "Configurazione ambiente..."

if [ ! -f .env ]; then
    print_warning "File .env non trovato, creando da template..."
    cp .env.docker.example .env
    
    # Genera segreti sicuri
    JWT_SECRET=$(openssl rand -base64 32)
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
    
    # Sostituisce i placeholder
    sed -i.bak "s/your-super-secret-jwt-key-minimum-32-characters-long-change-this-in-production/$JWT_SECRET/g" .env
    sed -i.bak "s/your-super-secret-nextauth-key-minimum-32-characters-long-change-this-in-production/$NEXTAUTH_SECRET/g" .env
    sed -i.bak "s/secure_db_password_change_this/$DB_PASSWORD/g" .env
    
    rm .env.bak
    
    print_warning "File .env creato con segreti generati automaticamente"
    print_warning "CONFIGURA le variabili email prima di continuare!"
    
    echo ""
    echo "📝 Modifica questi campi nel file .env:"
    echo "   SMTP_HOST=smtp.ovh.net"
    echo "   SMTP_USER=your-email@yourdomain.com"
    echo "   SMTP_PASSWORD=your-email-password"
    echo "   SMTP_FROM=your-email@yourdomain.com"
    echo ""
    
    read -p "Premi ENTER dopo aver configurato l'email..."
fi

print_success "Ambiente configurato"

# Rendi eseguibili gli script
print_step "Configurazione script..."
chmod +x docker-start.sh
chmod +x docker-setup.sh
print_success "Script configurati"

# Build e avvio
print_step "Build e avvio servizi..."
echo "Questo potrebbe richiedere diversi minuti la prima volta..."

./docker-start.sh build

if [ $? -eq 0 ]; then
    print_success "Build completato"
else
    print_error "Errore durante il build"
    exit 1
fi

# Avvia i servizi
print_step "Avvio servizi..."
docker-compose up -d

# Attendi che i servizi siano pronti
print_step "Attendendo che i servizi siano pronti..."
sleep 30

# Controlla stato servizi
print_step "Controllo stato servizi..."
if docker-compose ps | grep -q "Up"; then
    print_success "Servizi avviati correttamente"
else
    print_error "Alcuni servizi non sono partiti correttamente"
    docker-compose ps
    exit 1
fi

# Setup post-deploy
print_step "Eseguendo setup post-deploy..."
chmod +x docker-setup.sh
./docker-setup.sh

# Test finale
print_step "Test finale..."

# Test connessione database
if docker-compose exec -T database mysql -u root -p$DB_ROOT_PASSWORD -e "SELECT 1" &> /dev/null; then
    print_success "Database: OK"
else
    print_warning "Database: Problemi di connessione"
fi

# Test applicazione
if curl -f http://localhost:${APP_PORT:-3000}/api/health &> /dev/null; then
    print_success "Applicazione: OK"
else
    print_warning "Applicazione: Non risponde"
fi

# Riepilogo finale
echo ""
echo "🎉 Deploy completato!"
echo "===================="
echo ""
echo "📍 Servizi disponibili:"
echo "   🌐 Dashboard: http://localhost:${APP_PORT:-3000}"
echo "   🗄️  Database:  localhost:${DB_PORT:-3306}"
echo "   🔄 Nginx:     http://localhost:${NGINX_PORT:-80}"
echo ""
echo "🔑 Credenziali predefinite:"
echo "   📧 Email:    admin@amoruso.com"
echo "   🔐 Password: admin123"
echo ""
echo "⚠️  AZIONI IMMEDIATE:"
echo "   1. Vai su http://localhost:${APP_PORT:-3000}"
echo "   2. Fai login con le credenziali sopra"
echo "   3. CAMBIA IMMEDIATAMENTE la password"
echo "   4. Verifica che l'email funzioni"
echo ""
echo "📊 Gestione:"
echo "   ./docker-start.sh logs    - Visualizza log"
echo "   ./docker-start.sh restart - Riavvia tutto"
echo "   ./docker-start.sh stop    - Ferma tutto"
echo "   ./docker-start.sh clean   - Reset completo"
echo ""
echo "📚 Documentazione: README-DOCKER.md"
echo ""

# Mostra log in tempo reale
echo "📋 Vuoi vedere i log in tempo reale? (y/N)"
read -r show_logs

if [[ $show_logs =~ ^[Yy]$ ]]; then
    echo "📋 Mostrando log... (CTRL+C per uscire)"
    docker-compose logs -f
fi
