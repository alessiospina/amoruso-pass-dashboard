import { NextRequest, NextResponse } from 'next/server'
import { getIngressoService } from '@/container/ingresso.container'
import { prisma } from '@/lib/prisma'

interface CorrelationData {
  email?: string
  ragione_sociale?: string
  targa?: string
  partita_iva?: string
  indirizzo?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const field = searchParams.get('field')
    const value = searchParams.get('value')

    if (!field || !value) {
      return NextResponse.json(
        { error: 'Parametri field e value sono richiesti' },
        { status: 400 }
      )
    }
    
    // Recupera i dati correlati più recenti per il valore selezionato
    let whereCondition: any = {}
    
    switch (field) {
      case 'partita_iva':
        whereCondition = { partita_iva: value }
        break
      case 'email':
        whereCondition = { email: value }
        break
      case 'ragione_sociale':
        whereCondition = { ragione_sociale: value }
        break
      case 'targa':
        whereCondition = { targa: value.toUpperCase() }
        break
      case 'indirizzo':
        whereCondition = { indirizzo: value }
        break
      default:
        return NextResponse.json(
          { error: 'Campo non valido' },
          { status: 400 }
        )
    }

    // Prende l'ingresso più recente che corrisponde al criterio
    const latestEntry = await prisma.ingresso.findFirst({
      where: whereCondition,
      orderBy: { created_at: 'desc' },
      select: {
        email: true,
        ragione_sociale: true,
        targa: true,
        partita_iva: true,
        indirizzo: true
      }
    })

    if (!latestEntry) {
      return NextResponse.json({})
    }

    // Restituisce tutti i campi correlati tranne quello di ricerca
    const correlations: CorrelationData = {}
    
    if (field !== 'email' && latestEntry.email) {
      correlations.email = latestEntry.email
    }
    if (field !== 'ragione_sociale' && latestEntry.ragione_sociale) {
      correlations.ragione_sociale = latestEntry.ragione_sociale
    }
    if (field !== 'targa' && latestEntry.targa) {
      correlations.targa = latestEntry.targa
    }
    if (field !== 'partita_iva' && latestEntry.partita_iva) {
      correlations.partita_iva = latestEntry.partita_iva
    }
    if (field !== 'indirizzo' && latestEntry.indirizzo) {
      correlations.indirizzo = latestEntry.indirizzo
    }

    return NextResponse.json(correlations)
  } catch (error) {
    console.error('Errore nel recupero correlazioni:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
