export interface CreateIngressoDTO {
  email: string
  ragione_sociale: string
  targa: string
  importo: number
}

export interface UpdateIngressoDTO extends Partial<CreateIngressoDTO> {}

export interface IngressoFiltersDTO {
  email?: string
  ragione_sociale?: string
  targa?: string
  importo_min?: number
  importo_max?: number
  date_from?: Date
  date_to?: Date
}

export interface PaginationDTO {
  page: number
  limit: number
}

export interface PaginatedResultDTO<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface IngressoStatsDTO {
  total: number
  totalImporto: number
  mediaImporto: number
  today: number
  thisWeek: number
  thisMonth: number
}

export interface SearchDTO {
  query: string
  limit: number
}

export interface SearchResultDTO<T> {
  query: string
  results: T[]
  count: number
}

export interface IngressoAggregationsDTO {
  total: number
  totalImporte: number
  avgImporto: number
}
