'use client'

import { useState, useEffect } from 'react'
import { Ingresso } from '@prisma/client'
import {
  CreateIngressoInput,
  UpdateIngressoInput,
  IngressoFiltersInput,
} from '@/validation/ingresso.validation'
import {
  PaginatedResultDTO,
  IngressoStatsDTO,
} from '@/dto/ingresso.dto'
import {
  Result,
  ExtendedResult,
  ResultFactory,
  isSuccessResult,
  isValidationErrorResult,
  isBusinessRuleErrorResult,
} from '@/common/result'
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api.utils'

interface ApiErrorResponse {
  error: string;
  details?: any;
}

// Hook per gestire la lista degli ingressi
export function useIngressi(
  filters: IngressoFiltersInput = {},
  page: number = 1,
  limit: number = 10,
) {
  const [data, setData] = useState<PaginatedResultDTO<Ingresso> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIngressi = async () => {
    try {
      setLoading(true)

      // Costruisci query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      // Aggiungi filtri
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params.append(key, value.toISOString())
          } else {
            params.append(key, value.toString())
          }
        }
      })

      const result = await apiGet<PaginatedResultDTO<Ingresso>>(`/api/ingressi?${params.toString()}`)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento degli ingressi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIngressi()
  }, [page, limit, JSON.stringify(filters)])

  const createIngresso = async (
    ingressoData: CreateIngressoInput,
  ): Promise<ExtendedResult<Ingresso>> => {
    try {
      const result = await apiPost<Ingresso>('/api/ingressi', ingressoData)
      await fetchIngressi() // Ricarica la lista
      return ResultFactory.success(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella creazione'
      
      // Prova a parsare errori strutturati
      if (errorMessage.includes('Dati non validi')) {
        return ResultFactory.error('Errori di validazione')
      }
      if (errorMessage.includes('Violazione regole business')) {
        return ResultFactory.error('Violazione regole business')
      }
      
      return ResultFactory.error(errorMessage)
    }
  }

  const updateIngresso = async (
    id: string,
    updateData: UpdateIngressoInput,
  ): Promise<ExtendedResult<Ingresso>> => {
    try {
      const result = await apiPut<Ingresso>(`/api/ingressi/${id}`, updateData)
      await fetchIngressi() // Ricarica la lista
      return ResultFactory.success(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'aggiornamento'
      
      if (errorMessage.includes('non trovato')) {
        return ResultFactory.error('Ingresso non trovato')
      }
      if (errorMessage.includes('Dati non validi')) {
        return ResultFactory.error('Errori di validazione')
      }
      if (errorMessage.includes('Violazione regole business')) {
        return ResultFactory.error('Violazione regole business')
      }
      
      return ResultFactory.error(errorMessage)
    }
  }

  const deleteIngresso = async (id: string): Promise<Result<void>> => {
    try {
      await apiDelete(`/api/ingressi/${id}`)
      await fetchIngressi() // Ricarica la lista
      return ResultFactory.success()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'eliminazione'
      
      if (errorMessage.includes('non trovato')) {
        return ResultFactory.error('Ingresso non trovato')
      }
      
      return ResultFactory.error(errorMessage)
    }
  }

  return {
    data,
    loading,
    error,
    refetch: fetchIngressi,
    createIngresso,
    updateIngresso,
    deleteIngresso,
  }
}

// Hook per gestire un singolo ingresso
export function useIngresso(id: string | null) {
  const [ingresso, setIngresso] = useState<Ingresso | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIngresso = async (): Promise<Result<Ingresso>> => {
    if (!id) {
      setLoading(false)
      return ResultFactory.error('ID non fornito')
    }

    try {
      setLoading(true)
      const data = await apiGet<Ingresso>(`/api/ingressi/${id}`)
      setIngresso(data)
      setError(null)
      return ResultFactory.success(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento dell\'ingresso'
      setError(errorMessage)
      return ResultFactory.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIngresso()
  }, [id])

  return {
    ingresso,
    loading,
    error,
    refetch: fetchIngresso,
  }
}

// Hook per le statistiche
export function useIngressiStats() {
  const [stats, setStats] = useState<IngressoStatsDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async (): Promise<Result<IngressoStatsDTO>> => {
    try {
      setLoading(true)
      const data = await apiGet<IngressoStatsDTO>('/api/ingressi/stats')
      setStats(data)
      setError(null)
      return ResultFactory.success(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento delle statistiche'
      setError(errorMessage)
      return ResultFactory.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Aggiorna statistiche ogni 30 secondi
    const interval = setInterval(fetchStats, 30000)

    return () => clearInterval(interval)
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}

// Hook per la ricerca
export function useIngressiSearch() {
  const [results, setResults] = useState<Ingresso[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (query: string, limit: number = 10): Promise<Result<Ingresso[]>> => {
    if (!query.trim()) {
      setResults([])
      return ResultFactory.success([])
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      })

      const data = await apiGet<{results: Ingresso[]}>(`/api/ingressi/search?${params.toString()}`)
      setResults(data.results)
      setError(null)
      return ResultFactory.success(data.results)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella ricerca'
      setError(errorMessage)
      setResults([])
      return ResultFactory.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    results,
    loading,
    error,
    search,
  }
}

// Utility functions per gestire i risultati nei componenti
export const IngressoResultHandlers = {
  handleCreateResult: (result: ExtendedResult<Ingresso>) => {
    if (isSuccessResult(result)) {
      return { success: true, message: 'Ingresso creato con successo' }
    } if (isValidationErrorResult(result)) {
      return {
        success: false,
        message: 'Errori di validazione',
        errors: result.validationErrors,
      }
    } if (isBusinessRuleErrorResult(result)) {
      return {
        success: false,
        message: 'Violazione regole business',
        errors: result.businessErrors,
      }
    }
    return { success: false, message: result.error }
  },

  handleUpdateResult: (result: ExtendedResult<Ingresso>) => {
    if (isSuccessResult(result)) {
      return { success: true, message: 'Ingresso aggiornato con successo' }
    } if (isValidationErrorResult(result)) {
      return {
        success: false,
        message: 'Errori di validazione',
        errors: result.validationErrors,
      }
    } if (isBusinessRuleErrorResult(result)) {
      return {
        success: false,
        message: 'Violazione regole business',
        errors: result.businessErrors,
      }
    }
    return { success: false, message: result.error }
  },

  handleDeleteResult: (result: Result<void>) => {
    if (isSuccessResult(result)) {
      return { success: true, message: 'Ingresso eliminato con successo' }
    }
    return { success: false, message: result.error }
  },
}
