'use client'

import React, { useState } from 'react'
import { Card, Row, Col, Form, Button, Alert, Toast, ToastContainer } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faTrash, faCheck } from '@fortawesome/free-solid-svg-icons'
import { validateCreateIngresso } from '@/validation/ingresso.validation'
import { CreateIngressoDTO } from '@/dto/ingresso.dto'
import AutocompleteInput from '@/components/UI/AutocompleteInput'
import { apiGet, apiPost } from '@/utils/api.utils'

interface FieldError {
  message: string
  isValid: boolean
}

interface IngressoFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function IngressoForm({ onSuccess, onError }: IngressoFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldError>>({})

  const initialData: CreateIngressoDTO = {
    email: '',
    ragione_sociale: '',
    targa: '',
    partita_iva: '',
    indirizzo: '',
    importo: 0,
  }

  const [formData, setFormData] = useState<CreateIngressoDTO>(initialData)

  // Funzioni per fetch dei suggerimenti
  const fetchEmailSuggestions = async (query: string): Promise<string[]> => {
    try {
      return await apiGet<string[]>(`/api/suggestions/email?q=${encodeURIComponent(query)}&limit=10`)
    } catch (error) {
      console.error('Errore caricamento suggerimenti email:', error)
      return []
    }
  }

  const fetchRagioneSocialeSuggestions = async (query: string): Promise<string[]> => {
    try {
      return await apiGet<string[]>(`/api/suggestions/ragione-sociale?q=${encodeURIComponent(query)}&limit=10`)
    } catch (error) {
      console.error('Errore caricamento suggerimenti ragione sociale:', error)
      return []
    }
  }

  const fetchTargaSuggestions = async (query: string): Promise<string[]> => {
    try {
      return await apiGet<string[]>(`/api/suggestions/targa?q=${encodeURIComponent(query)}&limit=10`)
    } catch (error) {
      console.error('Errore caricamento suggerimenti targa:', error)
      return []
    }
  }

  const fetchPartitaIvaSuggestions = async (query: string): Promise<string[]> => {
    try {
      return await apiGet<string[]>(`/api/suggestions/partita-iva?q=${encodeURIComponent(query)}&limit=10`)
    } catch (error) {
      console.error('Errore caricamento suggerimenti partita IVA:', error)
      return []
    }
  }

  const fetchIndirizzoSuggestions = async (query: string): Promise<string[]> => {
    try {
      return await apiGet<string[]>(`/api/suggestions/indirizzo?q=${encodeURIComponent(query)}&limit=10`)
    } catch (error) {
      console.error('Errore caricamento suggerimenti indirizzo:', error)
      return []
    }
  }

  // Funzione per caricare dati correlati
  const loadCorrelatedData = async (field: string, value: string) => {
    try {
      const correlations = await apiGet<any>(`/api/suggestions/correlations?field=${field}&value=${encodeURIComponent(value)}`)
      
      // Aggiorna i campi correlati solo se sono vuoti
      setFormData(prev => {
        const updates: Partial<CreateIngressoDTO> = {}
        
        if (!prev.email && correlations.email) {
          updates.email = correlations.email
        }
        if (!prev.ragione_sociale && correlations.ragione_sociale) {
          updates.ragione_sociale = correlations.ragione_sociale
        }
        if (!prev.targa && correlations.targa) {
          updates.targa = correlations.targa
        }
        if (!prev.partita_iva && correlations.partita_iva) {
          updates.partita_iva = correlations.partita_iva
        }
        if (!prev.indirizzo && correlations.indirizzo) {
          updates.indirizzo = correlations.indirizzo
        }
        
        return { ...prev, ...updates }
      })
    } catch (error) {
      console.error('Errore caricamento dati correlati:', error)
    }
  }

  // Funzione per aggiornare un campo
  const updateField = (name: keyof CreateIngressoDTO, value: any) => {
    console.log(`🔄 Updating field "${name}" with value:`, value)
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      }
      console.log(`📊 Updated formData:`, updated)
      return updated
    })
  }

  // Funzione per validare tutto il form e mostrare errori
  const validateAllAndShowErrors = () => {
    console.log('🔍 Validating form data:', formData)
    
    const result = validateCreateIngresso(formData)
    console.log('📝 Validation result:', result)
    
    if (!result.success) {
      console.log('❌ Validation failed, errors:', result.error.issues)
      
      // Crea un oggetto con tutti gli errori
      const errors: Record<string, FieldError> = {}
      
      result.error.issues.forEach(issue => {
        const fieldName = issue.path[0] as string
        console.log(`🚫 Field error - ${fieldName}: ${issue.message}`)
        errors[fieldName] = {
          message: issue.message,
          isValid: false
        }
      })
      
      setFieldErrors(errors)
      return false
    }
    
    console.log('✅ Validation passed')
    // Se tutto è valido, pulisci eventuali errori
    setFieldErrors({})
    return true
  }

  // Reset del form
  const resetForm = () => {
    setFormData(initialData)
    setFieldErrors({})
  }

  // Check if should show error (sempre mostra se presente)
  const shouldShowError = (fieldName: string) => {
    const serverError = fieldErrors[fieldName]
    return serverError && !serverError.isValid
  }

  // Get error message
  const getErrorMessage = (fieldName: string) => {
    const serverError = fieldErrors[fieldName]
    return serverError && !serverError.isValid ? serverError.message : ''
  }

  // Calcola se il form è valido (solo per riferimento, non blocca l'UI)
  const isFormValid = () => {
    const result = validateCreateIngresso(formData)
    return result.success
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    console.log(`📝 Input change - ${name}: "${value}"`)
    
    let processedValue: string | number = value
    
    if (name === 'importo') {
      // Converte la stringa selezionata in numero
      const numValue = parseFloat(value) || 0
      console.log(`💰 Importo selected: "${value}" -> ${numValue}`)
      updateField('importo' as keyof CreateIngressoDTO, numValue)
    } else {
      // Per gli altri campi, aggiorna sempre il valore nel form
      console.log(`📄 Field "${name}" updated with: "${processedValue}"`)
      updateField(name as keyof CreateIngressoDTO, processedValue)
    }

    // Rimuovi eventuali errori del campo quando l'utente inizia a digitare
    if (fieldErrors[name] && !fieldErrors[name].isValid) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: { message: '', isValid: true }
      }))
    }
  }

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Per tutti i campi, assicurati che il valore sia aggiornato
    updateField(name as keyof CreateIngressoDTO, value)
    
    // Non fare validazione al blur - solo al submit
  }

  const handleClear = () => {
    resetForm()
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Valida tutto il form e mostra gli errori
    if (!validateAllAndShowErrors()) {
      // Se ci sono errori, non continuare con il submit
      setError('Correggi gli errori evidenziati nei campi prima di salvare.')
      // Porta la pagina in cima per mostrare l'errore
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
      return
    }
    
    setLoading(true)
    setError(null)

    // Porta la pagina in cima durante il caricamento
    window.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      await apiPost('/api/ingressi', formData)

      setShowSuccessToast(true)
      handleClear()
      onSuccess?.()
      // Assicurati che rimanga in cima dopo il successo
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore imprevisto'
      setError(errorMessage)
      onError?.(errorMessage)
      // Porta in cima per mostrare l'errore
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="d-flex align-items-center bg-primary text-white">
          <FontAwesomeIcon icon={faSave} className="me-2" />
          <strong>Crea Nuovo Ingresso</strong>
        </Card.Header>
        <Card.Body className="p-3 p-md-4">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)} className="fw-bold text-white bg-danger border-danger">
              {error}
            </Alert>  
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col xs={12} lg={6}>
                <AutocompleteInput
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  onSelect={(value) => loadCorrelatedData('email', value)}
                  placeholder="Inserisci email"
                  size="lg"
                  required
                  disabled={loading}
                  isInvalid={shouldShowError('email')}
                  helpText={shouldShowError('email') ? getErrorMessage('email') : "Suggerimenti disponibili durante la digitazione"}
                  fetchSuggestions={fetchEmailSuggestions}
                  minQueryLength={2}
                  maxSuggestions={8}
                />
              </Col>
              <Col xs={12} lg={6}>
                <AutocompleteInput
                  label="Ragione Sociale"
                  name="ragione_sociale"
                  value={formData.ragione_sociale}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  onSelect={(value) => loadCorrelatedData('ragione_sociale', value)}
                  placeholder="Inserisci ragione sociale"
                  size="lg"
                  required
                  disabled={loading}
                  isInvalid={shouldShowError('ragione_sociale')}
                  helpText={shouldShowError('ragione_sociale') ? getErrorMessage('ragione_sociale') : "Suggerimenti disponibili durante la digitazione"}
                  fetchSuggestions={fetchRagioneSocialeSuggestions}
                  minQueryLength={2}
                  maxSuggestions={8}
                />
              </Col>
            </Row>

            <Row>
              <Col xs={12} lg={6}>
                <AutocompleteInput
                  label="Targa"
                  name="targa"
                  value={formData.targa}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  onSelect={(value) => loadCorrelatedData('targa', value)}
                  placeholder="Inserisci targa (es. AB123CD)"
                  size="lg"
                  required
                  disabled={loading}
                  isInvalid={shouldShowError('targa')}
                  helpText={shouldShowError('targa') ? getErrorMessage('targa') : "La targa verrà automaticamente convertita in maiuscolo"}
                  style={{ textTransform: 'uppercase' }}
                  fetchSuggestions={fetchTargaSuggestions}
                  formatValue={(value) => {
                    const formatted = value.toUpperCase().replace(/\s/g, '')
                    console.log(`🔄 Formatting targa: "${value}" -> "${formatted}"`)
                    return formatted
                  }}
                  minQueryLength={1}
                  maxSuggestions={10}
                />
              </Col>
              <Col xs={12} lg={6}>
                <AutocompleteInput
                  label="Partita IVA"
                  name="partita_iva"
                  value={formData.partita_iva || ''}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  onSelect={(value) => loadCorrelatedData('partita_iva', value)}
                  placeholder="Inserisci partita IVA (11 cifre)"
                  size="lg"
                  required
                  disabled={loading}
                  maxLength={11}
                  isInvalid={shouldShowError('partita_iva')}
                  helpText={shouldShowError('partita_iva') ? getErrorMessage('partita_iva') : "Solo numeri, 11 cifre"}
                  fetchSuggestions={fetchPartitaIvaSuggestions}
                  formatValue={(value) => value.replace(/\D/g, '')}
                  minQueryLength={3}
                  maxSuggestions={8}
                />
              </Col>
            </Row>

            <Row>
              <Col xs={12}>
                <AutocompleteInput
                  label="Indirizzo"
                  name="indirizzo"
                  value={formData.indirizzo || ''}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  onSelect={(value) => loadCorrelatedData('indirizzo', value)}
                  placeholder="Inserisci indirizzo completo"
                  size="lg"
                  required
                  disabled={loading}
                  maxLength={500}
                  isInvalid={shouldShowError('indirizzo')}
                  helpText={shouldShowError('indirizzo') ? getErrorMessage('indirizzo') : "Suggerimenti disponibili durante la digitazione. Max 500 caratteri"}
                  fetchSuggestions={fetchIndirizzoSuggestions}
                  minQueryLength={3}
                  maxSuggestions={8}
                />
              </Col>
            </Row>

            <Row>
              <Col xs={12} lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Importo (€) *</Form.Label>
                  <Form.Select
                    name="importo"
                    value={formData.importo.toString()}
                    onChange={handleInputChange}
                    size="lg"
                    required
                    disabled={loading}
                    isInvalid={shouldShowError('importo')}
                    className={shouldShowError('importo') ? 'border-danger' : ''}
                  >
                    <option value="0">Seleziona importo</option>
                    <option value="15">15 euro</option>
                    <option value="25">25 euro</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {getErrorMessage('importo')}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Seleziona l'importo da applicare
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="d-flex align-items-center justify-content-center"
              >
                <FontAwesomeIcon icon={faSave} className="me-2" />
                {loading ? 'Salvando...' : 'Salva'}
              </Button>
              
              <Button
                type="button"
                variant="outline-secondary"
                size="lg"
                onClick={handleClear}
                disabled={loading}
                className="d-flex align-items-center justify-content-center"
              >
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Cancella
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Toast per successo */}
      <ToastContainer 
        position="top-end" 
        className="p-3"
        style={{ zIndex: 1050 }}
      >
        <Toast 
          show={showSuccessToast} 
          onClose={() => setShowSuccessToast(false)}
          delay={4000}
          autohide
          bg="success"
          className="text-white fw-bold"
        >
          <Toast.Header closeButton={false} className="bg-success text-white fw-bold border-0">
            <FontAwesomeIcon icon={faCheck} className="me-2" />
            <strong className="me-auto">Successo!</strong>
          </Toast.Header>
          <Toast.Body className="fw-bold">
            Ingresso creato con successo!
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  )
}
