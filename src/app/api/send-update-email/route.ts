import { NextRequest, NextResponse } from 'next/server'
import { getEmailNotificationService } from '@/container/email.container'
import { getIngressoService } from '@/container/ingresso.container'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ingressoId } = body
    
    if (!ingressoId) {
      return NextResponse.json(
        {
          success: false,
          message: 'ingressoId è obbligatorio',
        },
        { status: 400 }
      )
    }

    const emailNotificationService = getEmailNotificationService()
    const ingressoService = getIngressoService()

    // Verifica che l'ingresso esista
    const ingresso = await ingressoService.getIngressoById(ingressoId)
    
    // Ottieni i template attivi
    const activeTemplates = await emailNotificationService.getActiveTemplates()
    
    if (activeTemplates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nessun template email attivo configurato',
        },
        { status: 400 }
      )
    }

    const results = []

    // Invia email per ogni template attivo con oggetto modificato
    for (const template of activeTemplates) {
      try {
        // Modifica l'oggetto aggiungendo [AGGIORNATO] all'inizio
        const modifiedTemplate = {
          ...template,
          subject: template.subject.includes('[AGGIORNATO]') 
            ? template.subject 
            : `[AGGIORNATO] ${template.subject}`
        }

        const result = await emailNotificationService.sendEmailForIngressoWithTemplate(
          ingressoId,
          modifiedTemplate,
          ingresso
        )
        
        results.push({
          templateId: template.id,
          templateName: template.name,
          success: result.success,
          error: result.error
        })
      } catch (error) {
        results.push({
          templateId: template.id,
          templateName: template.name,
          success: false,
          error: error instanceof Error ? error.message : 'Errore sconosciuto'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    if (successCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Email di aggiornamento inviate con successo (${successCount}/${results.length})`,
        data: {
          ingressoId,
          results,
          successCount,
          failedCount
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Nessuna email di aggiornamento è stata inviata con successo',
          data: {
            ingressoId,
            results,
            successCount,
            failedCount
          }
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Errore nell\'invio email di aggiornamento:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Errore nell\'invio email di aggiornamento',
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    )
  }
}
