import { NextRequest, NextResponse } from 'next/server'
import { getIngressoService } from '@/container/ingresso.container'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }
    
    const suggestions = await prisma.$queryRaw`
      SELECT DISTINCT email
      FROM ingressi 
      WHERE email IS NOT NULL 
        AND email != ''
        AND email LIKE ${query + '%'}
      ORDER BY email ASC
      LIMIT ${limit}
    ` as Array<{ email: string }>

    const results = suggestions.map(item => item.email)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Errore nel recupero suggerimenti email:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
