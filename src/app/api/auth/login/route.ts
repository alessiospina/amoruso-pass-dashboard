import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'
import { z } from 'zod'

// Schema di validazione per i dati di login
const loginSchema = z.object({
  email: z.string().email('Formato email non valido'),
  password: z.string().min(1, 'La password è obbligatoria')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validazione dei dati in input
    const validationResult = loginSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dati non validi',
          errors: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

    // Tentativo di login
    const authResult = await AuthService.login({ email, password })

    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.message
        },
        { status: 401 }
      )
    }

    // Crea la response con il token nei cookie
    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      message: 'Login effettuato con successo'
    })

    // Imposta il token JWT come cookie httpOnly
    response.cookies.set('auth-token', authResult.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 giorni in secondi
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Errore nell\'API di login:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Errore interno del server'
      },
      { status: 500 }
    )
  }
}

// Metodo OPTIONS per CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
