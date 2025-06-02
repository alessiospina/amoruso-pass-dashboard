import { useState } from 'react'

/**
 * Utility per le chiamate API con gestione automatica dell'autenticazione
 */

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Wrapper per fetch che gestisce automaticamente gli errori di autenticazione
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Assicurati che i cookie vengano sempre inviati
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, fetchOptions)

    // Se l'API restituisce 401 (non autenticato), reindirizza al login
    if (response.status === 401) {
      console.log('Token JWT scaduto o non valido, reindirizzamento al login...')
      window.location.href = '/login'
      throw new Error('Sessione scaduta')
    }

    // Se l'API restituisce 403 (forbidden), mostra errore
    if (response.status === 403) {
      console.log('Accesso negato - permessi insufficienti')
      throw new Error('Accesso negato - permessi insufficienti')
    }

    return response
  } catch (error) {
    // Se c'è un errore di rete e non siamo già nella pagina di login
    if (window.location.pathname !== '/login') {
      console.error('Errore di rete o autenticazione:', error)
    }
    throw error
  }
}

/**
 * GET autenticata con parsing JSON automatico
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'GET',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
  }

  return await response.json()
}

/**
 * POST autenticata con parsing JSON automatico
 */
export async function apiPost<T = any>(url: string, data?: any): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
  }

  return await response.json()
}

/**
 * PUT autenticata con parsing JSON automatico
 */
export async function apiPut<T = any>(url: string, data?: any): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
  }

  return await response.json()
}

/**
 * DELETE autenticata con parsing JSON automatico
 */
export async function apiDelete<T = any>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
  }

  return await response.json()
}

/**
 * Hook per le chiamate API con gestione dello stato di loading e errori
 */
export function useApiCall() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeCall = async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(errorMessage)
      console.error('Errore API:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, executeCall }
}
