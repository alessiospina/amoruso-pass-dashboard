import { NextRequest, NextResponse } from 'next/server'
import { getEmailNotificationService } from '@/container/email.container'
import { getIngressoService } from '@/container/ingresso.container'
import { validateSendBulkEmail } from '@/validation/email.validation'
import { withAuth, AuthenticatedUser } from '@/middleware/auth.middleware'

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log(`[API] POST /send-bulk-email - Utente autenticato: ${user.email}`)

    const body = await request.json()
    const validation = validateSendBulkEmail(body)
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dati di input non validi',
          errors: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data
    const emailNotificationService = getEmailNotificationService()
    const ingressoService = getIngressoService()

    // Verifica che tutti gli ingressi esistano
    const ingressi = await Promise.all(
      validatedData.ingressoIds.map(id => ingressoService.getIngressoById(id))
    )

    console.log(`[API] Invio bulk email da ${user.email}: ${ingressi.length} destinatari, template ${validatedData.templateId}`)

    // Invia le email usando il servizio di notifica
    const results = await emailNotificationService.sendBulkNotifications(
      ingressi,
      validatedData.templateId,
      validatedData.ccEmails
    )

    console.log(`[API] Bulk email completato da ${user.email}: ${results.sent} successo, ${results.failed} fallite`)

    return NextResponse.json({
      success: true,
      message: `Email inviate: ${results.sent} successo, ${results.failed} fallite`,
      data: {
        templateId: validatedData.templateId,
        totalIngressi: ingressi.length,
        results,
        recipients: ingressi.map(i => ({ id: i.id, email: i.email })),
      },
    })
  } catch (error) {
    console.error('Errore nell\'invio bulk email:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Errore nell\'invio bulk email',
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    )
  }
})
