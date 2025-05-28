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
  constructor(private ingressoRepository: IngressoRepository) {}

  async createIngresso(data: CreateIngressoDTO): Promise<Ingresso> {
    try {
      // Business logic: normalizza la targa
      const normalizedData: CreateIngressoDTO = {
        ...data,
        targa: data.targa.toUpperCase().replace(/\s/g, ''),
        ragione_sociale: data.ragione_sociale.trim(),
      }

      return await this.ingressoRepository.create(normalizedData)
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
      normalizedData.email = normalizedData.email.toLowerCase()
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

    return errors
  }
}
