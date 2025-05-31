import { prisma } from '@/lib/prisma'
import { PrismaEmailRepository } from '@/repositories/email.repository'
import { EmailService } from '@/services/email.service'
import { EmailNotificationService } from '@/services/email-notification.service'

// Container per Dependency Injection
class EmailContainer {
  private static instance: EmailContainer
  private _emailService: EmailService | null = null
  private _emailNotificationService: EmailNotificationService | null = null

  private constructor() {}

  static getInstance(): EmailContainer {
    if (!EmailContainer.instance) {
      EmailContainer.instance = new EmailContainer()
    }
    return EmailContainer.instance
  }

  getEmailService(): EmailService {
    if (!this._emailService) {
      const repository = new PrismaEmailRepository(prisma)
      this._emailService = new EmailService(repository)
    }
    return this._emailService
  }

  getEmailNotificationService(): EmailNotificationService {
    if (!this._emailNotificationService) {
      const repository = new PrismaEmailRepository(prisma)
      this._emailNotificationService = new EmailNotificationService(repository)
    }
    return this._emailNotificationService
  }

  // Per testing - permette di iniettare mock
  setEmailService(service: EmailService): void {
    this._emailService = service
    this._emailNotificationService = null
  }

  setEmailNotificationService(service: EmailNotificationService): void {
    this._emailNotificationService = service
  }

  // Reset per testing
  reset(): void {
    this._emailService = null
    this._emailNotificationService = null
  }
}

// Singleton instance
export const emailContainer = EmailContainer.getInstance()

// Helper functions per ottenere i services
export const getEmailService = (): EmailService => {
  return emailContainer.getEmailService()
}

export const getEmailNotificationService = (): EmailNotificationService => {
  return emailContainer.getEmailNotificationService()
}
