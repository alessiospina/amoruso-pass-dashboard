'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

export const useJWTAuth = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Verifica se c'è un token JWT valido
  useEffect(() => {
    const checkJWTAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          // Se il token JWT non è valido, pulisci lo stato
          setUser(null)
        }
      } catch (error) {
        console.error('Errore nella verifica JWT:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkJWTAuth()
  }, [])

  const logout = async () => {
    try {
      // Logout del sistema JWT
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      // Pulisci lo stato locale
      setUser(null)

      // Reindirizza al login usando window.location per forzare il refresh
      window.location.href = '/login'
    } catch (error) {
      console.error('Errore durante il logout:', error)
      // Forza il redirect anche in caso di errore
      window.location.href = '/login'
    }
  }

  const isAuthenticated = !!user
  const isLoading = loading

  return {
    user,
    isAuthenticated,
    isLoading,
    logout
  }
}
