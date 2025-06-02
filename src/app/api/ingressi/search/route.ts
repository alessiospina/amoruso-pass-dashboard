import { NextRequest, NextResponse } from 'next/server'
import { getIngressoService } from '@/container/ingresso.container'
import { validateSearch } from '@/validation/ingresso.validation'
import { withAuth, AuthenticatedUser } from '@/middleware/auth.middleware'

// GET - Ricerca ingressi (PROTETTO)
export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log(`[API] GET /ingressi/search - Utente autenticato: ${user.email}`)

    const { searchParams } = new URL(request.url)
    
    // Validazione parametri ricerca
    const searchResult = validateSearch({
      q: searchParams.get('q') || '',
      limit: parseInt(searchParams.get('limit') || '10')
    })

    if (!searchResult.success) {
      return NextResponse.json(
        { 
          error: 'Parametri di ricerca non validi',
          details: searchResult.error.format()
        },
        { status: 400 }
      )
    }

    const service = getIngressoService()
    const results = await service.searchIngressi(
      searchResult.data.q,
      searchResult.data.limit
    )
    
    return NextResponse.json({
      query: searchResult.data.q,
      results,
      count: results.length,
    })
  } catch (error) {
    console.error('Errore GET /api/ingressi/search:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
})
