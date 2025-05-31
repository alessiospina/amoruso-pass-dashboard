# Guida Implementazione Sistema Email

## Panoramica
È stata implementata una logica completa di invio email che viene attivata automaticamente dopo il salvataggio di un nuovo ingresso. Il sistema supporta template email personalizzabili con placeholder dinamici.

## File Implementati

### 1. Servizi Email
- **`src/services/mailer.service.ts`** - Servizio base per l'invio email con nodemailer
- **`src/services/email-notification.service.ts`** - Servizio per gestire le notifiche email automatiche
- **`src/services/email.service.ts`** - Aggiornato per gestire i template email

### 2. Configurazione
- **`.env.development`** e **`.env`** - Aggiunte configurazioni SMTP fittizie
- **`src/container/email.container.ts`** - Aggiornato con i nuovi servizi
- **`src/container/ingresso.container.ts`** - Integrato con il servizio email

### 3. API Endpoints
- **`/api/email-test`** - Verifica configurazione email (GET/POST)
- **`/api/email-preview`** - Anteprima email prima dell'invio (POST)
- **`/api/send-email`** - Invio manuale email per un ingresso (POST)

### 4. UI Management
- **`src/app/(dashboard)/gestione-email/page.tsx`** - Pagina di gestione e test email
- **`src/components/Layout/Dashboard/Sidebar/SidebarNav.tsx`** - Aggiunta voce menu

## Configurazione Email (file .env)

```env
# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your_email_password
SMTP_FROM_NAME="Amoruso Pass System"
SMTP_FROM_EMAIL=noreply@example.com
```

## Placeholder Supportati nei Template

I seguenti placeholder possono essere usati nei template email e verranno sostituiti automaticamente:

- `{{email}}` - Email dell'ingresso
- `{{ragione_sociale}}` - Ragione sociale
- `{{targa}}` - Targa del veicolo
- `{{partita_iva}}` - Partita IVA (se presente)
- `{{indirizzo}}` - Indirizzo (se presente)
- `{{importo}}` - Importo formattato (es: €123.45)
- `{{created_at}}` - Data di creazione formattata
- `{{updated_at}}` - Data di aggiornamento formattata
- `{{id}}` - ID univoco dell'ingresso

## Esempio Template Email

**Oggetto:**
```
Nuovo ingresso registrato per {{ragione_sociale}}
```

**Corpo HTML:**
```html
<h2>Nuovo Ingresso Registrato</h2>
<p>È stato registrato un nuovo ingresso con i seguenti dettagli:</p>
<ul>
  <li><strong>Ragione Sociale:</strong> {{ragione_sociale}}</li>
  <li><strong>Email:</strong> {{email}}</li>
  <li><strong>Targa:</strong> {{targa}}</li>
  <li><strong>Importo:</strong> {{importo}}</li>
  <li><strong>Data:</strong> {{created_at}}</li>
</ul>
<p>Per maggiori informazioni, accedi al <a href="http://localhost:3000">dashboard</a>.</p>
```

## Come Testare

### 1. Configurazione SMTP
1. Aggiorna le variabili d'ambiente `.env` con configurazioni SMTP reali
2. Per test locali, puoi usare servizi come:
   - **Mailtrap.io** (per sviluppo)
   - **Gmail SMTP** (con App Password)
   - **SendGrid**, **Mailgun**, etc.

### 2. Creazione Template
1. Vai su `/imposta-email`
2. Crea un nuovo template email con:
   - Nome descrittivo
   - Lista destinatari CC (separati da virgola)
   - Oggetto con placeholder
   - Corpo HTML con placeholder
   - Attiva il template

### 3. Test Manuale
1. Vai su `/gestione-email`
2. Verifica stato configurazione
3. Usa "Test Email" per inviare una email di prova
4. Inserisci l'ID di un ingresso esistente

### 4. Test Automatico
1. Crea un nuovo ingresso tramite `/crea`
2. L'email dovrebbe essere inviata automaticamente a tutti i template attivi
3. Controlla i log del server per eventuali errori

## API Testing con curl

### Verifica Configurazione
```bash
curl -X GET http://localhost:3000/api/email-test
```

### Invio Email Manuale
```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "ingressoId": "clxxx123456789",
    "templateId": "clyyy987654321",
    "ccEmails": ["test@example.com"]
  }'
```

### Anteprima Email
```bash
curl -X POST http://localhost:3000/api/email-preview \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "clyyy987654321",
    "ingressoId": "clxxx123456789"
  }'
```

## Architettura

```
IngressoService.createIngresso()
    ↓
EmailNotificationService.sendNotificationsForNewIngresso()
    ↓
MailerService.sendEmailFromTemplate() (per ogni template attivo)
    ↓
SMTP Server → Destinatari
```

## Troubleshooting

### Errori Comuni

1. **"nodemailer createTransporter is not a function"**
   - ✅ Risolto: usare `createTransport` invece di `createTransporter`

2. **"Configurazione email non valida"**
   - Verifica le variabili d'ambiente SMTP
   - Controlla che almeno un template sia attivo

3. **"Template email non trovato"**
   - Assicurati che esistano template email attivi nel database
   - Verifica che `isActive` sia `true`

4. **Errori SMTP**
   - Verifica credenziali SMTP
   - Controlla firewall/proxy
   - Usa servizi di email affidabili per test

### Debug

Per abilitare debug dettagliato, aggiungi ai log del server:
```javascript
console.log('Email results:', emailResults)
```

## Prossimi Passi

1. **Configurazione Produzione:** Aggiorna `.env.production` con credenziali SMTP reali
2. **Monitoring:** Implementa logging delle email inviate/fallite
3. **Queue System:** Per volumi elevati, considera un sistema di code (Redis + Bull)
4. **Template Editor:** Aggiungi editor WYSIWYG per i template HTML
5. **Statistiche:** Dashboard con statistiche di invio email
