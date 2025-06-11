import { Ingresso } from '@prisma/client'

export interface ReplacementDefinition {
  key: string
  label: string
  description: string
  example: string
  category: 'anagrafica' | 'veicolo' | 'finanziario' | 'temporale' | 'sistema'
}

/**
 * Definizioni di tutti i replacement disponibili per i template email
 */
export const EMAIL_REPLACEMENTS: ReplacementDefinition[] = [
  // Anagrafica
  {
    key: '$EMAIL$',
    label: 'Email',
    description: 'Indirizzo email del cliente',
    example: 'mario.rossi@email.com',
    category: 'anagrafica'
  },
  {
    key: '$RAGIONE_SOCIALE$',
    label: 'Ragione Sociale',
    description: 'Nome o ragione sociale del cliente',
    example: 'Mario Rossi S.r.l.',
    category: 'anagrafica'
  },
  {
    key: '$PARTITA_IVA$',
    label: 'Partita IVA',
    description: 'Partita IVA del cliente',
    example: '12345678901',
    category: 'anagrafica'
  },
  {
    key: '$INDIRIZZO$',
    label: 'Indirizzo',
    description: 'Indirizzo del cliente',
    example: 'Via Roma 123, Milano',
    category: 'anagrafica'
  },
  
  // Veicolo
  {
    key: '$TARGA$',
    label: 'Targa',
    description: 'Targa del veicolo',
    example: 'AB123CD',
    category: 'veicolo'
  },
  
  // Finanziario
  {
    key: '$IMPORTO$',
    label: 'Importo',
    description: 'Importo del pass (formattato)',
    example: '€25.00',
    category: 'finanziario'
  },
  
  // Temporale
  {
    key: '$DATA_CREAZIONE$',
    label: 'Data Creazione',
    description: 'Data di creazione dell\'ingresso',
    example: '15/03/2024',
    category: 'temporale'
  },
  {
    key: '$DATA_AGGIORNAMENTO$',
    label: 'Data Aggiornamento',
    description: 'Data ultimo aggiornamento',
    example: '20/03/2024',
    category: 'temporale'
  },
  
  // Sistema
  {
    key: '$ID$',
    label: 'ID Ingresso',
    description: 'Identificativo univoco dell\'ingresso',
    example: 'ing_1234567890',
    category: 'sistema'
  }
]

/**
 * Mappa i replacement keys ai valori dell'entità Ingresso
 */
export const getReplacementValue = (key: string, ingresso: Ingresso): string => {
  const formatDateForEmail = (date: Date): string => {
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const replacementMap: Record<string, string> = {
    '$EMAIL$': ingresso.email || 'NOT VALID',
    '$RAGIONE_SOCIALE$': ingresso.ragione_sociale || 'NOT VALID',
    '$TARGA$': ingresso.targa || 'NOT VALID',
    '$PARTITA_IVA$': ingresso.partita_iva || 'NOT VALID',
    '$INDIRIZZO$': ingresso.indirizzo || 'NOT VALID',
    '$IMPORTO$': ingresso.importo ? `€${ingresso.importo.toFixed(2)}` : 'NOT VALID',
    '$DATA_CREAZIONE$': ingresso.created_at ? formatDateForEmail(ingresso.created_at) : 'NOT VALID',
    '$DATA_AGGIORNAMENTO$': ingresso.updated_at ? formatDateForEmail(ingresso.updated_at) : 'NOT VALID',
    '$ID$': ingresso.id || 'NOT VALID'
  }

  return replacementMap[key] || 'NOT VALID'
}

/**
 * Sostituisce tutti i replacement in un testo con i valori dell'ingresso
 */
export const replaceAllPlaceholders = (text: string, ingresso: Ingresso): string => {
  let processedText = text

  // Sostituisce tutti i replacement conosciuti
  EMAIL_REPLACEMENTS.forEach(replacement => {
    const regex = new RegExp(escapeRegExp(replacement.key), 'g')
    const value = getReplacementValue(replacement.key, ingresso)
    processedText = processedText.replace(regex, value)
  })

  // Sostituisce eventuali replacement non riconosciuti con NOT VALID
  const unknownReplacements = processedText.match(/\$[A-Z_]+\$/g)
  if (unknownReplacements) {
    unknownReplacements.forEach(unknown => {
      const regex = new RegExp(escapeRegExp(unknown), 'g')
      processedText = processedText.replace(regex, 'NOT VALID')
    })
  }

  return processedText
}

/**
 * Trova tutti i replacement presenti in un testo
 */
export const findReplacementsInText = (text: string): string[] => {
  const matches = text.match(/\$[A-Z_]+\$/g)
  return matches ? [...new Set(matches)] : []
}

/**
 * Valida se tutti i replacement in un testo sono validi
 */
export const validateReplacements = (text: string): { valid: string[]; invalid: string[] } => {
  const foundReplacements = findReplacementsInText(text)
  const validKeys = EMAIL_REPLACEMENTS.map(r => r.key)
  
  const valid = foundReplacements.filter(r => validKeys.includes(r))
  const invalid = foundReplacements.filter(r => !validKeys.includes(r))
  
  return { valid, invalid }
}

/**
 * Raggruppa i replacement per categoria
 */
export const getReplacementsByCategory = () => {
  const categories: Record<string, ReplacementDefinition[]> = {}
  
  EMAIL_REPLACEMENTS.forEach(replacement => {
    if (!categories[replacement.category]) {
      categories[replacement.category] = []
    }
    categories[replacement.category].push(replacement)
  })
  
  return categories
}

/**
 * Escape dei caratteri speciali per regex
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Nomi user-friendly per le categorie
 */
export const CATEGORY_LABELS: Record<string, string> = {
  anagrafica: 'Dati Anagrafici',
  veicolo: 'Dati Veicolo',
  finanziario: 'Dati Finanziari',
  temporale: 'Date e Orari',
  sistema: 'Dati Sistema'
}
