import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout effettuato con successo'
    })

    // Rimuove il token dai cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Scade immediatamente
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Errore nell\'API di logout:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Errore interno del server'
      },
      { status: 500 }
    )
  }
}
