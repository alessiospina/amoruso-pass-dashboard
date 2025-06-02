# 🐳 Amoruso Pass Dashboard - Docker Setup

Questa guida ti aiuterà a deployare l'applicazione Amoruso Pass Dashboard usando Docker.

## 📋 Prerequisiti

- Docker Engine 20.10+
- Docker Compose 2.0+
- Almeno 2GB di RAM libera
- Almeno 5GB di spazio disco

## ⚡ Quick Start

### 1. Clona il repository
```bash
git clone <repository-url>
cd amoruso-pass-dashboard
```

### 2. Configura l'ambiente
```bash
# Copia il file di configurazione
cp .env.docker.example .env

# Modifica le configurazioni (IMPORTANTE!)
nano .env  # o vim .env
```

### 3. Avvia l'applicazione
```bash
# Rendi eseguibile lo script
chmod +x docker-start.sh

# Avvia tutto
./docker-start.sh start
```

## 🔧 Configurazione

### Variabili d'ambiente critiche da modificare:

```bash
# Sicurezza (OBBLIGATORIO cambiarle!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
NEXTAUTH_SECRET=your-super-secret-nextauth-key-minimum-32-characters-long

# Database
DB_ROOT_PASSWORD=secure_root_password
DB_PASSWORD=secure_db_password

# Email (OVH esempio)
SMTP_HOST=smtp.ovh.net
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM=your-email@yourdomain.com
```

## 🚀 Comandi Disponibili

```bash
# Avvia tutti i servizi
./docker-start.sh start

# Ferma tutti i servizi
./docker-start.sh stop

# Riavvia tutti i servizi
./docker-start.sh restart

# Rebuild delle immagini
./docker-start.sh build

# Visualizza i log
./docker-start.sh logs

# Migrazione database
./docker-start.sh db-migrate

# Popola il database con dati di esempio
./docker-start.sh db-seed

# Pulizia completa
./docker-start.sh clean
```

## 🌐 Accesso ai Servizi

Dopo l'avvio, i servizi saranno disponibili su:

- **🖥️ Dashboard**: http://localhost:3000
- **🗄️ Database**: localhost:3306
- **🔄 Nginx**: http://localhost:80

## 📊 Architettura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  Nginx Proxy    │────▶  Next.js App    │────▶  MySQL Database │
│  (Port 80/443)  │    │  (Port 3000)    │    │  (Port 3306)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
    Rate Limiting          JWT Auth             Persistent Data
    SSL Termination        API Routes           Volume Storage
    Static Files           Prisma ORM
```

## 🔐 Sicurezza

Il setup include:

- **🛡️ Nginx**: Rate limiting, security headers
- **🔐 JWT**: Autenticazione sicura
- **🚫 Non-root**: Container con utente non-privilegiato  
- **🔒 Isolamento**: Network Docker isolato
- **📊 Health Checks**: Monitoraggio stato servizi

## 🏗️ Personalizzazione

### Nginx Configuration
Modifica `nginx.conf` per:
- SSL/TLS setup
- Custom domain
- Rate limiting personalizzato

### Database Initialization
Aggiungi script SQL in `init.sql` per:
- Dati iniziali
- Utenti personalizzati
- Configurazioni specifiche

## 🐛 Troubleshooting

### Problema: "Port already in use"
```bash
# Verifica quale processo usa la porta
sudo lsof -i :3000

# Cambia porta nel .env
APP_PORT=3001
```

### Problema: "Database connection failed"
```bash
# Verifica che il database sia healthy
docker-compose ps

# Controlla i log del database
docker-compose logs database
```

### Problema: "Permission denied"
```bash
# Assicurati che lo script sia eseguibile
chmod +x docker-start.sh

# Controlla i permessi Docker
sudo usermod -aG docker $USER
```

### Reset completo
```bash
# Ferma tutto e rimuovi dati
./docker-start.sh clean

# Riavvia da zero
./docker-start.sh start
```

## 📈 Produzione

Per il deploy in produzione:

### 1. SSL/HTTPS
```bash
# Ottieni certificati (Let's Encrypt)
certbot certonly --standalone -d your-domain.com

# Monta i certificati in nginx
# Decommentare la sezione HTTPS in nginx.conf
```

### 2. Variabili d'ambiente
```bash
# Usa variabili sicure
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 16)
```

### 3. Backup automatico
```bash
# Aggiungi cron job per backup database
0 2 * * * docker exec amoruso-pass-db mysqldump -u root -p$DB_ROOT_PASSWORD amoruso_pass_db > backup-$(date +%Y%m%d).sql
```

## 📞 Supporto

Per problemi o domande:
1. Controlla i log: `./docker-start.sh logs`
2. Verifica la configurazione: `cat .env`
3. Reset completo: `./docker-start.sh clean && ./docker-start.sh start`

## 🏷️ Tags Docker

L'immagine viene builddata con i seguenti tag:
- `amoruso-pass-dashboard:latest`
- `amoruso-pass-dashboard:v1.0.0`

## 📝 Note

- La prima build può richiedere 5-10 minuti
- I dati del database persistono in un volume Docker
- L'applicazione supporta hot-reload in sviluppo
- Nginx fornisce caching automatico per file statici
