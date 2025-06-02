import { NextRequest, NextResponse } from 'next/server'
import { getIngressoService } from '@/container/ingresso.container'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedUser } from '@/middleware/auth.middleware'

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log(`[API] GET /suggestions/targa - Utente autenticato: ${user.email}`)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }

    const upperQuery = query.toUpperCase()
    
    const suggestions = await prisma.$queryRaw`
      SELECT DISTINCT targa
      FROM ingressi 
      WHERE targa IS NOT NULL 
        AND targa != ''
        AND targa LIKE ${upperQuery + '%'}
      ORDER BY targa ASC
      LIMIT ${limit}
    ` as Array<{ targa: string }>

    const results = suggestions.map(item => item.targa)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Errore nel recupero suggerimenti targa:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
})
