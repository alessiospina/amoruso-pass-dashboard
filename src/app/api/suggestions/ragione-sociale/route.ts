import { NextRequest, NextResponse } from 'next/server'
import { getIngressoService } from '@/container/ingresso.container'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedUser } from '@/middleware/auth.middleware'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log(`[API] GET /suggestions/ragione-sociale - Utente autenticato: ${user.email}`)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }
    
    const suggestions = await prisma.$queryRaw`
      SELECT DISTINCT ragione_sociale
      FROM ingressi 
      WHERE ragione_sociale IS NOT NULL 
        AND ragione_sociale != ''
        AND ragione_sociale LIKE ${query + '%'}
      ORDER BY ragione_sociale ASC
      LIMIT ${limit}
    ` as Array<{ ragione_sociale: string }>

    const results = suggestions.map(item => item.ragione_sociale)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Errore nel recupero suggerimenti ragione sociale:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
})
