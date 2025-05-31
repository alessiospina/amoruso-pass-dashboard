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

      const response = await fetch(`/api/ingressi?${params.toString()}`)

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json()
        throw new Error(errorData.error || `Errore HTTP: ${response.status}`)
      }

      const result = await response.json()
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
      const response = await fetch('/api/ingressi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingressoData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Gestisci diversi tipi di errore in base al response
        if (response.status === 400 && responseData.details) {
          // Errore di validazione
          return ResultFactory.error(responseData.details)
        } if (response.status === 422 && responseData.details) {
          // Errore di business rules
          return ResultFactory.error(responseData.details)
        }
        // Errore generico
        return ResultFactory.error(responseData.error || 'Errore nella creazione')
      }

      await fetchIngressi() // Ricarica la lista
      return ResultFactory.success(responseData as Ingresso)
    } catch (err) {
      return ResultFactory.error(
        err instanceof Error ? err.message : 'Errore nella creazione',
      )
    }
  }

  const updateIngresso = async (
    id: string,
    updateData: UpdateIngressoInput,
  ): Promise<ExtendedResult<Ingresso>> => {
    try {
      const response = await fetch(`/api/ingressi/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 400 && responseData.details) {
          return ResultFactory.error(responseData.details)
        } if (response.status === 422 && responseData.details) {
          return ResultFactory.error(responseData.details)
        } if (response.status === 404) {
          return ResultFactory.error('Ingresso non trovato')
        }
        return ResultFactory.error(responseData.error || 'Errore nell\'aggiornamento')
      }

      await fetchIngressi() // Ricarica la lista
      return ResultFactory.success(responseData as Ingresso)
    } catch (err) {
      return ResultFactory.error(
        err instanceof Error ? err.message : 'Errore nell\'aggiornamento',
      )
    }
  }

  const deleteIngresso = async (id: string): Promise<Result<void>> => {
    try {
      const response = await fetch(`/api/ingressi/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json()
        if (response.status === 404) {
          return ResultFactory.error('Ingresso non trovato')
        }
        return ResultFactory.error(errorData.error || 'Errore nell\'eliminazione')
      }

      await fetchIngressi() // Ricarica la lista
      return ResultFactory.success()
    } catch (err) {
      return ResultFactory.error(
        err instanceof Error ? err.message : 'Errore nell\'eliminazione',
      )
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
      const response = await fetch(`/api/ingressi/${id}`)

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json()
        const errorMessage = errorData.error || `Errore HTTP: ${response.status}`
        setError(errorMessage)
        return ResultFactory.error(errorMessage)
      }

      const data = await response.json()
      setIngresso(data)
      setError(null)
      return ResultFactory.success(data as Ingresso)
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
      const response = await fetch('/api/ingressi/stats')

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json()
        const errorMessage = errorData.error || `Errore HTTP: ${response.status}`
        setError(errorMessage)
        return ResultFactory.error(errorMessage)
      }

      const data = await response.json()
      setStats(data)
      setError(null)
      return ResultFactory.success(data as IngressoStatsDTO)
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

      const response = await fetch(`/api/ingressi/search?${params.toString()}`)

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json()
        const errorMessage = errorData.error || `Errore HTTP: ${response.status}`
        setError(errorMessage)
        setResults([])
        return ResultFactory.error(errorMessage)
      }

      const data = await response.json()
      setResults(data.results)
      setError(null)
      return ResultFactory.success(data.results as Ingresso[])
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
