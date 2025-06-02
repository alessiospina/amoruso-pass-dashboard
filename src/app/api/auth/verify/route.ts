import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token non trovato' },
        { status: 401 }
      )
    }

    const user = await AuthService.verifyToken(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Token non valido' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Errore nella verifica del token:', error)
    
    return NextResponse.json(
      { success: false, message: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
