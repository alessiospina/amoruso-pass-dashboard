import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string | null
  role: string
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser
}

/**
 * Verifica il token JWT e restituisce i dati dell'utente
 */
export async function verifyJWTToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string | null,
      role: payload.role as string
    }
  } catch (error) {
    console.error('Errore verifica JWT:', error)
    return null
  }
}

/**
 * Verifica l'autenticazione e restituisce l'utente o un errore
 */
export async function authenticateRequest(request: NextRequest): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  try {
    // Cerca il token nei cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return {
        error: NextResponse.json(
          { 
            error: 'Token di autenticazione mancante',
            code: 'MISSING_TOKEN'
          },
          { status: 401 }
        )
      }
    }

    // Verifica il token
    const user = await verifyJWTToken(token)
    
    if (!user) {
      return {
        error: NextResponse.json(
          { 
            error: 'Token di autenticazione non valido',
            code: 'INVALID_TOKEN'
          },
          { status: 401 }
        )
      }
    }

    return { user }

  } catch (error) {
    console.error('Errore nel middleware di autenticazione:', error)
    return {
      error: NextResponse.json(
        { 
          error: 'Errore interno del server',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware di autenticazione per le API
 * Verifica il token JWT e aggiunge i dati dell'utente alla request
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return authResult.error
    }

    // Chiama l'handler originale con l'utente autenticato
    return await handler(request, authResult.user, ...args)
  }
}

/**
 * Middleware di autenticazione con controllo dei ruoli
 * Verifica il token JWT e controlla che l'utente abbia uno dei ruoli richiesti
 */
export function withAuthAndRole(allowedRoles: string[]) {
  return function<T extends any[]>(
    handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const authResult = await authenticateRequest(request)
      
      if ('error' in authResult) {
        return authResult.error
      }

      // Verifica il ruolo
      if (!allowedRoles.includes(authResult.user.role)) {
        return NextResponse.json(
          { 
            error: 'Accesso negato - ruolo insufficiente',
            code: 'INSUFFICIENT_ROLE',
            required: allowedRoles,
            current: authResult.user.role
          },
          { status: 403 }
        )
      }

      // Se tutto ok, chiama l'handler originale
      return await handler(request, authResult.user, ...args)
    }
  }
}

/**
 * Helper function per ottenere l'utente da una richiesta autenticata
 */
export function getAuthenticatedUser(request: AuthenticatedRequest): AuthenticatedUser {
  return request.user
}
