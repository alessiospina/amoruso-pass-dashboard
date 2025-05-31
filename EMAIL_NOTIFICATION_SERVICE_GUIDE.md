# EmailNotificationService - Guida Completa

L'`EmailNotificationService` è un servizio centralizzato per la gestione delle notifiche email nel sistema Amoruso Pass Dashboard.

## Funzionalità Principali

### 1. Notifiche Automatiche per Nuovi Ingressi
Quando viene creato un nuovo ingresso, il sistema invia automaticamente email a tutti i template attivi configurati.

```typescript
// Viene chiamato automaticamente da IngressoService.createIngresso()
const results = await emailNotificationService.sendNotificationsForNewIngresso(ingresso)
console.log(`Email inviate: ${results.sent}, fallite: ${results.failed}`)
```

### 2. Invio Email Singola
Invia una email specifica usando un template per un singolo ingresso.

```typescript
await emailNotificationService.sendSingleNotification(
  ingresso,
  templateId,
  ['cc@example.com'] // CC opzionali
)
```

### 3. Invio Email Bulk
Invia email a più ingressi contemporaneamente usando lo stesso template.

```typescript
const results = await emailNotificationService.sendBulkNotifications(
  [ingresso1, ingresso2, ingresso3],
  templateId,
  ['cc@example.com'] // CC opzionali
)
```

### 4. Anteprima Email
Genera un'anteprima dell'email prima dell'invio per verifica.

```typescript
const preview = await emailNotificationService.previewEmail(templateId, ingresso)
console.log('Oggetto:', preview.subject)
console.log('Destinatario:', preview.to)
console.log('CC:', preview.cc)
console.log('HTML:', preview.html)
```

### 5. Verifica Configurazione
Controlla se la configurazione SMTP e i template sono corretti.

```typescript
const config = await emailNotificationService.verifyEmailConfiguration()
if (config.isValid) {
  console.log('Configurazione OK:', config.message)
} else {
  console.error('Errore configurazione:', config.message)
}
```

## API Endpoints

### POST /api/send-email
Invia una singola email.
```json
{
  "ingressoId": "cm123abc...",
  "templateId": "tm456def...",
  "ccEmails": ["cc@example.com"]
}
```

### POST /api/send-bulk-email
Invia email multiple.
```json
{
  "ingressoIds": ["cm123abc...", "cm456def..."],
  "templateId": "tm789ghi...",
  "ccEmails": ["cc@example.com"]
}
```

### POST /api/email-preview
Genera anteprima email.
```json
{
  "ingressoId": "cm123abc...",
  "templateId": "tm456def..."
}
```

### GET /api/email-configuration
Verifica configurazione email.

## Placeholder Supportati nei Template

I template email possono utilizzare i seguenti placeholder che vengono sostituiti automaticamente:

- `{{email}}` - Email del cliente
- `{{ragione_sociale}}` - Ragione sociale
- `{{targa}}` - Targa del veicolo
- `{{partita_iva}}` - Partita IVA (se presente)
- `{{indirizzo}}` - Indirizzo (se presente)
- `{{importo}}` - Importo formattato (es: €50.00)
- `{{created_at}}` - Data creazione (formato italiano)
- `{{updated_at}}` - Data ultima modifica (formato italiano)
- `{{id}}` - ID univoco dell'ingresso

### Esempio Template
```html
<h2>Conferma Ingresso - {{ragione_sociale}}</h2>
<p>Gentile Cliente,</p>
<p>Confermiamo la registrazione del seguente ingresso:</p>
<ul>
  <li><strong>Targa:</strong> {{targa}}</li>
  <li><strong>Importo:</strong> {{importo}}</li>
  <li><strong>Data:</strong> {{created_at}}</li>
</ul>
<p>Per ulteriori informazioni, contattare {{email}}</p>
```

## Gestione Errori

Il servizio gestisce automaticamente gli errori e fornisce log dettagliati:

- **Template non attivo**: L'email non viene inviata se il template è disattivato
- **Errori SMTP**: Vengono loggati e riportati nei risultati
- **Template non trovato**: Genera un errore specifico
- **Placeholder mancanti**: I placeholder non sostituiti rimangono nel testo

## Configurazione SMTP

Le configurazioni SMTP sono gestite tramite variabili d'ambiente:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM_NAME=Amoruso Pass System
SMTP_FROM_EMAIL=noreply@example.com
```

## Integrazione con IngressoService

L'EmailNotificationService è automaticamente integrato con l'IngressoService:

```typescript
// Il container inietta automaticamente il servizio
const ingressoService = getIngressoService() // Include EmailNotificationService

// Quando si crea un ingresso, le email vengono inviate automaticamente
const ingresso = await ingressoService.createIngresso(data)
// → Automaticamente invia email a tutti i template attivi
```

## Testing

Per il testing, utilizzare il metodo di verifica configurazione:

```typescript
// In un test o script di verifica
const isConfigured = await emailNotificationService.verifyEmailConfiguration()
console.log('Email system ready:', isConfigured.isValid)
```

## Monitoraggio

Tutti gli eventi email vengono loggati:

- Invii riusciti con dettagli template
- Errori di invio con causa specifica
- Problemi di configurazione SMTP
- Statistiche di invio bulk

I log possono essere utilizzati per monitorare la salute del sistema email e identificare problemi di consegna.
