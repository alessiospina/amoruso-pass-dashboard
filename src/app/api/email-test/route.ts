import { NextRequest, NextResponse } from 'next/server'
import { getEmailNotificationService } from '@/container/email.container'

export async function POST(request: NextRequest) {
  try {
    const emailNotificationService = getEmailNotificationService()

    // Testa la configurazione email
    const testResult = await emailNotificationService.testEmailConfiguration()

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      timestamp: testResult.timestamp,
    })
  } catch (error) {
    console.error('Errore nel test email:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Errore nel test della configurazione email',
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const emailNotificationService = getEmailNotificationService()

    // Verifica la configurazione email senza inviare
    const testResult = await emailNotificationService.testEmailConfiguration()

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      timestamp: testResult.timestamp,
    })
  } catch (error) {
    console.error('Errore nella verifica email:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Errore nella verifica della configurazione email',
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
