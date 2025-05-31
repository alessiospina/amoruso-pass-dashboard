import { NextRequest, NextResponse } from 'next/server'
import { getEmailNotificationService } from '@/container/email.container'

export async function GET(request: NextRequest) {
  try {
    const emailNotificationService = getEmailNotificationService()
    
    // Verifica la configurazione email
    const configStatus = await emailNotificationService.verifyEmailConfiguration()

    return NextResponse.json({
      success: true,
      data: configStatus,
    })
  } catch (error) {
    console.error('Errore nella verifica configurazione email:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Errore nella verifica della configurazione email',
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        data: {
          isValid: false,
          message: 'Errore interno del server',
        },
      },
      { status: 500 }
    )
  }
}
