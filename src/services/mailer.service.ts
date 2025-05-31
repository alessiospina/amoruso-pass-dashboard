import nodemailer from 'nodemailer'
import { Ingresso, Email } from '@prisma/client'
import { replaceAllPlaceholders } from '@/constants/email-replacements'

export interface EmailOptions {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  html: string
  text?: string
}

export class MailerService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'Amoruso Pass System',
          address: process.env.SMTP_FROM_EMAIL || 'noreply@example.com',
        },
        to: options.to.join(', '),
        cc: options.cc?.join(', '),
        bcc: options.bcc?.join(', '),
        subject: options.subject,
        html: options.html,
        text: options.text,
      }

      await this.transporter.sendMail(mailOptions)
    } catch (error) {
      console.error('Errore nell\'invio email:', error)
      throw new Error(`Errore nell'invio email: ${error}`)
    }
  }

  async sendEmailFromTemplate(
    template: Email,
    ingresso: Ingresso,
    ccEmails: string[] = []
  ): Promise<void> {
    try {
      // Parse recipients from template
      const recipients = this.parseRecipients(template.recipients)
      
      // Replace placeholders in subject and body with ingresso data
      const processedSubject = this.replacePlaceholders(template.subject, ingresso)
      const processedBody = this.replacePlaceholders(template.body, ingresso)

      // Prepare email options
      const emailOptions: EmailOptions = {
        to: [ingresso.email], // Destinatario principale è sempre l'email dell'ingresso
        cc: [...recipients, ...ccEmails], // CC include i recipients del template + eventuali CC aggiuntivi
        subject: processedSubject,
        html: processedBody,
        text: this.stripHtml(processedBody), // Versione testo senza HTML
      }

      await this.sendEmail(emailOptions)
    } catch (error) {
      console.error('Errore nell\'invio email da template:', error)
      throw new Error(`Errore nell'invio email da template: ${error}`)
    }
  }

  async sendMultipleEmailsFromTemplate(
    template: Email,
    ingressi: Ingresso[],
    ccEmails: string[] = []
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const ingresso of ingressi) {
      try {
        await this.sendEmailFromTemplate(template, ingresso, ccEmails)
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`Errore per ingresso ${ingresso.id}: ${error}`)
      }
    }

    return results
  }

  async sendEmailsForNewIngresso(ingresso: Ingresso, activeTemplates: Email[]): Promise<void> {
    const ccEmails = this.parseRecipients(activeTemplates.map(t => t.recipients).join(','))

    for (const template of activeTemplates) {
      if (template.isActive) {
        try {
          await this.sendEmailFromTemplate(template, ingresso, ccEmails)
        } catch (error) {
          console.error(`Errore nell'invio email per template ${template.name}:`, error)
          // Continua con gli altri template anche se uno fallisce
        }
      }
    }
  }

  private replacePlaceholders(text: string, ingresso: Ingresso): string {
    return replaceAllPlaceholders(text, ingresso)
  }

  private parseRecipients(recipients: string): string[] {
    return recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0 && this.isValidEmail(email))
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error('Errore nella verifica della connessione SMTP:', error)
      return false
    }
  }
}
