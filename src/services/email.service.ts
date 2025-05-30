import { Email } from '@prisma/client'
import { EmailRepository } from '@/repositories/email.repository'
import {
  CreateEmailDTO,
  UpdateEmailDTO,
  EmailFiltersDTO,
} from '@/dto/email.dto'
import { PaginationDTO, PaginatedResultDTO } from '@/dto/ingresso.dto'

export class EmailService {
  constructor(private emailRepository: EmailRepository) {}

  async createEmail(data: CreateEmailDTO): Promise<Email> {
    try {
      // Normalizza i dati
      const normalizedData: CreateEmailDTO = {
        name: data.name.trim(),
        recipients: data.recipients.map(email => email.toLowerCase().trim()),
        subject: data.subject.trim(),
        body: data.body.trim(),
      }

      return await this.emailRepository.create(normalizedData)
    } catch (error) {
      throw new Error(`Errore nella creazione del template email: ${error}`)
    }
  }

  async getEmailById(id: string): Promise<Email> {
    const email = await this.emailRepository.findById(id)

    if (!email) {
      throw new Error('Template email non trovato')
    }

    return email
  }

  async getEmails(
    filters: EmailFiltersDTO = {},
    pagination: PaginationDTO = { page: 1, limit: 10 },
  ): Promise<PaginatedResultDTO<Email>> {
    return this.emailRepository.findMany(filters, pagination)
  }

  async getEmailsByName(name: string): Promise<Email[]> {
    if (!name.trim()) {
      throw new Error('Nome non può essere vuoto')
    }

    return this.emailRepository.findByName(name.trim())
  }

  async updateEmail(id: string, data: UpdateEmailDTO): Promise<Email> {
    // Verifica esistenza
    await this.getEmailById(id)

    // Normalizza i dati se presenti
    const normalizedData: UpdateEmailDTO = { ...data }

    if (normalizedData.name) {
      normalizedData.name = normalizedData.name.trim()
    }

    if (normalizedData.recipients) {
      normalizedData.recipients = normalizedData.recipients.map(email => email.toLowerCase().trim())
    }

    if (normalizedData.subject) {
      normalizedData.subject = normalizedData.subject.trim()
    }

    if (normalizedData.body) {
      normalizedData.body = normalizedData.body.trim()
    }

    return this.emailRepository.update(id, normalizedData)
  }

  async deleteEmail(id: string): Promise<void> {
    // Verifica esistenza
    await this.getEmailById(id)

    await this.emailRepository.delete(id)
  }

  async searchEmails(query: string, limit: number = 10): Promise<Email[]> {
    if (!query.trim()) {
      return []
    }
    return this.emailRepository.search(query.trim(), limit > 50 ? 50 : limit)
  }

  async validateBusinessRules(data: CreateEmailDTO | UpdateEmailDTO): Promise<string[]> {
    const errors: string[] = []

    // Business rule: controlla duplicati per nome
    if (data.name) {
      const existing = await this.emailRepository.findByName(data.name)
      if (existing.length > 0) {
        errors.push('Esiste già un template con questo nome')
      }
    }

    return errors
  }

  // Utility per convertire recipients da stringa a array
  static parseRecipients(recipients: string): string[] {
    return recipients.split(',').map(email => email.trim()).filter(email => email.length > 0)
  }

  // Utility per convertire recipients da array a stringa
  static stringifyRecipients(recipients: string[]): string {
    return recipients.join(',')
  }
}
