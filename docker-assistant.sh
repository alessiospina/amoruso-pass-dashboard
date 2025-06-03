#!/bin/bash

# 🐳 Script per gestire Docker Compose in ambiente di sviluppo
# Utilizzo: ./docker-assistant.sh [comando] [opzioni]

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
VERSION_FILE="VERSION"

# Configurazione registry
REGISTRY_HOST="salernocruises.it:5000"
IMAGE_NAME="amorusopassdashboard"

# Funzione per stampare l'header
print_header() {
    echo -e "${BLUE}${DOCKER} Docker Development Helper${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Funzione per stampare l'usage
print_usage() {
    echo -e "${CYAN}Utilizzo:${NC}"
    echo -e "  ./docker-assistant.sh [comando] [opzioni]"
    echo ""
    echo -e "${CYAN}Comandi di sviluppo:${NC}"
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
    echo ""
    echo -e "${CYAN}Comandi di deploy:${NC}"
    echo -e "  ${GREEN}deploy${NC}        - Builda e pusha l'immagine sul registry"
    echo -e "  ${GREEN}version${NC}       - Gestisce le versioni (show/bump/set)"
    echo -e "  ${GREEN}generate-run${NC}  - Genera comando docker run per il server"
    echo -e "  ${GREEN}prepare-deploy${NC} - Prepara file per deploy con Nginx"
    echo -e "  ${GREEN}remote-deploy${NC} - Deploy automatico via SSH"
    echo -e "  ${GREEN}help${NC}          - Mostra questo messaggio"
    echo ""
    echo -e "${CYAN}Opzioni:${NC}"
    echo -e "  ${YELLOW}--no-cache${NC}    - Rebuilda senza usare la cache Docker"
    echo -e "  ${YELLOW}--force${NC}       - Forza l'operazione senza conferma"
    echo -e "  ${YELLOW}--follow${NC}      - Segue i log in tempo reale"
    echo -e "  ${YELLOW}--env <file>${NC}  - Specifica file env per il deploy (.env, .env.production, .env.development)"
    echo -e "  ${YELLOW}--version <v>${NC} - Specifica versione per il deploy (es: v1.2.3)"
    echo -e "  ${YELLOW}--patch${NC}       - Incrementa patch version (x.x.X)"
    echo -e "  ${YELLOW}--minor${NC}       - Incrementa minor version (x.X.x)"
    echo -e "  ${YELLOW}--major${NC}       - Incrementa major version (X.x.x)"
    echo -e "  ${YELLOW}--host <server>${NC} - Host SSH per deploy remoto"
    echo -e "  ${YELLOW}--user <user>${NC}  - User SSH per deploy remoto"
    echo -e "  ${YELLOW}--password <pwd>${NC} - Password SSH (opzionale, verrà chiesta se non specificata)"
    echo -e "  ${YELLOW}--path <path>${NC}  - Path di deploy sul server (default: /home/deploy/amoruso-pass)"
    echo -e "  ${YELLOW}--port <port>${NC}  - Porta SSH (default: 22)"
    echo ""
    echo -e "${CYAN}Esempi:${NC}"
    echo -e "  ./docker-assistant.sh build --no-cache"
    echo -e "  ./docker-assistant.sh up-logs"
    echo -e "  ./docker-assistant.sh deploy --env .env.production --version v1.2.3"
    echo -e "  ./docker-assistant.sh deploy --env .env.production --patch"
    echo -e "  ./docker-assistant.sh version bump --minor"
    echo -e "  ./docker-assistant.sh generate-run --version v1.2.3"
    echo -e "  ./docker-assistant.sh prepare-deploy --version v1.2.3"
    echo -e "  ./docker-assistant.sh remote-deploy --host server.com --user myuser --version v1.2.3"
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

# ================================
# FUNZIONI PER DEPLOY E VERSIONING
# ================================

# Funzione per gestire il file VERSION
get_current_version() {
    if [[ -f "$VERSION_FILE" ]]; then
        cat "$VERSION_FILE"
    else
        echo "v1.0.0"
    fi
}

# Funzione per salvare la versione
save_version() {
    local version=$1
    echo "$version" > "$VERSION_FILE"
    echo -e "${CHECK} Versione salvata: ${CYAN}$version${NC}"
}

# Funzione per incrementare la versione
bump_version() {
    local current_version=$(get_current_version)
    local version_type="$1"
    
    # Rimuovi 'v' se presente
    local clean_version=${current_version#v}
    
    # Divide la versione in major.minor.patch
    IFS='.' read -ra VERSION_PARTS <<< "$clean_version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case "$version_type" in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch")
            patch=$((patch + 1))
            ;;
        *)
            echo -e "${CROSS} Tipo versione non valido: $version_type"
            echo -e "${INFO} Usa: major, minor, o patch"
            exit 1
            ;;
    esac
    
    local new_version="v${major}.${minor}.${patch}"
    echo "$new_version"
}

# Funzione per gestire le versioni
version_command() {
    local action="$1"
    local type="$2"
    
    case "$action" in
        "show")
            local current=$(get_current_version)
            echo -e "${INFO} Versione corrente: ${CYAN}$current${NC}"
            ;;
        "bump")
            if [[ -z "$type" ]]; then
                echo -e "${CROSS} Specifica il tipo di bump: major, minor, o patch"
                exit 1
            fi
            local current=$(get_current_version)
            local new_version=$(bump_version "$type")
            echo -e "${INFO} Versione corrente: ${CYAN}$current${NC}"
            echo -e "${INFO} Nuova versione: ${CYAN}$new_version${NC}"
            save_version "$new_version"
            ;;
        "set")
            if [[ -z "$type" ]]; then
                echo -e "${CROSS} Specifica la versione da impostare (es: v1.2.3)"
                exit 1
            fi
            save_version "$type"
            ;;
        *)
            echo -e "${CROSS} Azione non valida: $action"
            echo -e "${INFO} Usa: show, bump, o set"
            exit 1
            ;;
    esac
}

# Funzione per selezionare il file env
select_env_file() {
    local env_arg="$1"
    local env_file=""
    
    if [[ -n "$env_arg" ]]; then
        env_file="$env_arg"
    else
        echo -e "${INFO} Seleziona il file di configurazione:" >&2
        echo -e "  ${GREEN}1${NC} - .env (development)" >&2
        echo -e "  ${GREEN}2${NC} - .env.production" >&2
        echo -e "  ${GREEN}3${NC} - .env.development" >&2
        echo -e "  ${GREEN}4${NC} - Specifica file personalizzato" >&2
        
        read -p "Scelta [1-4]: " -n 1 -r
        echo >&2
        
        case $REPLY in
            1) env_file=".env" ;;
            2) env_file=".env.production" ;;
            3) env_file=".env.development" ;;
            4) 
                read -p "Inserisci il path del file env: " env_file
                ;;
            *)
                echo -e "${CROSS} Scelta non valida" >&2
                exit 1
                ;;
        esac
    fi
    
    if [[ ! -f "$env_file" ]]; then
        echo -e "${CROSS} File env non trovato: $env_file" >&2
        exit 1
    fi
    
    echo -e "${CHECK} File env selezionato: ${CYAN}$env_file${NC}" >&2
    echo "$env_file"
}

# Funzione per build e push dell'immagine
deploy_image() {
    local env_file=""
    local version=""
    local no_cache=""
    
    # Parse argomenti
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env)
                env_file="$2"
                shift 2
                ;;
            --version)
                version="$2"
                shift 2
                ;;
            --patch)
                version=$(bump_version "patch")
                save_version "$version"
                shift
                ;;
            --minor)
                version=$(bump_version "minor")
                save_version "$version"
                shift
                ;;
            --major)
                version=$(bump_version "major")
                save_version "$version"
                shift
                ;;
            --no-cache)
                no_cache="--no-cache"
                shift
                ;;
            *)
                echo -e "${CROSS} Opzione sconosciuta: $1"
                exit 1
                ;;
        esac
    done
    
    # Seleziona env file se non specificato
    if [[ -z "$env_file" ]]; then
        env_file=$(select_env_file)
    else
        env_file=$(select_env_file "$env_file")
    fi
    
    # Usa versione corrente se non specificata
    if [[ -z "$version" ]]; then
        version=$(get_current_version)
    fi
    
    echo -e "${ROCKET} Iniziando deploy dell'immagine..."
    echo -e "${INFO} Versione: ${CYAN}$version${NC}"
    echo -e "${INFO} Env file: ${CYAN}$env_file${NC}"
    echo -e "${INFO} Registry: ${CYAN}$REGISTRY_HOST${NC}"
    
    # Conferma
    read -p "Procedere con il deploy? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${INFO} Deploy annullato"
        exit 0
    fi
    
    # Build dell'immagine
    echo -e "${GEAR} Building immagine per linux/amd64..."
    docker buildx build --platform linux/amd64 $no_cache \
        --build-arg ENV_FILE="$env_file" \
        -t "$IMAGE_NAME:$version" .
    
    if [[ $? -ne 0 ]]; then
        echo -e "${CROSS} Errore durante il build"
        exit 1
    fi
    
    # Tag per il registry
    echo -e "${GEAR} Tagging immagine per il registry..."
    docker tag "$IMAGE_NAME:$version" "$REGISTRY_HOST/$IMAGE_NAME:$version"
    
    # Push al registry
    echo -e "${GEAR} Push al registry..."
    docker push "$REGISTRY_HOST/$IMAGE_NAME:$version"
    
    if [[ $? -ne 0 ]]; then
        echo -e "${CROSS} Errore durante il push"
        exit 1
    fi
    
    echo -e "${CHECK} Deploy completato con successo!"
    echo -e "${INFO} Immagine disponibile: ${CYAN}$REGISTRY_HOST/$IMAGE_NAME:$version${NC}"
    
    # Genera comandi per il server
    generate_server_commands "$version"
}

# Funzione per generare comandi docker run
generate_server_commands() {
    local version="$1"
    
    if [[ -z "$version" ]]; then
        version=$(get_current_version)
    fi
    
    echo ""
    echo -e "${INFO} ${BLUE}Comandi per il server di produzione:${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${CYAN}# 1. Copia file di configurazione:${NC}"
    echo "scp docker-compose.production.yml server:/path/to/deploy/"
    echo "scp nginx.conf server:/path/to/deploy/"
    echo ""
    echo -e "${CYAN}# 2. Sul server, imposta la versione:${NC}"
    echo "export APP_VERSION=$version"
    echo ""
    echo -e "${CYAN}# 3. Pull dell'immagine:${NC}"
    echo "docker pull localhost:5000/$IMAGE_NAME:$version"
    echo ""
    echo -e "${CYAN}# 4. Deploy con docker-compose:${NC}"
    echo "docker-compose -f docker-compose.production.yml down"
    echo "docker-compose -f docker-compose.production.yml up -d"
    echo ""
    echo -e "${CYAN}# 5. Verifica deploy:${NC}"
    echo "docker-compose -f docker-compose.production.yml ps"
    echo "docker-compose -f docker-compose.production.yml logs -f"
    echo ""
    echo -e "${CYAN}# 6. Test connettività:${NC}"
    echo "curl -I http://localhost:8000"
    echo ""
    echo -e "${WARNING} ${YELLOW}NOTA: Modifica i path secondo la tua configurazione server${NC}"
}

# Funzione per preparare i file di deploy
prepare_deployment_files() {
    local version=""
    local target_dir="deploy"
    
    # Parse argomenti
    while [[ $# -gt 0 ]]; do
        case $1 in
            --version)
                version="$2"
                shift 2
                ;;
            --target)
                target_dir="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
    
    if [[ -z "$version" ]]; then
        version=$(get_current_version)
    fi
    
    echo -e "${GEAR} Preparando file di deploy..."
    echo -e "${INFO} Versione: ${CYAN}$version${NC}"
    echo -e "${INFO} Directory: ${CYAN}$target_dir${NC}"
    
    # Crea directory di deploy
    mkdir -p "$target_dir"
    
    # Copia docker-compose.production.yml
    cp docker-compose.production.yml "$target_dir/"
    
    # Copia nginx.conf
    cp nginx.conf "$target_dir/"
    
    # Crea file .env per il server
    cat > "$target_dir/.env" << EOF
APP_VERSION=$version
COMPOSE_PROJECT_NAME=amoruso-pass
EOF
    
    # Crea script di deploy
    cat > "$target_dir/deploy.sh" << EOF
#!/bin/bash
set -e

echo "🚀 Deploy Amoruso Pass Dashboard v$version"
echo "=========================================="

# Carica variabili
export APP_VERSION=$version

# Pull immagine
echo "📥 Pull immagine..."
docker pull localhost:5000/$IMAGE_NAME:$version

# Deploy
echo "🔄 Deploy containers..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# Verifica
echo "✅ Verifica deploy..."
sleep 5
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🎉 Deploy completato!"
echo "📊 App disponibile su: http://localhost:8000"
echo "📋 Log: docker-compose -f docker-compose.production.yml logs -f"
EOF
    
    chmod +x "$target_dir/deploy.sh"
    
    echo -e "${CHECK} File di deploy preparati in: ${CYAN}$target_dir/${NC}"
    echo ""
    echo -e "${INFO} File creati:"
    echo -e "  📄 docker-compose.production.yml"
    echo -e "  📄 nginx.conf"
    echo -e "  📄 .env"
    echo -e "  📄 deploy.sh"
    echo ""
    echo -e "${INFO} ${BLUE}Per deployare sul server:${NC}"
    echo -e "  1. ${CYAN}scp -r $target_dir/ user@server:/path/to/deploy/${NC}"
    echo -e "  2. ${CYAN}ssh user@server 'cd /path/to/deploy && ./deploy.sh'${NC}"
}

# Funzione per deploy automatico via SSH
remote_deploy() {
    local version=""
    local ssh_host=""
    local ssh_user=""
    local ssh_password=""
    local deploy_path="/home/deploy/amoruso-pass"
    local ssh_port="22"
    
    # Parse argomenti
    while [[ $# -gt 0 ]]; do
        case $1 in
            --version)
                version="$2"
                shift 2
                ;;
            --host)
                ssh_host="$2"
                shift 2
                ;;
            --user)
                ssh_user="$2"
                shift 2
                ;;
            --password)
                ssh_password="$2"
                shift 2
                ;;
            --path)
                deploy_path="$2"
                shift 2
                ;;
            --port)
                ssh_port="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
    
    if [[ -z "$version" ]]; then
        version=$(get_current_version)
    fi
    
    if [[ -z "$ssh_host" ]] || [[ -z "$ssh_user" ]]; then
        echo -e "${CROSS} Specifica host e user SSH"
        echo -e "${INFO} Uso: ./docker-assistant.sh remote-deploy --host server.com --user myuser --password mypass --version v1.2.3"
        exit 1
    fi
    
    # Se non è specificata password, chiedila
    if [[ -z "$ssh_password" ]]; then
        echo -n "Password SSH per ${ssh_user}@${ssh_host}: "
        read -s ssh_password
        echo
    fi
    
    local ssh_target="${ssh_user}@${ssh_host}"
    local ssh_cmd=""
    local scp_cmd=""
    
    # Configura comandi SSH con password o chiave
    if [[ -n "$ssh_password" ]]; then
        if ! command -v sshpass &> /dev/null; then
            echo -e "${CROSS} sshpass non installato. Installa con: brew install sshpass"
            exit 1
        fi
        ssh_cmd="sshpass -p '$ssh_password' ssh -p $ssh_port -o StrictHostKeyChecking=no"
        scp_cmd="sshpass -p '$ssh_password' scp -P $ssh_port -o StrictHostKeyChecking=no"
    else
        ssh_cmd="ssh -p $ssh_port"
        scp_cmd="scp -P $ssh_port"
    fi
    
    echo -e "${ROCKET} Deploy automatico via SSH"
    echo -e "${INFO} Target: ${CYAN}${ssh_target}:${ssh_port}${NC}"
    echo -e "${INFO} Path: ${CYAN}${deploy_path}${NC}"
    echo -e "${INFO} Versione: ${CYAN}${version}${NC}"
    echo ""
    
    # Test connessione
    echo -e "${GEAR} Test connessione SSH..."
    if ! eval "$ssh_cmd $ssh_target 'echo \"Connessione SSH OK\"'"; then
        echo -e "${CROSS} Connessione SSH fallita"
        exit 1
    fi
    
    # Conferma
    read -p "Procedere con il deploy remoto? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${INFO} Deploy annullato"
        exit 0
    fi
    
    echo -e "${GEAR} Preparando file di deploy localmente..."
    
    # Prepara file temporanei
    local temp_dir=$(mktemp -d)
    
    # Copia file necessari
    cp docker-compose.production.yml "$temp_dir/"
    cp nginx.conf "$temp_dir/"
    
    # Crea .env per il server
    cat > "$temp_dir/.env" << EOF
APP_VERSION=$version
COMPOSE_PROJECT_NAME=amoruso-pass
EOF
    
    # Crea script di deploy remoto
    cat > "$temp_dir/deploy.sh" << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploy Amoruso Pass Dashboard"
echo "================================="

# Carica variabili d'ambiente
if [[ -f .env ]]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [[ -z "$APP_VERSION" ]]; then
    echo "❌ APP_VERSION non definita"
    exit 1
fi

echo "📋 Versione: $APP_VERSION"

# Verifica Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non installato"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose non installato"
    exit 1
fi

# Pull immagine
echo "📥 Pull immagine localhost:5000/amorusospa-dashboard-be:$APP_VERSION..."
docker pull localhost:5000/amorusospa-dashboard-be:$APP_VERSION

# Stop container esistenti
echo "🛑 Stop container esistenti..."
if docker compose version &> /dev/null; then
    docker compose -f docker-compose.production.yml down || true
else
    docker-compose -f docker-compose.production.yml down || true
fi

# Avvia nuovi container
echo "🚀 Avvio nuovi container..."
if docker compose version &> /dev/null; then
    docker compose -f docker-compose.production.yml up -d
else
    docker-compose -f docker-compose.production.yml up -d
fi

# Attendi avvio
echo "⏳ Attendo avvio servizi..."
sleep 10

# Verifica stato
echo "✅ Verifica stato:"
if docker compose version &> /dev/null; then
    docker compose -f docker-compose.production.yml ps
else
    docker-compose -f docker-compose.production.yml ps
fi

# Test connettività
echo ""
echo "🔗 Test connettività..."
if curl -f -s -I http://localhost:8000 > /dev/null; then
    echo "✅ App raggiungibile su porta 8000"
else
    echo "⚠️  App non raggiungibile - controlla i log"
fi

echo ""
echo "🎉 Deploy completato!"
echo "📊 App: http://$(hostname):8000"
echo "📋 Log: docker-compose -f docker-compose.production.yml logs -f"
EOF
    
    chmod +x "$temp_dir/deploy.sh"
    
    echo -e "${GEAR} Caricamento file sul server..."
    
    # Crea directory remota se non esiste
    eval "$ssh_cmd $ssh_target 'mkdir -p $deploy_path'"
    
    # Carica file
    eval "$scp_cmd $temp_dir/* $ssh_target:$deploy_path/"
    
    echo -e "${ROCKET} Esecuzione deploy remoto..."
    
    # Esegui deploy
    eval "$ssh_cmd $ssh_target 'cd $deploy_path && ./deploy.sh'"
    
    # Cleanup
    rm -rf "$temp_dir"
    
    if [[ $? -eq 0 ]]; then
        echo ""
        echo -e "${CHECK} ${GREEN}Deploy completato con successo!${NC}"
        echo -e "${INFO} App disponibile su: ${CYAN}http://${ssh_host}:8000${NC}"
        echo ""
        echo -e "${INFO} ${BLUE}Comandi utili:${NC}"
        echo -e "  🔍 Log: ${CYAN}${ssh_cmd} ${ssh_target} 'cd $deploy_path && docker-compose -f docker-compose.production.yml logs -f'${NC}"
        echo -e "  📊 Status: ${CYAN}${ssh_cmd} ${ssh_target} 'cd $deploy_path && docker-compose -f docker-compose.production.yml ps'${NC}"
        echo -e "  🛑 Stop: ${CYAN}${ssh_cmd} ${ssh_target} 'cd $deploy_path && docker-compose -f docker-compose.production.yml down'${NC}"
    else
        echo -e "${CROSS} ${RED}Deploy fallito!${NC}"
        exit 1
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
        "deploy")
            shift
            deploy_image "$@"
            ;;
        "version")
            shift
            version_command "$@"
            ;;
        "generate-run")
            shift
            # Parse per --version
            local version=""
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --version)
                        version="$2"
                        shift 2
                        ;;
                    *)
                        shift
                        ;;
                esac
            done
            generate_server_commands "$version"
            ;;
        "prepare-deploy")
            shift
            prepare_deployment_files "$@"
            ;;
        "remote-deploy")
            shift
            remote_deploy "$@"
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
