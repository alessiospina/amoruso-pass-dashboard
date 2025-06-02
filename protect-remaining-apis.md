# API da Proteggere

Abbiamo già protetto:
- ✅ `/api/ingressi/*` 
- ✅ `/api/emails/*`

## API che restano da proteggere:

### 🔴 Critiche (DA PROTEGGERE SUBITO):
- `/api/send-bulk-email/*` - Invio email bulk
- `/api/send-email/*` - Invio email singole  
- `/api/send-update-email/*` - Invio email di aggiornamento
- `/api/email-configuration/*` - Configurazione email
- `/api/suggestions/*` - Suggerimenti autocomplete
- `/api/admin/*` - API amministrative

### 🟡 Meno critiche (proteggere con ruoli):
- `/api/email-test/*` - Test email (solo admin)
- `/api/test-email/*` - Test email (solo admin)
- `/api/email-preview/*` - Anteprima email

### 🟢 Pubbliche (NON proteggere):
- `/api/health/*` - Health check
- `/api/auth/*` - Autenticazione (già gestite)

## Per proteggere tutte le API rapidamente:

1. **API Critiche**: Usare `withAuth()` 
2. **API Admin**: Usare `withAuthAndRole(['admin'])`
3. **Logging**: Aggiungere log per tracciare l'accesso

## Script di protezione batch

Eseguire questo per ogni file API:

```typescript
// Importare il middleware
import { withAuth, AuthenticatedRequest, getAuthenticatedUser } from '@/middleware/auth.middleware'

// Sostituire export async function con:
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const user = getAuthenticatedUser(request)
  console.log(`[API] GET /path - Utente: ${user.email}`)
  // ... resto del codice
})
```
