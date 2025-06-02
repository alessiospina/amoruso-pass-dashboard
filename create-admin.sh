#!/bin/bash

# ==============================================
# CREAZIONE ADMIN USER - AMORUSO PASS
# ==============================================

set -e

echo "👤 Creazione Utente Amministratore"
echo "=================================="

# Funzione per creare admin
create_admin() {
    local env_file=$1
    local env_name=$2
    
    echo ""
    echo "🔧 Creando admin per ambiente: $env_name"
    echo "📂 File config: $env_file"
    
    # Carica le variabili d'ambiente
    if [ -f "$env_file" ]; then
        export $(grep -v '^#' "$env_file" | grep -v '^$' | xargs)
        echo "✅ Configurazioni caricate da $env_file"
    else
        echo "❌ File $env_file non trovato!"
        return 1
    fi
    
    # Mostra il database in uso
    echo "🔍 Database: ${DATABASE_URL%%\?*}"
    
    # Parametri personalizzati se forniti
    if [ $# -ge 4 ]; then
        echo "📝 Usando parametri personalizzati..."
        npm run create:admin "$3" "$4" "$5"
    else
        echo "📝 Usando configurazione predefinita..."
        npm run create:admin
    fi
}

# Scelta dell'ambiente
case "${1:-both}" in
    "dev"|"development")
        echo "🛠️  Ambiente: SVILUPPO"
        create_admin ".env" "SVILUPPO" "$2" "$3" "$4"
        ;;
    "prod"|"production")
        echo "🚀 Ambiente: PRODUZIONE"
        create_admin ".env.production" "PRODUZIONE" "$2" "$3" "$4"
        ;;
    "both")
        echo "🔄 Entrambi gli ambienti"
        echo ""
        
        # Sviluppo
        if [ -f ".env" ]; then
            create_admin ".env" "SVILUPPO" "$2" "$3" "$4"
        else
            echo "⚠️  File .env non trovato, saltando sviluppo..."
        fi
        
        echo ""
        echo "───────────────────────────────────────"
        
        # Produzione
        if [ -f ".env.production" ]; then
            create_admin ".env.production" "PRODUZIONE" "$2" "$3" "$4"
        else
            echo "⚠️  File .env.production non trovato, saltando produzione..."
        fi
        ;;
    "help"|*)
        echo "📖 Utilizzo:"
        echo ""
        echo "   ./create-admin.sh [ambiente] [email] [password] [nome]"
        echo ""
        echo "🌍 Ambienti disponibili:"
        echo "   dev|development  - Solo database di sviluppo"
        echo "   prod|production  - Solo database di produzione"
        echo "   both            - Entrambi (default)"
        echo ""
        echo "📝 Esempi:"
        echo "   ./create-admin.sh                                    # Entrambi con config predefinita"
        echo "   ./create-admin.sh dev                                # Solo sviluppo"
        echo "   ./create-admin.sh prod                               # Solo produzione"
        echo "   ./create-admin.sh both admin@test.com mypass123      # Entrambi con email/pass personalizzate"
        echo "   ./create-admin.sh dev admin@dev.com devpass \"Admin Dev\"  # Solo dev con parametri custom"
        echo ""
        echo "🔑 Configurazione predefinita:"
        echo "   📧 Email: admin@amorusopass.com"
        echo "   🔑 Password: admin123!"
        echo "   👤 Nome: Amministratore Sistema"
        ;;
esac

echo ""
echo "✅ Operazione completata!"
echo "🔐 Non dimenticare di cambiare la password dopo il primo accesso!"
