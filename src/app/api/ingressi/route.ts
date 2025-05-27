import { NextRequest, NextResponse } from 'next/server'
import { getIngressoService } from '@/container/ingresso.container'
import { 
  validateCreateIngresso, 
  validateIngressoFilters, 
  validatePagination 
} from '@/validation/ingresso.validation'

// GET - Lista ingressi con filtri e paginazione
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Valida paginazione
    const paginationResult = validatePagination({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    })

    if (!paginationResult.success) {
      return NextResponse.json(
        { 
          error: 'Parametri di paginazione non validi',
          details: paginationResult.error.format()
        },
        { status: 400 }
      )
    }

    // Valida filtri
    const filtersData = {
      email: searchParams.get('email') || undefined,
      ragione_sociale: searchParams.get('ragione_sociale') || undefined,
      targa: searchParams.get('targa') || undefined,
      importo_min: searchParams.get('importo_min') ? parseFloat(searchParams.get('importo_min')!) : undefined,
      importo_max: searchParams.get('importo_max') ? parseFloat(searchParams.get('importo_max')!) : undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
    }

    const filtersResult = validateIngressoFilters(filtersData)

    if (!filtersResult.success) {
      return NextResponse.json(
        { 
          error: 'Filtri non validi',
          details: filtersResult.error.format()
        },
        { status: 400 }
      )
    }

    const service = getIngressoService()
    const result = await service.getIngressi(
      filtersResult.data,
      paginationResult.data
    )
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Errore GET /api/ingressi:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// POST - Crea nuovo ingresso
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validazione input
    const validationResult = validateCreateIngresso(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dati non validi',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const service = getIngressoService()
    
    // Validazione business rules
    const businessErrors = await service.validateBusinessRules(validationResult.data)
    
    if (businessErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Violazione regole business',
          details: businessErrors
        },
        { status: 422 }
      )
    }

    const ingresso = await service.createIngresso(validationResult.data)

    return NextResponse.json(ingresso, { status: 201 })
  } catch (error) {
    console.error('Errore POST /api/ingressi:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
}
