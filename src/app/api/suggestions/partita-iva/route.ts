import { NextRequest, NextResponse } from 'next/server'
import { getIngressoService } from '@/container/ingresso.container'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedUser } from '@/middleware/auth.middleware'

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log(`[API] GET /suggestions/partita-iva - Utente autenticato: ${user.email}`)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }
    
    const suggestions = await prisma.$queryRaw`
      SELECT DISTINCT partita_iva
      FROM ingressi 
      WHERE partita_iva IS NOT NULL 
        AND partita_iva != ''
        AND partita_iva LIKE ${query + '%'}
      ORDER BY partita_iva ASC
      LIMIT ${limit}
    ` as Array<{ partita_iva: string }>

    const results = suggestions.map(item => item.partita_iva)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Errore nel recupero suggerimenti partita IVA:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
})
