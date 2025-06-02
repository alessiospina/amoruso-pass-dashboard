import { NextRequest, NextResponse } from 'next/server'
import { getEmailService } from '@/container/email.container'
import { validateUpdateEmail, validateEmailId } from '@/validation/email.validation'
import { withAuth, AuthenticatedUser } from '@/middleware/auth.middleware'

// GET - Ottieni singolo template email (PROTETTO)
export const GET = withAuth(async (
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: { id: string } }
) => {
  try {
    console.log(`[API] GET /emails/${params.id} - Utente autenticato: ${user.email}`)

    // Validazione ID
    const idResult = validateEmailId({ id: params.id })
    
    if (!idResult.success) {
      return NextResponse.json(
        { 
          error: 'ID non valido',
          details: idResult.error.format()
        },
        { status: 400 }
      )
    }

    const service = getEmailService()
    const email = await service.getEmailById(idResult.data.id)

    return NextResponse.json(email)
  } catch (error) {
    console.error('Errore GET /api/emails/[id]:', error)
    
    if (error instanceof Error && error.message.includes('non trovato')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
})

// PUT - Aggiorna template email (PROTETTO)
export const PUT = withAuth(async (
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: { id: string } }
) => {
  try {
    console.log(`[API] PUT /emails/${params.id} - Utente autenticato: ${user.email}`)

    // Validazione ID
    const idResult = validateEmailId({ id: params.id })
    
    if (!idResult.success) {
      return NextResponse.json(
        { 
          error: 'ID non valido',
          details: idResult.error.format()
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validazione dati update
    const validationResult = validateUpdateEmail(body)
    
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
    
    // Validazione business rules per l'update (passando l'ID corrente)
    const businessErrors = await service.validateBusinessRules(validationResult.data, idResult.data.id)
    
    if (businessErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Violazione regole business',
          details: businessErrors
        },
        { status: 422 }
      )
    }

    const email = await service.updateEmail(
      idResult.data.id, 
      validationResult.data
    )
    
    console.log(`[API] Email template aggiornato con successo da ${user.email}: ID ${email.id}`)
    return NextResponse.json(email)
  } catch (error) {
    console.error('Errore PUT /api/emails/[id]:', error)
    
    if (error instanceof Error && error.message.includes('non trovato')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
})

// DELETE - Elimina template email (PROTETTO)
export const DELETE = withAuth(async (
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: { id: string } }
) => {
  try {
    console.log(`[API] DELETE /emails/${params.id} - Utente autenticato: ${user.email}`)

    // Validazione ID
    const idResult = validateEmailId({ id: params.id })
    
    if (!idResult.success) {
      return NextResponse.json(
        { 
          error: 'ID non valido',
          details: idResult.error.format()
        },
        { status: 400 }
      )
    }

    const service = getEmailService()
    await service.deleteEmail(idResult.data.id)
    
    console.log(`[API] Email template eliminato con successo da ${user.email}: ID ${params.id}`)
    return NextResponse.json(
      { message: 'Template email eliminato con successo' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Errore DELETE /api/emails/[id]:', error)
    
    if (error instanceof Error && error.message.includes('non trovato')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
})
