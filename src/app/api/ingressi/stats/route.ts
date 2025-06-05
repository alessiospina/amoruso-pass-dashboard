import { NextRequest, NextResponse } from 'next/server'
import { getIngressoService } from '@/container/ingresso.container'
import { withAuth, AuthenticatedUser } from '@/middleware/auth.middleware'

export const dynamic = 'force-dynamic'

// GET - Statistiche ingressi (PROTETTO)
export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log(`[API] GET /ingressi/stats - Utente autenticato: ${user.email}`)

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') ?? '30' // Default 30 giorni

    const service = getIngressoService()
    
    // Statistiche generali
    const totalIngressi = await service.getTotalCount()
    const todayIngressi = await service.getTodayCount()
    const monthlyIngressi = await service.getMonthlyCount()
    
    // Importi
    const totalImporti = await service.getTotalRevenue()
    const todayImporti = await service.getTodayRevenue()
    const monthlyImporti = await service.getMonthlyRevenue()
    
    // Statistiche aggiuntive per riepilogo
    const uniqueTarghe = await service.getUniqueTargheCount()
    const uniqueRagioneSociali = await service.getUniqueRagioneSocialiCount()
    const mostProfitableTarga = await service.getMostProfitableTarga()
    const mostProfitableRagioneSociale = await service.getMostProfitableRagioneSociale()
    
    // Dati per grafici
    const dailyStats = await service.getDailyStats(parseInt(period))
    const monthlyStats = await service.getMonthlyStats(12) // Ultimi 12 mesi
    const topTarghe = await service.getTopTarghe(10)
    const topRagioneSociali = await service.getTopRagioneSociali(10)
    const recentActivity = await service.getRecentActivity(5)
    
    const stats = {
      overview: {
        totalIngressi,
        todayIngressi,
        monthlyIngressi,
        totalImporti,
        todayImporti,
        monthlyImporti,
        uniqueTarghe,
        uniqueRagioneSociali,
        mostProfitableTarga,
        mostProfitableRagioneSociale,
      },
      charts: {
        dailyStats,
        monthlyStats,
        topTarghe,
        topRagioneSociali,
      },
      recentActivity,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Errore GET /api/ingressi/stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    )
  }
})
