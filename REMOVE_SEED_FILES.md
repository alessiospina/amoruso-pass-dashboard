# File da Rimuovere - Seed Email Templates

I seguenti file devono essere eliminati dal progetto in quanto la logica di seed non è richiesta:

## File da Eliminare:
1. `prisma/seed-email-templates.ts`
2. `prisma/seed-emails-simple.js`

## Logica Corretta:
- **Tabella emails vuota** → Nessuna email viene inviata
- **Template attivi presenti** → Email vengono inviate automaticamente
- **L'utente crea i template manualmente** dalla pagina unificata quando necessario

Non serve popolare il database con template predefiniti.
