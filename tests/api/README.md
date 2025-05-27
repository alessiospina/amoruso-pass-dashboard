# Test API Ingressi - Amoruso Pass Dashboard

## 📋 File di Test

### `ingresso.http`
File principale con tutti i test manuali delle API. Include:
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Test di validazione
- ✅ Test di business rules
- ✅ Test di ricerca e filtri
- ✅ Test di paginazione
- ✅ Test di statistiche
- ✅ Edge cases e performance test

### `ingresso-automated.http`
Test automatizzati con assertions e variabili dinamiche per:
- ✅ Test automatici con verifica delle risposte
- ✅ Gestione automatica degli ID generati
- ✅ Cleanup automatico dei dati di test

## 🚀 Come Usare i Test

### Prerequisiti
1. **Avvia il server di sviluppo:**
   ```bash
   pnpm run dev
   ```

2. **Verifica che il database sia attivo e configurato**

### Con VSCode REST Client
1. Installa l'estensione **REST Client** in VSCode
2. Apri il file `ingresso.http`
3. Clicca su "Send Request" sopra ogni test
4. Verifica le risposte nel pannello di destra

### Con altri tool HTTP

#### cURL Examples:
```bash
# Lista ingressi
curl -X GET http://localhost:3000/api/ingressi

# Crea ingresso
curl -X POST http://localhost:3000/api/ingressi \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@amoruso.com",
    "ragione_sociale": "Test SRL",
    "targa": "AB123CD",
    "importo": 25.50
  }'

# Statistiche
curl -X GET http://localhost:3000/api/ingressi/stats
```

#### Postman:
1. Importa il file `.http` o crea le request manualmente
2. Imposta `Content-Type: application/json` negli headers
3. Usa i JSON di esempio per i body delle POST/PUT

## 📊 Test Coverage

### ✅ Endpoints Testati

| Metodo | Endpoint | Descrizione | Test Cases |
|--------|----------|-------------|------------|
| GET | `/api/ingressi` | Lista ingressi | Senza filtri, con paginazione, con filtri |
| POST | `/api/ingressi` | Crea ingresso | Valido, errori validazione, business rules |
| GET | `/api/ingressi/{id}` | Dettaglio ingresso | Esistente, non esistente |
| PUT | `/api/ingressi/{id}` | Aggiorna ingresso | Valido, errori, non esistente |
| DELETE | `/api/ingressi/{id}` | Elimina ingresso | Esistente, non esistente |
| GET | `/api/ingressi/stats` | Statistiche | Verifica struttura dati |
| GET | `/api/ingressi/search` | Ricerca | Per email, targa, ragione sociale |

### ✅ Scenari di Test

**Test Positivi:**
- ✅ Creazione ingresso valido
- ✅ Aggiornamento dati
- ✅ Ricerca e filtri
- ✅ Paginazione
- ✅ Eliminazione

**Test Negativi:**
- ❌ Email non valida
- ❌ Targa formato errato
- ❌ Importo negativo
- ❌ Campi obbligatori mancanti
- ❌ ID non esistente
- ❌ Business rules violations

**Edge Cases:**
- 🔄 Importo molto basso (0.01)
- 🔄 Importo molto alto (>10000)
- 🔄 Spazi nelle stringhe
- 🔄 Caratteri speciali
- 🔄 Limiti di paginazione

## 🔧 Variabili Personalizzabili

### Nel file `.http`
```
@baseUrl = http://localhost:3000        # Cambia per test in staging/produzione
@contentType = application/json
```

### Per Test Automatizzati
- `ingressoId1`, `ingressoId2` - Generati automaticamente durante i test
- Modifica gli esempi di dati per adattarli ai tuoi casi d'uso

## 📈 Test Results Expected

### Successo (200/201)
```json
{
  "id": "cuid_generated",
  "email": "test@amoruso.com",
  "ragione_sociale": "Test SRL",
  "targa": "AB123CD",
  "importo": 25.50,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Errore Validazione (400)
```json
{
  "error": "Dati non validi",
  "details": {
    "email": {
      "_errors": ["Formato email non valido"]
    }
  }
}
```

### Errore Business Rule (422)
```json
{
  "error": "Violazione regole business",
  "details": [
    "Importo superiore a €10.000 richiede approvazione speciale"
  ]
}
```

### Non Trovato (404)
```json
{
  "error": "Ingresso non trovato"
}
```

## 🚨 Troubleshooting

### Server non risponde
```bash
# Verifica che il server sia avviato
pnpm run dev

# Controlla che sia in ascolto su porta 3000
curl http://localhost:3000/api/health
```

### Database Error
```bash
# Verifica connessione database
npx prisma db push

# Controlla variabili ambiente
cat .env
```

### Errori di validazione
- Controlla che i dati rispettino gli schema Zod definiti
- Verifica formato email, targa, e importo

## 🔄 Workflow Consigliato

1. **Setup:** Esegui prima i test di creazione
2. **CRUD:** Testa tutte le operazioni base
3. **Validazione:** Verifica tutti gli errori
4. **Business Rules:** Testa le regole specifiche
5. **Performance:** Test con dati in volume
6. **Cleanup:** Elimina i dati di test

## 💡 Tips

- Sostituisci `{ID}` con ID reali ottenuti dalle chiamate precedenti
- Usa il file automatizzato per test ripetibili
- Monitora i log del server per debug dettagliato
- Testa sia scenari positivi che negativi per ogni endpoint
