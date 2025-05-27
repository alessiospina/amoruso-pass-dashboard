import { z } from 'zod'

export const createIngressoSchema = z.object({
  email: z
    .string()
    .min(1, 'Email è obbligatoria')
    .email('Formato email non valido')
    .max(255, 'Email troppo lunga'),
  
  ragione_sociale: z
    .string()
    .min(1, 'Ragione sociale è obbligatoria')
    .max(255, 'Ragione sociale troppo lunga')
    .trim(),
  
  targa: z
    .string()
    .min(1, 'Targa è obbligatoria')
    .max(10, 'Targa troppo lunga')
    .regex(/^[A-Z0-9]+$/, 'Targa deve contenere solo lettere maiuscole e numeri')
    .transform(val => val.toUpperCase()),
  
  importo: z
    .number()
    .min(0, 'Importo deve essere positivo')
    .max(999999.99, 'Importo troppo alto')
    .refine((val) => Number.isFinite(val), 'Importo deve essere un numero valido')
    .refine((val) => Number(val.toFixed(2)) === val, 'Importo può avere massimo 2 decimali')
})

export const updateIngressoSchema = createIngressoSchema.partial()

export const ingressoFiltersSchema = z.object({
  email: z.string().email().optional(),
  ragione_sociale: z.string().optional(),
  targa: z.string().transform(val => val?.toUpperCase()).optional(),
  importo_min: z.number().min(0).optional(),
  importo_max: z.number().min(0).optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.importo_min !== undefined && data.importo_max !== undefined) {
      return data.importo_min <= data.importo_max
    }
    return true
  },
  {
    message: 'Importo minimo deve essere minore o uguale a importo massimo',
    path: ['importo_min']
  }
).refine(
  (data) => {
    if (data.date_from && data.date_to) {
      return data.date_from <= data.date_to
    }
    return true
  },
  {
    message: 'Data inizio deve essere precedente alla data fine',
    path: ['date_from']
  }
)

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

export const searchSchema = z.object({
  q: z.string().min(1, 'Query di ricerca obbligatoria').max(255),
  limit: z.number().int().min(1).max(50).default(10)
})

export const idSchema = z.object({
  id: z.string().min(1, 'ID obbligatorio')
})

// Type exports
export type CreateIngressoInput = z.infer<typeof createIngressoSchema>
export type UpdateIngressoInput = z.infer<typeof updateIngressoSchema>
export type IngressoFiltersInput = z.infer<typeof ingressoFiltersSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type IdInput = z.infer<typeof idSchema>

// Validation helper functions
export const validateCreateIngresso = (data: unknown) => {
  return createIngressoSchema.safeParse(data)
}

export const validateUpdateIngresso = (data: unknown) => {
  return updateIngressoSchema.safeParse(data)
}

export const validateIngressoFilters = (data: unknown) => {
  return ingressoFiltersSchema.safeParse(data)
}

export const validatePagination = (data: unknown) => {
  return paginationSchema.safeParse(data)
}

export const validateSearch = (data: unknown) => {
  return searchSchema.safeParse(data)
}

export const validateId = (data: unknown) => {
  return idSchema.safeParse(data)
}
