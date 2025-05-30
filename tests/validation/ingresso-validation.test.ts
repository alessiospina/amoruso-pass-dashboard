import { validateCreateIngresso } from '@/validation/ingresso.validation'

describe('Ingresso Validation', () => {
  describe('validateCreateIngresso', () => {
    it('should validate a valid ingresso with all required fields', () => {
      const validData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        partita_iva: '12345678901',
        indirizzo: 'Via Roma 123, Milano',
        importo: 50.99
      }

      const result = validateCreateIngresso(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing required partita_iva', () => {
      const invalidData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        indirizzo: 'Via Roma 123, Milano',
        importo: 50.99
      }

      const result = validateCreateIngresso(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing required indirizzo', () => {
      const invalidData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        partita_iva: '12345678901',
        importo: 50.99
      }

      const result = validateCreateIngresso(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty partita_iva', () => {
      const invalidData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        partita_iva: '',
        indirizzo: 'Via Roma 123, Milano',
        importo: 50.99
      }

      const result = validateCreateIngresso(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty indirizzo', () => {
      const invalidData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        partita_iva: '12345678901',
        indirizzo: '',
        importo: 50.99
      }

      const result = validateCreateIngresso(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        importo: 50.99
      }

      const result = validateCreateIngresso(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('email') && 
          issue.message.includes('Formato email non valido')
        )).toBe(true)
      }
    })

    it('should reject empty required fields', () => {
      const invalidData = {
        email: '',
        ragione_sociale: '',
        targa: '',
        importo: 0
      }

      const result = validateCreateIngresso(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })

    it('should reject invalid targa format', () => {
      const invalidData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'ab-123-cd',
        importo: 50.99
      }

      const result = validateCreateIngresso(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('targa')
        )).toBe(true)
      }
    })

    it('should reject invalid partita_iva format', () => {
      const invalidData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        partita_iva: '12345', // troppo corta
        importo: 50.99
      }

      const result = validateCreateIngresso(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('partita_iva')
        )).toBe(true)
      }
    })

    it('should reject partita_iva with non-numeric characters', () => {
      const invalidData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        partita_iva: '1234567890A', // contiene lettere
        importo: 50.99
      }

      const result = validateCreateIngresso(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('partita_iva')
        )).toBe(true)
      }
    })

    it('should reject indirizzo too long', () => {
      const invalidData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        indirizzo: 'A'.repeat(501), // troppo lungo
        importo: 50.99
      }

      const result = validateCreateIngresso(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('indirizzo') &&
          issue.message.includes('troppo lungo')
        )).toBe(true)
      }
    })

    it('should reject negative importo', () => {
      const invalidData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        importo: -10.50
      }

      const result = validateCreateIngresso(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('importo') && 
          issue.message.includes('positivo')
        )).toBe(true)
      }
    })

    it('should transform targa to uppercase', () => {
      const validData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'ab123cd',
        importo: 50.99
      }

      const result = validateCreateIngresso(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.targa).toBe('AB123CD')
      }
    })

    it('should validate importo with decimals', () => {
      const validData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        importo: 123.45
      }

      const result = validateCreateIngresso(validData)
      expect(result.success).toBe(true)
    })

    it('should reject importo with more than 2 decimals', () => {
      const invalidData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        importo: 123.456
      }

      const result = validateCreateIngresso(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('importo') && 
          issue.message.includes('decimali')
        )).toBe(true)
      }
    })

    it('should validate valid partita_iva with exactly 11 digits', () => {
      const validData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        partita_iva: '12345678901',
        importo: 50.99
      }

      const result = validateCreateIngresso(validData)
      expect(result.success).toBe(true)
    })

    it('should validate valid indirizzo within character limit', () => {
      const validData = {
        email: 'test@example.com',
        ragione_sociale: 'Test Company',
        targa: 'AB123CD',
        indirizzo: 'Via Roma 123, 20121 Milano (MI), Italia',
        importo: 50.99
      }

      const result = validateCreateIngresso(validData)
      expect(result.success).toBe(true)
    })
  })
})
