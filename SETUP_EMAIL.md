# 🚀 Setup Sistema Email - Guida Rapida

## 📋 Prerequisiti
- ✅ Progetto già configurato e funzionante
- ✅ Database Prisma operativo
- ✅ Accesso a servizio SMTP (Gmail, SendGrid, Mailtrap, ecc.)

## 🔧 Step 1: Configurazione SMTP

### Opzione A: Gmail (per testing)
1. Crea un'App Password Gmail:
   - Vai su https://myaccount.google.com/security
   - Attiva 2FA se non attivo
   - Vai su "App passwords" 
   - Genera password per "Mail"

2. Aggiorna il file `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tuoemail@gmail.com
SMTP_PASSWORD=app_password_generata
SMTP_FROM_NAME="Amoruso Pass System"
SMTP_FROM_EMAIL=tuoemail@gmail.com
```

### Opzione B: Mailtrap (per sviluppo)
1. Registrati su https://mailtrap.io
2. Crea inbox di test
3. Usa le credenziali fornite:
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=username_mailtrap
SMTP_PASSWORD=password_mailtrap
SMTP_FROM_NAME="Amoruso Pass System"
SMTP_FROM_EMAIL=noreply@example.com
```

## 🌱 Step 2: Seed Template Email
Crea i template email di esempio:
```bash
pnpm run seed:emails
```

Questo creerà 2 template:
- ✅ **Notifica Nuovo Ingresso** (attivo) - per amministratori
- ⚠️ **Conferma Ingresso Cliente** (inattivo) - per clienti

## 🧪 Step 3: Test Configurazione

### Test 1: Verifica Configurazione
1. Avvia il server: `pnpm dev`
2. Vai su http://localhost:3000/gestione-email
3. Clicca "Verifica Configurazione"
4. Dovrebbe mostrare "✅ Configurazione email valida"

### Test 2: Invio Email Manuale
1. Nella stessa pagina, clicca "Test Email"
2. Inserisci l'ID di un ingresso esistente
3. Seleziona template "Notifica Nuovo Ingresso"
4. Clicca "Invia Test"

### Test 3: Invio Automatico
1. Vai su http://localhost:3000/crea
2. Crea un nuovo ingresso
3. L'email dovrebbe essere inviata automaticamente
4. Controlla la tua casella email (o Mailtrap)

## 🎯 Step 4: Personalizzazione Template

### Modifica Template Esistenti
1. Vai su http://localhost:3000/imposta-email
2. Modifica i template esistenti
3. Aggiungi/rimuovi destinatari CC
4. Personalizza oggetto e corpo con placeholder

### Placeholder Disponibili
- `{{email}}` - Email ingresso
- `{{ragione_sociale}}` - Ragione sociale
- `{{targa}}` - Targa veicolo
- `{{partita_iva}}` - Partita IVA
- `{{indirizzo}}` - Indirizzo
- `{{importo}}` - Importo (es: €123.45)
- `{{created_at}}` - Data creazione
- `{{updated_at}}` - Data aggiornamento
- `{{id}}` - ID ingresso

### Crea Nuovi Template
1. Vai su http://localhost:3000/imposta-email
2. Clicca "Crea Nuovo Template"
3. Compila tutti i campi
4. Attiva il template se necessario

## 🚨 Troubleshooting

### ❌ "Configurazione email non valida"
**Soluzioni:**
- Verifica le credenziali SMTP nel file `.env`
- Controlla che le porte non siano bloccate dal firewall
- Per Gmail, assicurati di usare App Password e non la password normale

### ❌ "Nessun template email attivo"
**Soluzioni:**
- Esegui `pnpm run seed:emails`
- Verifica nel database che esistano record nella tabella `emails`
- Controlla che `isActive = true` per almeno un template

### ❌ "Template email non trovato"
**Soluzioni:**
- Verifica l'ID del template nell'URL o richiesta
- Controlla che il template esista nel database

### ❌ Nodemailer errors
**Soluzioni comuni:**
- **"Invalid login"**: Credenziali sbagliate
- **"Connection timeout"**: Problemi di rete/firewall  
- **"5.7.0 Authentication Required"**: Usa App Password per Gmail

## 📧 Test Email di Esempio

Dopo la configurazione, dovresti ricevere email simili a questa:

**Oggetto:** Nuovo ingresso registrato - Esempio SRL

**Contenuto:**
> 🚗 Nuovo Ingresso Registrato
> 
> È stato registrato un nuovo ingresso nel sistema con i seguenti dettagli:
> 
> **Dettagli Ingresso**
> - Ragione Sociale: Esempio SRL
> - Email: esempio@example.com
> - Targa: AB123CD
> - Importo: €50.00
> - Data Registrazione: 31/05/2025

## 🔄 Attivazione Produzione

Per l'ambiente di produzione:

1. **Aggiorna `.env.production`** con credenziali SMTP reali
2. **Configura servizio SMTP professionale** (SendGrid, Mailgun, AWS SES)
3. **Testa in staging** prima del deploy
4. **Monitora i log** per errori di invio
5. **Configura backup** per email critiche

## 📞 Supporto

Se incontri problemi:
1. Controlla i log del server Next.js
2. Verifica la configurazione SMTP
3. Testa con Mailtrap prima di usare email reali
4. Controlla che i template siano attivi e validi

**Tutto pronto! 🎉**

Il sistema email è ora configurato e pronto per l'uso. Ogni nuovo ingresso attiverà automaticamente l'invio delle email configurate.
