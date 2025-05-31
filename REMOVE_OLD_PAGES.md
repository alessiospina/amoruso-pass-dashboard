# Pagine da Rimuovere

Le seguenti pagine devono essere rimosse dal progetto in quanto sono state unificate nella nuova pagina `email-management`:

## File da Eliminare:
1. `src/app/(dashboard)/gestione-email/page.tsx`
2. `src/app/(dashboard)/imposta-email/page.tsx`

## File Creati/Aggiornati:
1. ✅ `src/app/(dashboard)/email-management/page.tsx` - Pagina unificata
2. ✅ `src/services/email-notification.service.ts` - Servizio semplificato
3. ✅ `src/app/api/send-email/route.ts` - API aggiornata con logica corretta
4. ✅ `src/app/api/ingressi/route.ts` - Integrato invio automatico email
5. ✅ `src/app/api/emails/stats/route.ts` - Endpoint per statistiche

## Logica Implementata:

### Invio Email Automatico:
1. **Utente salva ingresso** → Ingresso salvato nel DB
2. **Sistema recupera template attivi** dal DB
3. **Per ogni template attivo**:
   - **TO**: Email dai `recipients` del template  
   - **CC**: Email dell'ingresso (`ingresso.email`)
   - **Contenuto**: Template con placeholder sostituiti

### Pagina Unificata:
- **Sezione Configurazione**: Verifica SMTP + test email
- **Sezione Template**: Gestione completa CRUD template
- **Eliminato**: Funzionalità ridondanti e logiche complesse

### Servizio Semplificato:
- **Mantenuto**: CRUD template, invio automatico, validazione base
- **Rimosso**: Bulk email, logiche multiple, funzionalità avanzate non necessarie

La nuova implementazione segue esattamente la logica richiesta:
- Destinatari principali = recipients del template
- CC = email dell'ingresso
- Invio automatico al salvataggio ingresso
