import { NextRequest, NextResponse } from 'next/server'
import { getIngressoService } from '@/container/ingresso.container'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedUser } from '@/middleware/auth.middleware'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log(`[API] GET /suggestions/indirizzo - Utente autenticato: ${user.email}`)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }
    
    const suggestions = await prisma.$queryRaw`
      SELECT DISTINCT indirizzo
      FROM ingressi 
      WHERE indirizzo IS NOT NULL 
        AND indirizzo != ''
        AND indirizzo LIKE ${query + '%'}
      ORDER BY indirizzo ASC
      LIMIT ${limit}
    ` as Array<{ indirizzo: string }>

    const results = suggestions.map(item => item.indirizzo)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Errore nel recupero suggerimenti indirizzo:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
})
