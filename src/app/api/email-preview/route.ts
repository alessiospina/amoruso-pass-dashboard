import { NextRequest, NextResponse } from 'next/server'
import { getEmailNotificationService } from '@/container/email.container'
import { getIngressoService } from '@/container/ingresso.container'
import { validateEmailPreview } from '@/validation/email.validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateEmailPreview(body)
    
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

    // Recupera l'ingresso e il template
    const ingresso = await ingressoService.getIngressoById(validatedData.ingressoId)
    
    // Genera l'anteprima dell'email
    const preview = await emailNotificationService.previewEmail(
      validatedData.templateId,
      ingresso
    )

    return NextResponse.json({
      success: true,
      data: preview,
    })
  } catch (error) {
    console.error('Errore nella generazione anteprima email:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Errore nella generazione dell\'anteprima email',
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    )
  }
}
