// DTO per la creazione di una nuova email
export interface CreateEmailDTO {
  name: string
  recipients: string[]
  subject: string
  body: string
  isActive?: boolean
}

// DTO per l'aggiornamento di un'email
export interface UpdateEmailDTO {
  name?: string
  recipients?: string[]
  subject?: string
  body?: string
  isActive?: boolean
}

// DTO per i filtri di ricerca
export interface EmailFiltersDTO {
  name?: string
  subject?: string
  recipient?: string
}

// DTO per l'input di validazione ID
export interface EmailIdDTO {
  id: string
}
