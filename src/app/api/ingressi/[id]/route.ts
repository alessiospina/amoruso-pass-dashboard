import { NextRequest, NextResponse } from 'next/server'
import { getIngressoService } from '@/container/ingresso.container'
import { validateUpdateIngresso, validateId } from '@/validation/ingresso.validation'

// GET - Ottieni singolo ingresso
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validazione ID
    const idResult = validateId({ id: params.id })
    
    if (!idResult.success) {
      return NextResponse.json(
        { 
          error: 'ID non valido',
          details: idResult.error.format()
        },
        { status: 400 }
      )
    }

    const service = getIngressoService()
    const ingresso = await service.getIngressoById(idResult.data.id)

    return NextResponse.json(ingresso)
  } catch (error) {
    console.error('Errore GET /api/ingressi/[id]:', error)
    
    if (error instanceof Error && error.message.includes('non trovato')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna ingresso
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validazione ID
    const idResult = validateId({ id: params.id })
    
    if (!idResult.success) {
      return NextResponse.json(
        { 
          error: 'ID non valido',
          details: idResult.error.format()
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validazione dati update
    const validationResult = validateUpdateIngresso(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dati non validi',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const service = getIngressoService()
    
    // Validazione business rules
    const businessErrors = await service.validateBusinessRules(validationResult.data)
    
    if (businessErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Violazione regole business',
          details: businessErrors
        },
        { status: 422 }
      )
    }

    const ingresso = await service.updateIngresso(
      idResult.data.id, 
      validationResult.data
    )
    
    return NextResponse.json(ingresso)
  } catch (error) {
    console.error('Errore PUT /api/ingressi/[id]:', error)
    
    if (error instanceof Error && error.message.includes('non trovato')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina ingresso
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validazione ID
    const idResult = validateId({ id: params.id })
    
    if (!idResult.success) {
      return NextResponse.json(
        { 
          error: 'ID non valido',
          details: idResult.error.format()
        },
        { status: 400 }
      )
    }

    const service = getIngressoService()
    await service.deleteIngresso(idResult.data.id)
    
    return NextResponse.json(
      { message: 'Ingresso eliminato con successo' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Errore DELETE /api/ingressi/[id]:', error)
    
    if (error instanceof Error && error.message.includes('non trovato')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
}
