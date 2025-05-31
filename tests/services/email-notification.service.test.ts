import { EmailNotificationService } from '@/services/email-notification.service'
import { MailerService } from '@/services/mailer.service'
import { EmailService } from '@/services/email.service'
import { Ingresso, Email } from '@prisma/client'

// Mock services
const mockMailerService = {
  sendEmailFromTemplate: jest.fn(),
  sendMultipleEmailsFromTemplate: jest.fn(),
  verifyConnection: jest.fn(),
} as unknown as MailerService

const mockEmailService = {
  getEmailById: jest.fn(),
  getEmails: jest.fn(),
} as unknown as EmailService

describe('EmailNotificationService', () => {
  let emailNotificationService: EmailNotificationService
  let mockIngresso: Ingresso
  let mockTemplate: Email

  beforeEach(() => {
    emailNotificationService = new EmailNotificationService(
      mockMailerService,
      mockEmailService
    )

    mockIngresso = {
      id: 'test-ingresso-id',
      email: 'test@example.com',
      ragione_sociale: 'Test Company',
      targa: 'AB123CD',
      partita_iva: '12345678901',
      indirizzo: 'Via Test 123',
      importo: 50.0,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    } as Ingresso

    mockTemplate = {
      id: 'test-template-id',
      name: 'Test Template',
      recipients: 'admin@example.com,manager@example.com',
      subject: 'Test Subject - {{ragione_sociale}}',
      body: '<p>Hello {{ragione_sociale}}, your vehicle {{targa}} has been processed for {{importo}}.</p>',
      isActive: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    } as Email

    // Reset all mocks
    jest.clearAllMocks()
  })

  describe('sendSingleNotification', () => {
    it('should send email successfully when template is active', async () => {
      // Arrange
      ;(mockEmailService.getEmailById as jest.Mock).mockResolvedValue(mockTemplate)
      ;(mockMailerService.sendEmailFromTemplate as jest.Mock).mockResolvedValue(undefined)

      // Act
      await emailNotificationService.sendSingleNotification(
        mockIngresso,
        'test-template-id',
        ['cc@example.com']
      )

      // Assert
      expect(mockEmailService.getEmailById).toHaveBeenCalledWith('test-template-id')
      expect(mockMailerService.sendEmailFromTemplate).toHaveBeenCalledWith(
        mockTemplate,
        mockIngresso,
        ['cc@example.com']
      )
    })

    it('should throw error when template is not active', async () => {
      // Arrange
      const inactiveTemplate = { ...mockTemplate, isActive: false }
      ;(mockEmailService.getEmailById as jest.Mock).mockResolvedValue(inactiveTemplate)

      // Act & Assert
      await expect(
        emailNotificationService.sendSingleNotification(mockIngresso, 'test-template-id')
      ).rejects.toThrow('Il template email non è attivo')

      expect(mockMailerService.sendEmailFromTemplate).not.toHaveBeenCalled()
    })
  })

  describe('previewEmail', () => {
    it('should generate email preview with replaced placeholders', async () => {
      // Arrange
      ;(mockEmailService.getEmailById as jest.Mock).mockResolvedValue(mockTemplate)

      // Act
      const preview = await emailNotificationService.previewEmail('test-template-id', mockIngresso)

      // Assert
      expect(preview.to).toBe('test@example.com')
      expect(preview.cc).toEqual(['admin@example.com', 'manager@example.com'])
      expect(preview.subject).toBe('Test Subject - Test Company')
      expect(preview.html).toContain('Hello Test Company')
      expect(preview.html).toContain('AB123CD')
      expect(preview.html).toContain('€50.00')
      expect(preview.text).toBe('Hello Test Company, your vehicle AB123CD has been processed for €50.00.')
    })

    it('should handle empty partita_iva and indirizzo', async () => {
      // Arrange
      const ingressoWithNulls = {
        ...mockIngresso,
        partita_iva: null,
        indirizzo: null,
      } as Ingresso

      const templateWithNulls = {
        ...mockTemplate,
        body: '<p>P.IVA: {{partita_iva}}, Address: {{indirizzo}}</p>',
      }

      ;(mockEmailService.getEmailById as jest.Mock).mockResolvedValue(templateWithNulls)

      // Act
      const preview = await emailNotificationService.previewEmail('test-template-id', ingressoWithNulls)

      // Assert
      expect(preview.html).toContain('P.IVA: , Address: ')
    })
  })

  describe('verifyEmailConfiguration', () => {
    it('should return valid when SMTP and templates are configured', async () => {
      // Arrange
      ;(mockMailerService.verifyConnection as jest.Mock).mockResolvedValue(true)
      ;(mockEmailService.getEmails as jest.Mock).mockResolvedValue({
        data: [mockTemplate],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      })

      // Act
      const result = await emailNotificationService.verifyEmailConfiguration()

      // Assert
      expect(result.isValid).toBe(true)
      expect(result.message).toContain('1 template(s) attivo(i)')
    })

    it('should return invalid when SMTP connection fails', async () => {
      // Arrange
      ;(mockMailerService.verifyConnection as jest.Mock).mockResolvedValue(false)

      // Act
      const result = await emailNotificationService.verifyEmailConfiguration()

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('Impossibile connettersi al server SMTP')
    })

    it('should return invalid when no active templates exist', async () => {
      // Arrange
      ;(mockMailerService.verifyConnection as jest.Mock).mockResolvedValue(true)
      ;(mockEmailService.getEmails as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 1,
      })

      // Act
      const result = await emailNotificationService.verifyEmailConfiguration()

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('Nessun template email attivo configurato')
    })
  })

  describe('sendBulkNotifications', () => {
    it('should send bulk emails successfully', async () => {
      // Arrange
      const ingressi = [mockIngresso, { ...mockIngresso, id: 'test-2', email: 'test2@example.com' }]
      ;(mockEmailService.getEmailById as jest.Mock).mockResolvedValue(mockTemplate)
      ;(mockMailerService.sendMultipleEmailsFromTemplate as jest.Mock).mockResolvedValue({
        success: 2,
        failed: 0,
        errors: [],
      })

      // Act
      const result = await emailNotificationService.sendBulkNotifications(
        ingressi,
        'test-template-id',
        ['cc@example.com']
      )

      // Assert
      expect(result.sent).toBe(2)
      expect(result.failed).toBe(0)
      expect(result.errors).toHaveLength(0)
      expect(mockMailerService.sendMultipleEmailsFromTemplate).toHaveBeenCalledWith(
        mockTemplate,
        ingressi,
        ['cc@example.com']
      )
    })
  })

  describe('sendNotificationsForNewIngresso', () => {
    it('should send notifications to all active templates', async () => {
      // Arrange
      const activeTemplates = [mockTemplate, { ...mockTemplate, id: 'template-2', name: 'Template 2' }]
      ;(mockEmailService.getEmails as jest.Mock).mockResolvedValue({
        data: activeTemplates,
        total: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      })
      ;(mockMailerService.sendEmailFromTemplate as jest.Mock).mockResolvedValue(undefined)

      // Act
      const result = await emailNotificationService.sendNotificationsForNewIngresso(mockIngresso)

      // Assert
      expect(result.sent).toBe(2)
      expect(result.failed).toBe(0)
      expect(mockMailerService.sendEmailFromTemplate).toHaveBeenCalledTimes(2)
    })

    it('should handle errors gracefully and continue with other templates', async () => {
      // Arrange
      const activeTemplates = [mockTemplate, { ...mockTemplate, id: 'template-2', name: 'Template 2' }]
      ;(mockEmailService.getEmails as jest.Mock).mockResolvedValue({
        data: activeTemplates,
        total: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      })
      ;(mockMailerService.sendEmailFromTemplate as jest.Mock)
        .mockResolvedValueOnce(undefined) // First call succeeds
        .mockRejectedValueOnce(new Error('SMTP Error')) // Second call fails

      // Act
      const result = await emailNotificationService.sendNotificationsForNewIngresso(mockIngresso)

      // Assert
      expect(result.sent).toBe(1)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Template 2')
      expect(result.errors[0]).toContain('SMTP Error')
    })
  })
})
