import { NextRequest, NextResponse } from 'next/server'
import { getEmailNotificationService } from '@/container/email.container'
import { getIngressoService } from '@/container/ingresso.container'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ingressoId, templateId } = body
    
    if (!ingressoId || !templateId) {
      return NextResponse.json(
        {
          success: false,
          message: 'ingressoId e templateId sono obbligatori',
        },
        { status: 400 }
      )
    }

    const emailNotificationService = getEmailNotificationService()
    const ingressoService = getIngressoService()

    // Verifica che l'ingresso esista
    const ingresso = await ingressoService.getIngressoById(ingressoId)
    
    // Invia l'email usando il servizio di notifica
    // Destinatari: recipients del template
    // CC: email dell'ingresso
    const result = await emailNotificationService.sendEmailForIngresso(
      ingressoId,
      templateId,
      ingresso
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email inviata con successo',
        data: {
          ingressoId,
          templateId,
          templateUsed: result.templateUsed,
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.error || 'Errore nell\'invio email',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Errore nell\'invio email:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Errore nell\'invio email',
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    )
  }
}
