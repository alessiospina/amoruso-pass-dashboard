import { NextRequest, NextResponse } from 'next/server'
import { getIngressoService } from '@/container/ingresso.container'
import { getEmailNotificationService } from '@/container/email.container'
import { 
  validateCreateIngresso, 
  validateIngressoFilters, 
  validatePagination 
} from '@/validation/ingresso.validation'
import { withAuth, AuthenticatedUser } from '@/middleware/auth.middleware'

// GET - Lista ingressi con filtri e paginazione (PROTETTO)
export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log(`[API] GET /ingressi - Utente autenticato: ${user.email}`)

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
      partita_iva: searchParams.get('partita_iva') || undefined,
      indirizzo: searchParams.get('indirizzo') || undefined,
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
})

// POST - Crea nuovo ingresso (PROTETTO)
export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log(`[API] POST /ingressi - Utente autenticato: ${user.email}`)

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

    // Invio automatico email per nuovo ingresso
    try {
      const emailNotificationService = getEmailNotificationService()
      const emailResults = await emailNotificationService.sendAutomaticEmailsForNewIngresso(ingresso)
      
      if (emailResults.length === 0) {
        console.log(`Nessun template email configurato - ingresso ${ingresso.id} creato senza invio email`)
      } else {
        // Log risultati email
        const successCount = emailResults.filter(r => r.success).length
        const failureCount = emailResults.filter(r => !r.success).length
        
        console.log(`Email inviate per ingresso ${ingresso.id}: ${successCount} successi, ${failureCount} fallimenti`)
      }
    } catch (emailError) {
      // Non bloccare la creazione dell'ingresso se l'email fallisce
      console.error('Errore nell\'invio email automatico:', emailError)
    }

    console.log(`[API] Ingresso creato con successo da ${user.email}: ID ${ingresso.id}`)
    return NextResponse.json(ingresso, { status: 201 })
  } catch (error) {
    console.error('Errore POST /api/ingressi:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
})
