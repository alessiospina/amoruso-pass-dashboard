import { NextResponse } from 'next/server'
import { getIngressoService } from '@/container/ingresso.container'

// GET - Statistiche ingressi
export async function GET() {
  try {
    const service = getIngressoService()
    const stats = await service.getIngressiStats()
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Errore GET /api/ingressi/stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
}
