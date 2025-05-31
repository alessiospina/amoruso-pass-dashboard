import { NextRequest, NextResponse } from 'next/server'
import { getEmailNotificationService } from '@/container/email.container'
import { getIngressoService } from '@/container/ingresso.container'
import { validateSendBulkEmail } from '@/validation/email.validation'

export async function POST(request: NextRequest) {
  try {
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

    // Invia le email usando il servizio di notifica
    const results = await emailNotificationService.sendBulkNotifications(
      ingressi,
      validatedData.templateId,
      validatedData.ccEmails
    )

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
}
