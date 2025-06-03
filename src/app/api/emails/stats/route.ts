import { NextResponse } from 'next/server'
import { emailContainer } from '@/container/email.container'

export async function GET() {
  try {
    const emailService = emailContainer.getEmailService()
    
    // Ottieni tutti i template per calcolare le statistiche
    const result = await emailService.getEmails({}, { page: 1, limit: 1000 })
    const templates = result.data
    
    // Calcola statistiche (gestisce anche il caso di array vuoto)
    const total = templates.length
    const active = templates.filter(t => t.isActive).length
    const inactive = total - active
    
    // Trova il template creato più di recente (se esistono template)
    const lastCreated = templates.length > 0 
      ? templates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      : null
    
    // Trova il template aggiornato più di recente (se esistono template)
    const lastUpdated = templates.length > 0
      ? templates.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
      : null
    
    const stats = {
      total,
      active,
      inactive,
      lastCreated,
      lastUpdated,
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Errore nel calcolo delle statistiche email:', error)
    return NextResponse.json(
      { error: 'Errore nel calcolo delle statistiche' },
      { status: 500 }
    )
  }
}
