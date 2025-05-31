import { Ingresso, Email } from '@prisma/client'
import { MailerService } from './mailer.service'
import { EmailService } from './email.service'
import { EmailRepository } from '@/repositories/email.repository'
import { CreateEmailDTO, UpdateEmailDTO, EmailFiltersDTO } from '@/dto/email.dto'
import { PaginationDTO, PaginatedResultDTO } from '@/dto/ingresso.dto'
import { replaceAllPlaceholders } from '@/constants/email-replacements'

export interface EmailNotificationStatus {
  success: boolean
  message: string
  timestamp: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
  templateUsed?: string
}

/**
 * Servizio semplificato per la gestione delle notifiche email.
 * Gestisce template email e invio automatico per nuovi ingressi.
 */
export class EmailNotificationService {
  private mailerService: MailerService
  private emailService: EmailService

  constructor(emailRepository: EmailRepository) {
    this.mailerService = new MailerService()
    this.emailService = new EmailService(emailRepository)
  }

  // ==================== GESTIONE TEMPLATE ====================

  /**
   * Crea un nuovo template email
   */
  async createTemplate(data: CreateEmailDTO): Promise<Email> {
    return await this.emailService.createEmail(data)
  }

  /**
   * Aggiorna un template esistente
   */
  async updateTemplate(id: string, data: UpdateEmailDTO): Promise<Email> {
    return await this.emailService.updateEmail(id, data)
  }

  /**
   * Elimina un template
   */
  async deleteTemplate(id: string): Promise<void> {
    return await this.emailService.deleteEmail(id)
  }

  /**
   * Ottiene un template per ID
   */
  async getTemplate(id: string): Promise<Email> {
    return await this.emailService.getEmailById(id)
  }

  /**
   * Ottiene tutti i template con paginazione e filtri
   */
  async getTemplates(
    filters: EmailFiltersDTO = {},
    pagination: PaginationDTO = { page: 1, limit: 10 }
  ): Promise<PaginatedResultDTO<Email>> {
    return await this.emailService.getEmails(filters, pagination)
  }

  /**
   * Ottiene solo i template attivi
   */
  async getActiveTemplates(): Promise<Email[]> {
    const result = await this.emailService.getEmails({ isActive: true }, { page: 1, limit: 1000 })
    return result.data
  }

  // ==================== CONFIGURAZIONE E VERIFICA ====================

  /**
   * Testa l'invio di una email
   */
  async testEmailConfiguration(): Promise<EmailNotificationStatus> {
    try {
      const canConnect = await this.mailerService.verifyConnection()
      
      if (!canConnect) {
        return {
          success: false,
          message: 'Impossibile connettersi al server SMTP',
          timestamp: new Date().toISOString(),
        }
      }

      return {
        success: true,
        message: 'Configurazione email verificata con successo',
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        message: `Errore nel test: ${error}`,
        timestamp: new Date().toISOString(),
      }
    }
  }

  // ==================== INVIO EMAIL ====================

  /**
   * Invia una email di test semplice
   */
  async sendTestEmail(testEmailData: { to: string; subject: string; body: string }): Promise<EmailSendResult> {
    try {
      const emailOptions = {
        to: [testEmailData.to],
        subject: testEmailData.subject,
        html: testEmailData.body,
        text: this.stripHtml(testEmailData.body),
      }

      await this.mailerService.sendEmail(emailOptions)
      
      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: `Errore nell'invio email di test: ${error}`,
      }
    }
  }

  /**
   * Invia email per un singolo ingresso usando un template specifico
   * Destinatari: recipients del template
   * CC: email dell'ingresso
   */
  async sendEmailForIngresso(
    ingressoId: string, 
    templateId: string, 
    ingresso?: Ingresso
  ): Promise<EmailSendResult> {
    try {
      // Ottieni template
      const template = await this.getTemplate(templateId)
      
      if (!template.isActive) {
        return {
          success: false,
          error: 'Template non attivo',
          templateUsed: template.name,
        }
      }

      // Se l'ingresso non è fornito, dovrebbe essere recuperato dal repository
      if (!ingresso) {
        throw new Error('Dati ingresso non forniti')
      }

      // Parse recipients from template
      const recipients = this.parseRecipients(template.recipients)
      
      // Replace placeholders in subject and body with ingresso data
      const processedSubject = this.replacePlaceholders(template.subject, ingresso)
      const processedBody = this.replacePlaceholders(template.body, ingresso)

      // Prepare email options
      const emailOptions = {
        to: recipients, // Destinatari principali sono i recipients del template
        cc: [ingresso.email], // CC è l'email dell'ingresso
        subject: processedSubject,
        html: processedBody,
        text: this.stripHtml(processedBody),
      }

      await this.mailerService.sendEmail(emailOptions)
      
      return {
        success: true,
        templateUsed: template.name,
      }
    } catch (error) {
      return {
        success: false,
        error: `Errore nell'invio: ${error}`,
        templateUsed: templateId,
      }
    }
  }

  /**
   * Invia email automatiche per un nuovo ingresso usando tutti i template attivi
   * Se non ci sono template attivi, non invia nessuna email
   */
  async sendAutomaticEmailsForNewIngresso(ingresso: Ingresso): Promise<EmailSendResult[]> {
    const activeTemplates = await this.getActiveTemplates()
    
    // Se non ci sono template attivi, non inviare email
    if (activeTemplates.length === 0) {
      console.log(`Nessun template email attivo trovato - nessuna email inviata per ingresso ${ingresso.id}`)
      return []
    }

    const results: EmailSendResult[] = []

    for (const template of activeTemplates) {
      try {
        const result = await this.sendEmailForIngresso(ingresso.id, template.id, ingresso)
        results.push(result)
      } catch (error) {
        const errorResult: EmailSendResult = {
          success: false,
          error: `Errore imprevisto: ${error}`,
          templateUsed: template.name,
        }
        results.push(errorResult)
      }
    }

    return results
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Converte recipients da stringa a array
   */
  private parseRecipients(recipients: string): string[] {
    return recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0 && this.isValidEmail(email))
  }

  /**
   * Sostituisce i placeholder nel testo con i dati dell'ingresso
   * Usa il nuovo sistema di replacement con formato $CAMPO$
   */
  private replacePlaceholders(text: string, ingresso: Ingresso): string {
    return replaceAllPlaceholders(text, ingresso)
  }

  /**
   * Valida formato email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Rimuove tag HTML dal testo
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
  }
}
