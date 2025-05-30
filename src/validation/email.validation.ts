import { z } from 'zod'
import type { CreateEmailDTO, UpdateEmailDTO, EmailFiltersDTO, EmailIdDTO } from '@/dto/email.dto'

// Schema per la creazione email
export const createEmailSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome template è obbligatorio')
    .max(100, 'Nome template troppo lungo')
    .trim(),
  recipients: z
    .array(z.string().email('Formato email non valido'))
    .min(1, 'Almeno un destinatario è obbligatorio')
    .max(50, 'Massimo 50 destinatari'),
  subject: z
    .string()
    .min(1, 'Oggetto è obbligatorio')
    .max(255, 'Oggetto troppo lungo')
    .trim(),
  body: z
    .string()
    .min(1, 'Corpo email è obbligatorio')
    .max(10000, 'Corpo email troppo lungo')
    .trim(),
  isActive: z.boolean().optional().default(true),
})

// Schema per l'aggiornamento email
export const updateEmailSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome template è obbligatorio')
    .max(100, 'Nome template troppo lungo')
    .trim()
    .optional(),
  recipients: z
    .array(z.string().email('Formato email non valido'))
    .min(1, 'Almeno un destinatario è obbligatorio')
    .max(50, 'Massimo 50 destinatari')
    .optional(),
  subject: z
    .string()
    .min(1, 'Oggetto è obbligatorio')
    .max(255, 'Oggetto troppo lungo')
    .trim()
    .optional(),
  body: z
    .string()
    .min(1, 'Corpo email è obbligatorio')
    .max(10000, 'Corpo email troppo lungo')
    .trim()
    .optional(),
  isActive: z.boolean().optional(),
})

// Schema per filtri
export const emailFiltersSchema = z.object({
  name: z.string().optional(),
  subject: z.string().optional(),
  recipient: z.string().email().optional(),
})

// Schema per validazione ID
export const emailIdSchema = z.object({
  id: z.string().cuid('ID non valido'),
})

// Funzioni di validazione
export const validateCreateEmail = (data: unknown) => {
  return createEmailSchema.safeParse(data)
}

export const validateUpdateEmail = (data: unknown) => {
  return updateEmailSchema.safeParse(data)
}

export const validateEmailFilters = (data: unknown) => {
  return emailFiltersSchema.safeParse(data)
}

export const validateEmailId = (data: unknown) => {
  return emailIdSchema.safeParse(data)
}
