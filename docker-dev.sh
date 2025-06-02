#!/bin/bash

# 🐳 Script per gestire Docker Compose in ambiente di sviluppo
# Utilizzo: ./docker-dev.sh [comando] [opzioni]

set -e

# Colori per l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emoji
ROCKET="🚀"
DOCKER="🐳"
GEAR="⚙️"
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"

# File di configurazione
ENV_FILE=".env"
DOCKER_COMPOSE_FILE="docker-compose.yml"
DOCKERFILE="Dockerfile"

# Funzione per stampare l'header
print_header() {
    echo -e "${BLUE}${DOCKER} Docker Development Helper${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Funzione per stampare l'usage
print_usage() {
    echo -e "${CYAN}Utilizzo:${NC}"
    echo -e "  ./docker-dev.sh [comando] [opzioni]"
    echo ""
    echo -e "${CYAN}Comandi disponibili:${NC}"
    echo -e "  ${GREEN}build${NC}         - Builda l'immagine Docker"
    echo -e "  ${GREEN}up${NC}            - Avvia i container in background"
    echo -e "  ${GREEN}up-logs${NC}       - Avvia i container e mostra i log"
    echo -e "  ${GREEN}down${NC}          - Ferma e rimuove i container"
    echo -e "  ${GREEN}restart${NC}       - Riavvia i container"
    echo -e "  ${GREEN}rebuild${NC}       - Rebuilda tutto da zero"
    echo -e "  ${GREEN}logs${NC}          - Mostra i log dei container"
    echo -e "  ${GREEN}status${NC}        - Mostra lo stato dei container"
    echo -e "  ${GREEN}clean${NC}         - Pulisce immagini e volumi non utilizzati"
    echo -e "  ${GREEN}shell${NC}         - Apre una shell nel container dell'app"
    echo -e "  ${GREEN}db-shell${NC}      - Apre una shell MySQL nel container del database"
    echo -e "  ${GREEN}help${NC}          - Mostra questo messaggio"
    echo ""
    echo -e "${CYAN}Opzioni:${NC}"
    echo -e "  ${YELLOW}--no-cache${NC}    - Rebuilda senza usare la cache Docker"
    echo -e "  ${YELLOW}--force${NC}       - Forza l'operazione senza conferma"
    echo -e "  ${YELLOW}--follow${NC}      - Segue i log in tempo reale"
    echo ""
    echo -e "${CYAN}Esempi:${NC}"
    echo -e "  ./docker-dev.sh build --no-cache"
    echo -e "  ./docker-dev.sh up-logs"
    echo -e "  ./docker-dev.sh logs --follow"
}

# Funzione per verificare i prerequisiti
check_prerequisites() {
    echo -e "${INFO} Verificando prerequisiti..."
    
    # Verifica Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${CROSS} Docker non è installato!"
        exit 1
    fi
    
    # Verifica Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${CROSS} Docker Compose non è installato!"
        exit 1
    fi
    
    # Verifica file .env
    if [[ ! -f "$ENV_FILE" ]]; then
        echo -e "${WARNING} File $ENV_FILE non trovato!"
        echo -e "${INFO} Copio il file .env.example..."
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            echo -e "${CHECK} File .env creato da .env.example"
        else
            echo -e "${CROSS} File .env.example non trovato!"
            exit 1
        fi
    fi
    
    # Verifica docker-compose.yml
    if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
        echo -e "${CROSS} File $DOCKER_COMPOSE_FILE non trovato!"
        exit 1
    fi
    
    echo -e "${CHECK} Tutti i prerequisiti soddisfatti"
}

# Funzione per caricare le variabili d'ambiente
load_env() {
    echo -e "${GEAR} Caricando variabili d'ambiente da $ENV_FILE..."
    
    if [[ -f "$ENV_FILE" ]]; then
        export $(cat $ENV_FILE | grep -v '^#' | grep -v '^$' | xargs)
        echo -e "${CHECK} Variabili d'ambiente caricate"
        
        # Mostra alcune info del progetto
        echo -e "${INFO} Progetto: ${CYAN}${PROJECT_NAME:-amoruso-pass-dashboard}${NC}"
        echo -e "${INFO} Ambiente: ${CYAN}development${NC}"
        echo -e "${INFO} Porta applicazione: ${CYAN}${PORT:-3000}${NC}"
    else
        echo -e "${WARNING} File $ENV_FILE non trovato, uso valori di default"
    fi
}

# Funzione per il build
docker_build() {
    local no_cache=""
    
    if [[ "$1" == "--no-cache" ]]; then
        no_cache="--no-cache"
        echo -e "${GEAR} Building con --no-cache..."
    else
        echo -e "${GEAR} Building immagine Docker..."
    fi
    
    # Usa docker compose se disponibile, altrimenti docker-compose
    if docker compose version &> /dev/null; then
        docker compose build $no_cache
    else
        docker-compose build $no_cache
    fi
    
    echo -e "${CHECK} Build completato!"
}

# Funzione per avviare i container
docker_up() {
    local detach="-d"
    local follow_logs=false
    
    if [[ "$1" == "--logs" ]] || [[ "$1" == "logs" ]]; then
        detach=""
        follow_logs=true
    fi
    
    echo -e "${ROCKET} Avviando i container..."
    
    if docker compose version &> /dev/null; then
        docker compose up $detach
    else
        docker-compose up $detach
    fi
    
    if [[ "$follow_logs" == false ]]; then
        echo -e "${CHECK} Container avviati in background!"
        echo -e "${INFO} Usa '${GREEN}./docker-dev.sh logs${NC}' per vedere i log"
        echo -e "${INFO} Usa '${GREEN}./docker-dev.sh status${NC}' per vedere lo stato"
    fi
}

# Funzione per fermare i container
docker_down() {
    echo -e "${GEAR} Fermando i container..."
    
    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi
    
    echo -e "${CHECK} Container fermati!"
}

# Funzione per riavviare
docker_restart() {
    echo -e "${GEAR} Riavviando i container..."
    docker_down
    docker_up
}

# Funzione per rebuild completo
docker_rebuild() {
    echo -e "${WARNING} Rebuild completo: fermerò tutti i container e ribuilderò tutto"
    
    if [[ "$1" != "--force" ]]; then
        read -p "Sei sicuro? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${INFO} Operazione annullata"
            exit 0
        fi
    fi
    
    echo -e "${GEAR} Fermando container..."
    docker_down
    
    echo -e "${GEAR} Rimuovendo immagini esistenti..."
    if docker compose version &> /dev/null; then
        docker compose down --rmi local
    else
        docker-compose down --rmi local
    fi
    
    echo -e "${GEAR} Rebuilding..."
    docker_build --no-cache
    
    echo -e "${ROCKET} Riavviando..."
    docker_up
    
    echo -e "${CHECK} Rebuild completo terminato!"
}

# Funzione per mostrare i log
docker_logs() {
    local follow=""
    
    if [[ "$1" == "--follow" ]] || [[ "$1" == "-f" ]]; then
        follow="-f"
    fi
    
    echo -e "${INFO} Mostrando log dei container..."
    
    if docker compose version &> /dev/null; then
        docker compose logs $follow
    else
        docker-compose logs $follow
    fi
}

# Funzione per mostrare lo status
docker_status() {
    echo -e "${INFO} Stato dei container:"
    
    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
    
    echo ""
    echo -e "${INFO} Uso risorse Docker:"
    docker system df
}

# Funzione per pulire
docker_clean() {
    echo -e "${WARNING} Pulizia di immagini e volumi non utilizzati..."
    
    if [[ "$1" != "--force" ]]; then
        read -p "Sei sicuro? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${INFO} Operazione annullata"
            exit 0
        fi
    fi
    
    echo -e "${GEAR} Rimuovendo immagini non utilizzate..."
    docker image prune -f
    
    echo -e "${GEAR} Rimuovendo volumi non utilizzati..."
    docker volume prune -f
    
    echo -e "${GEAR} Rimuovendo network non utilizzati..."
    docker network prune -f
    
    echo -e "${CHECK} Pulizia completata!"
}

# Funzione per aprire shell nell'app
docker_shell() {
    echo -e "${INFO} Aprendo shell nel container dell'applicazione..."
    
    if docker compose version &> /dev/null; then
        docker compose exec app /bin/bash
    else
        docker-compose exec app /bin/bash
    fi
}

# Funzione per aprire shell nel database
docker_db_shell() {
    echo -e "${INFO} Aprendo shell MySQL nel container del database..."
    
    if docker compose version &> /dev/null; then
        docker compose exec db mysql -u${DB_USER:-root} -p${DB_PASSWORD:-password} ${DB_NAME:-amoruso_pass_db}
    else
        docker-compose exec db mysql -u${DB_USER:-root} -p${DB_PASSWORD:-password} ${DB_NAME:-amoruso_pass_db}
    fi
}

# Main script
main() {
    print_header
    
    # Se non ci sono argomenti, mostra l'usage
    if [[ $# -eq 0 ]]; then
        print_usage
        exit 0
    fi
    
    # Controlla prerequisiti
    check_prerequisites
    
    # Carica environment variables
    load_env
    
    # Parse del comando
    case "$1" in
        "build")
            shift
            docker_build "$@"
            ;;
        "up")
            shift
            docker_up "$@"
            ;;
        "up-logs")
            shift
            docker_up "logs" "$@"
            ;;
        "down")
            shift
            docker_down "$@"
            ;;
        "restart")
            shift
            docker_restart "$@"
            ;;
        "rebuild")
            shift
            docker_rebuild "$@"
            ;;
        "logs")
            shift
            docker_logs "$@"
            ;;
        "status")
            shift
            docker_status "$@"
            ;;
        "clean")
            shift
            docker_clean "$@"
            ;;
        "shell")
            shift
            docker_shell "$@"
            ;;
        "db-shell")
            shift
            docker_db_shell "$@"
            ;;
        "help"|"-h"|"--help")
            print_usage
            ;;
        *)
            echo -e "${CROSS} Comando sconosciuto: $1"
            echo ""
            print_usage
            exit 1
            ;;
    esac
}

# Esegui il main con tutti gli argomenti
main "$@"
