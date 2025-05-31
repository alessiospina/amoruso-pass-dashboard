import { Ingresso } from '@prisma/client'
import { IngressoRepository } from '@/repositories/ingresso.repository'
import {
  CreateIngressoDTO,
  UpdateIngressoDTO,
  IngressoFiltersDTO,
  PaginationDTO,
  PaginatedResultDTO,
} from '@/dto/ingresso.dto'

export class IngressoService {
  constructor(
    private ingressoRepository: IngressoRepository
  ) {}

  async createIngresso(data: CreateIngressoDTO): Promise<Ingresso> {
    try {
      // Business logic: normalizza i dati
      const normalizedData: CreateIngressoDTO = {
        ...data,
        targa: data.targa.toUpperCase().replace(/\s/g, ''),
        ragione_sociale: data.ragione_sociale.trim(),
        email: data.email.toLowerCase().trim(),
        partita_iva: data.partita_iva?.trim() || undefined,
        indirizzo: data.indirizzo?.trim() || undefined,
      }

      // Crea l'ingresso
      const ingresso = await this.ingressoRepository.create(normalizedData)

      return ingresso
    } catch (error) {
      throw new Error(`Errore nella creazione dell'ingresso: ${error}`)
    }
  }

  async getIngressoById(id: string): Promise<Ingresso> {
    const ingresso = await this.ingressoRepository.findById(id)

    if (!ingresso) {
      throw new Error('Ingresso non trovato')
    }

    return ingresso
  }

  async getIngressi(
    filters: IngressoFiltersDTO = {},
    pagination: PaginationDTO = { page: 1, limit: 10 },
  ): Promise<PaginatedResultDTO<Ingresso>> {
    return this.ingressoRepository.findMany(filters, pagination)
  }

  async getIngressiByEmail(email: string): Promise<Ingresso[]> {
    if (!email.trim()) {
      throw new Error('Email non può essere vuota')
    }

    return this.ingressoRepository.findByEmail(email.toLowerCase())
  }

  async getIngressiByTarga(targa: string): Promise<Ingresso[]> {
    if (!targa.trim()) {
      throw new Error('Targa non può essere vuota')
    }

    return this.ingressoRepository.findByTarga(targa.toUpperCase())
  }

  async updateIngresso(id: string, data: UpdateIngressoDTO): Promise<Ingresso> {
    // Verifica esistenza
    await this.getIngressoById(id)

    // Business logic: normalizza i dati se presenti
    const normalizedData: UpdateIngressoDTO = { ...data }

    if (normalizedData.targa) {
      normalizedData.targa = normalizedData.targa.toUpperCase().replace(/\s/g, '')
    }

    if (normalizedData.ragione_sociale) {
      normalizedData.ragione_sociale = normalizedData.ragione_sociale.trim()
    }

    if (normalizedData.email) {
      normalizedData.email = normalizedData.email.toLowerCase().trim()
    }

    if (normalizedData.partita_iva !== undefined) {
      normalizedData.partita_iva = normalizedData.partita_iva?.trim() || undefined
    }

    if (normalizedData.indirizzo !== undefined) {
      normalizedData.indirizzo = normalizedData.indirizzo?.trim() || undefined
    }

    return this.ingressoRepository.update(id, normalizedData)
  }

  async deleteIngresso(id: string): Promise<void> {
    // Verifica esistenza
    await this.getIngressoById(id)

    await this.ingressoRepository.delete(id)
  }

  async searchIngressi(query: string, limit: number = 10): Promise<Ingresso[]> {
    if (!query.trim()) {
      return []
    }
    return this.ingressoRepository.search(query.trim(), limit > 50 ? 50 : limit)
  }

  async validateBusinessRules(data: CreateIngressoDTO | UpdateIngressoDTO): Promise<string[]> {
    const errors: string[] = []

    // Business rule: controllo importo ragionevole
    if (data.importo !== undefined) {
      if (data.importo > 10000) {
        errors.push('Importo superiore a €10.000 richiede approvazione speciale')
      }

      if (data.importo < 0.01) {
        errors.push('Importo minimo è €0.01')
      }
    }

    // Business rule: controllo formato targa italiana
    if (data.targa) {
      const targaPattern = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$|^[A-Z0-9]{7}$/i
      if (!targaPattern.test(data.targa)) {
        errors.push('Formato targa non standard (es: AA123BB)')
      }
    }

    // Business rule: validazione partita IVA italiana (algoritmo semplificato)
    if (data.partita_iva) {
      // Controllo di base: solo numeri e lunghezza
      if (!/^[0-9]{11}$/.test(data.partita_iva)) {
        errors.push('Partita IVA deve contenere esattamente 11 cifre')
      }
    }

    return errors
  }

  // Metodi per statistiche dashboard
  async getTotalCount(): Promise<number> {
    return await this.ingressoRepository.count()
  }

  async getTodayCount(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return await this.ingressoRepository.countByDateRange(today, tomorrow)
  }

  async getMonthlyCount(): Promise<number> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    
    return await this.ingressoRepository.countByDateRange(startOfMonth, endOfMonth)
  }

  async getTotalRevenue(): Promise<number> {
    return await this.ingressoRepository.sumImporti()
  }

  async getTodayRevenue(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return await this.ingressoRepository.sumImportiByDateRange(today, tomorrow)
  }

  async getMonthlyRevenue(): Promise<number> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    
    return await this.ingressoRepository.sumImportiByDateRange(startOfMonth, endOfMonth)
  }

  async getDailyStats(days: number): Promise<Array<{ date: string, ingressi: number, importo: number }>> {
    return await this.ingressoRepository.getDailyStats(days)
  }

  async getMonthlyStats(months: number): Promise<Array<{ month: string, ingressi: number, importo: number }>> {
    return await this.ingressoRepository.getMonthlyStats(months)
  }

  async getTopTarghe(limit: number): Promise<Array<{ targa: string, count: number, totalImporto: number }>> {
    return await this.ingressoRepository.getTopTarghe(limit)
  }

  async getTopRagioneSociali(limit: number): Promise<Array<{ ragione_sociale: string, count: number, totalImporto: number }>> {
    return await this.ingressoRepository.getTopRagioneSociali(limit)
  }

  async getUniqueTargheCount(): Promise<number> {
    return await this.ingressoRepository.getUniqueTargheCount()
  }

  async getUniqueRagioneSocialiCount(): Promise<number> {
    return await this.ingressoRepository.getUniqueRagioneSocialiCount()
  }

  async getMostProfitableTarga(): Promise<{ targa: string, totalImporto: number } | null> {
    return await this.ingressoRepository.getMostProfitableTarga()
  }

  async getMostProfitableRagioneSociale(): Promise<{ ragione_sociale: string, totalImporto: number } | null> {
    return await this.ingressoRepository.getMostProfitableRagioneSociale()
  }

  async getRecentActivity(limit: number): Promise<Ingresso[]> {
    const result = await this.ingressoRepository.findMany({}, { page: 1, limit })
    return result.data
  }
}
