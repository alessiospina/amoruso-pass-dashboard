import { NextRequestWithAuth, withAuth } from 'next-auth/middleware'
import { type NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import { NextMiddlewareResult } from 'next/dist/server/web/types'
import { getLocales } from '@/locales/dictionary'
import { defaultLocale } from '@/locales/config'
import { jwtVerify } from 'jose'

// Funzione per verificare il token JWT
async function verifyJWTToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const headers = { 'accept-language': request.headers.get('accept-language') ?? '' }
  const languages = new Negotiator({ headers }).languages()
  const locales = getLocales()

  const locale = match(languages, locales, defaultLocale)
  const response = NextResponse.next()
  if (!request.cookies.get('locale')) {
    response.cookies.set('locale', locale)
  }

  // Percorsi che non richiedono autenticazione
  const publicPaths = [
    '/login',
    '/register',
    '/ads.txt',
  ]

  const isPublicPath = publicPaths.includes(request.nextUrl.pathname)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  // Escludi percorsi pubblici e alcune API dal controllo di autenticazione
  if (isPublicPath || 
      request.nextUrl.pathname.startsWith('/api/ingressi') ||
      request.nextUrl.pathname.startsWith('/api/health') ||
      request.nextUrl.pathname.startsWith('/api/auth')) {
    return response
  }

  // Per le rotte protette, verifica prima il token JWT
  const jwtToken = request.cookies.get('auth-token')?.value

  if (jwtToken) {
    const isValidJWT = await verifyJWTToken(jwtToken)
    if (isValidJWT) {
      // Token JWT valido, consenti l'accesso
      return response
    }
  }

  // Se non c'è token JWT valido, usa NextAuth per la protezione delle route
  const res: NextMiddlewareResult = await withAuth(
    // Response with local cookies
    () => response,
    {
      // Matches the pages config in `[...nextauth]`
      pages: {
        signIn: '/login',
      },
    },
  )(request as NextRequestWithAuth, event)
  
  return res
}
