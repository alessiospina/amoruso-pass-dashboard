import { NextRequest, NextResponse } from 'next/server'
import { getEmailService } from '@/container/email.container'
import { 
  validateCreateEmail, 
  validateEmailFilters, 
} from '@/validation/email.validation'
import { validatePagination } from '@/validation/ingresso.validation'
import { withAuth, AuthenticatedUser } from '@/middleware/auth.middleware'

export const dynamic = 'force-dynamic'

// GET - Lista email templates con filtri e paginazione (PROTETTO)
export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log(`[API] GET /emails - Utente autenticato: ${user.email}`)

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
      name: searchParams.get('name') || undefined,
      subject: searchParams.get('subject') || undefined,
      recipient: searchParams.get('recipient') || undefined,
    }

    const filtersResult = validateEmailFilters(filtersData)

    if (!filtersResult.success) {
      return NextResponse.json(
        { 
          error: 'Filtri non validi',
          details: filtersResult.error.format()
        },
        { status: 400 }
      )
    }

    const service = getEmailService()
    const result = await service.getEmails(
      filtersResult.data,
      paginationResult.data
    )
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Errore GET /api/emails:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
})

// POST - Crea nuovo template email (PROTETTO)
export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log(`[API] POST /emails - Utente autenticato: ${user.email}`)

    const body = await request.json()
    
    // Validazione input
    const validationResult = validateCreateEmail(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dati non validi',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const service = getEmailService()
    
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

    const email = await service.createEmail(validationResult.data)

    console.log(`[API] Email template creato con successo da ${user.email}: ID ${email.id}`)
    return NextResponse.json(email, { status: 201 })
  } catch (error) {
    console.error('Errore POST /api/emails:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
})
