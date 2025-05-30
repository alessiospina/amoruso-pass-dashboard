/**
 * Script di utilità per testare le statistiche della dashboard
 * Può essere usato per creare dati di test per verificare il funzionamento
 */

export interface TestIngressoData {
  email: string
  ragione_sociale: string
  targa: string
  importo: number
  created_at?: Date
}

export const generateTestData = (): TestIngressoData[] => {
  const companies = [
    'Azienda Alpha S.r.l.',
    'Beta Logistics',
    'Gamma Transport',
    'Delta Services',
    'Epsilon Delivery',
    'Zeta Corporation',
    'Eta Solutions',
    'Theta Group',
    'Iota Industries',
    'Kappa Holdings'
  ]

  const emails = [
    'admin@alpha.it',
    'info@beta.it',
    'trasporti@gamma.it',
    'servizi@delta.it',
    'delivery@epsilon.it',
    'contact@zeta.it',
    'info@eta.it',
    'group@theta.it',
    'industries@iota.it',
    'holdings@kappa.it'
  ]

  const targhe = [
    'AB123CD',
    'EF456GH',
    'IJ789KL',
    'MN012OP',
    'QR345ST',
    'UV678WX',
    'YZ901AB',
    'CD234EF',
    'GH567IJ',
    'KL890MN'
  ]

  const data: TestIngressoData[] = []
  
  // Genera dati per gli ultimi 60 giorni
  for (let day = 0; day < 60; day++) {
    const date = new Date()
    date.setDate(date.getDate() - day)
    
    // Numero variabile di ingressi per giorno (1-15)
    const dailyEntries = Math.floor(Math.random() * 15) + 1
    
    for (let entry = 0; entry < dailyEntries; entry++) {
      const randomHour = Math.floor(Math.random() * 24)
      const randomMinute = Math.floor(Math.random() * 60)
      const entryDate = new Date(date)
      entryDate.setHours(randomHour, randomMinute, 0, 0)
      
      const companyIndex = Math.floor(Math.random() * companies.length)
      const targaIndex = Math.floor(Math.random() * targhe.length)
      
      // Importi variabili tra 5€ e 500€
      const importo = Math.round((Math.random() * 495 + 5) * 100) / 100
      
      data.push({
        email: emails[companyIndex],
        ragione_sociale: companies[companyIndex],
        targa: targhe[targaIndex],
        importo: importo,
        created_at: entryDate
      })
    }
  }
  
  return data.sort((a, b) => {
    const dateA = a.created_at || new Date()
    const dateB = b.created_at || new Date()
    return dateB.getTime() - dateA.getTime()
  })
}

export const calculateStats = (data: TestIngressoData[]) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const todayData = data.filter(item => {
    const itemDate = item.created_at || new Date()
    return itemDate >= today
  })
  
  const monthlyData = data.filter(item => {
    const itemDate = item.created_at || new Date()
    return itemDate >= thisMonth
  })
  
  return {
    total: {
      count: data.length,
      revenue: data.reduce((sum, item) => sum + item.importo, 0)
    },
    today: {
      count: todayData.length,
      revenue: todayData.reduce((sum, item) => sum + item.importo, 0)
    },
    monthly: {
      count: monthlyData.length,
      revenue: monthlyData.reduce((sum, item) => sum + item.importo, 0)
    }
  }
}
