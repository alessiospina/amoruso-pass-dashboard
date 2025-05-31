import { NextRequest, NextResponse } from 'next/server'
import { getEmailNotificationService } from '@/container/email.container'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email è obbligatoria',
        },
        { status: 400 }
      )
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Formato email non valido',
        },
        { status: 400 }
      )
    }

    const emailNotificationService = getEmailNotificationService()

    // Invia email di test con oggetto e corpo predefiniti
    const testEmailData = {
      to: email,
      subject: 'Test Email - Sistema Gestione Pass',
      body: `
        <h2>Email di Test</h2>
        <p>Questa è una email di test inviata dal sistema di gestione pass.</p>
        <p><strong>Data invio:</strong> ${new Date().toLocaleString('it-IT')}</p>
        <p><strong>Destinatario:</strong> ${email}</p>
        <hr>
        <p>Se hai ricevuto questa email, significa che la configurazione del sistema email funziona correttamente.</p>
        <p><em>Sistema Amoruso Pass Dashboard</em></p>
      `
    }

    const result = await emailNotificationService.sendTestEmail(testEmailData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email di test inviata con successo',
        data: {
          email,
          timestamp: new Date().toISOString(),
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.error || 'Errore nell\'invio email di test',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Errore nell\'invio email di test:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Errore nell\'invio email di test',
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    )
  }
}
