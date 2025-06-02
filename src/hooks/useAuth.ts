'use client'

import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

export const useAuth = () => {
  const router = useRouter()
  const [jwtUser, setJwtUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Usa useSession solo se il SessionProvider è disponibile
  let session = null
  let status = 'loading'
  
  try {
    const sessionData = useSession()
    session = sessionData.data
    status = sessionData.status
  } catch (error) {
    // Se SessionProvider non è disponibile, continua solo con JWT
    console.log('SessionProvider non disponibile, usando solo JWT')
    status = 'unauthenticated'
  }

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
          setJwtUser(data.user)
        } else {
          // Se il token JWT non è valido, pulisci lo stato
          setJwtUser(null)
        }
      } catch (error) {
        console.error('Errore nella verifica JWT:', error)
        setJwtUser(null)
      } finally {
        setLoading(false)
      }
    }

    if (status !== 'loading') {
      checkJWTAuth()
    }
  }, [status])

  const logout = async () => {
    try {
      // Logout del sistema JWT
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      // Logout di NextAuth solo se disponibile
      try {
        await signOut({ 
          redirect: false,
          callbackUrl: '/login' 
        })
      } catch (error) {
        console.log('NextAuth signOut non disponibile')
      }

      // Pulisci lo stato locale
      setJwtUser(null)

      // Reindirizza al login usando window.location per forzare il refresh
      window.location.href = '/login'
    } catch (error) {
      console.error('Errore durante il logout:', error)
      // Forza il redirect anche in caso di errore
      window.location.href = '/login'
    }
  }

  // Determina l'utente attivo (priorità a JWT)
  const user = jwtUser || (session?.user as User)
  const isAuthenticated = !!(jwtUser || session)
  const isLoading = loading || status === 'loading'

  return {
    user,
    isAuthenticated,
    isLoading,
    logout
  }
}
