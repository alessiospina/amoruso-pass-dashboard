'use client'

import React, { useState } from 'react'
import { Card, Row, Col, Form, Button, Alert, Toast, ToastContainer } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faTrash, faCheck } from '@fortawesome/free-solid-svg-icons'
import { validateCreateIngresso } from '@/validation/ingresso.validation'
import { CreateIngressoDTO } from '@/dto/ingresso.dto'
import AutocompleteInput from '@/components/UI/AutocompleteInput'

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
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [importoDisplayValue, setImportoDisplayValue] = useState<string>('')

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
      const response = await fetch(`/api/suggestions/email?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Errore caricamento suggerimenti email:', error)
    }
    return []
  }

  const fetchRagioneSocialeSuggestions = async (query: string): Promise<string[]> => {
    try {
      const response = await fetch(`/api/suggestions/ragione-sociale?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Errore caricamento suggerimenti ragione sociale:', error)
    }
    return []
  }

  const fetchTargaSuggestions = async (query: string): Promise<string[]> => {
    try {
      const response = await fetch(`/api/suggestions/targa?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Errore caricamento suggerimenti targa:', error)
    }
    return []
  }

  const fetchPartitaIvaSuggestions = async (query: string): Promise<string[]> => {
    try {
      const response = await fetch(`/api/suggestions/partita-iva?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Errore caricamento suggerimenti partita IVA:', error)
    }
    return []
  }

  const fetchIndirizzoSuggestions = async (query: string): Promise<string[]> => {
    try {
      const response = await fetch(`/api/suggestions/indirizzo?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Errore caricamento suggerimenti indirizzo:', error)
    }
    return []
  }

  // Funzione per caricare dati correlati
  const loadCorrelatedData = async (field: string, value: string) => {
    try {
      const response = await fetch(`/api/suggestions/correlations?field=${field}&value=${encodeURIComponent(value)}`)
      if (response.ok) {
        const correlations = await response.json()
        
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
      }
    } catch (error) {
      console.error('Errore caricamento dati correlati:', error)
    }
  }

  // Funzione per aggiornare un campo
  const updateField = (name: keyof CreateIngressoDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Funzione per validare un campo specifico
  const validateField = (name: keyof CreateIngressoDTO) => {
    const result = validateCreateIngresso(formData)
    if (!result.success) {
      const fieldError = result.error.issues.find(issue => 
        issue.path.includes(name as string)
      )
      
      if (fieldError) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: { message: fieldError.message, isValid: false }
        }))
        return false
      }
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [name]: { message: '', isValid: true }
    }))
    return true
  }

  // Funzione per validare tutto il form
  const validateAll = () => {
    const result = validateCreateIngresso(formData)
    return result.success
  }

  // Reset del form
  const resetForm = () => {
    setFormData(initialData)
    setFieldErrors({})
    setTouchedFields(new Set())
  }

  // Mark field as touched
  const markFieldTouched = (name: keyof CreateIngressoDTO) => {
    setTouchedFields(prev => new Set([...Array.from(prev), name as string]))
  }

  // Check if should show error
  const shouldShowError = (fieldName: string) => {
    const serverError = fieldErrors[fieldName]
    return touchedFields.has(fieldName) && serverError && !serverError.isValid
  }

  // Get error message
  const getErrorMessage = (fieldName: string) => {
    const serverError = fieldErrors[fieldName]
    return serverError && !serverError.isValid ? serverError.message : ''
  }

  // Calcola se il form è valido
  const isFormValid = () => {
    const result = validateCreateIngresso(formData)
    return result.success
  }

  // Funzione per formattare il prezzo
  const formatPrice = (value: string): number => {
    // Sostituisce la virgola con il punto
    const normalizedValue = value.replace(',', '.')
    // Rimuove tutti i caratteri non numerici eccetto il punto
    const cleanValue = normalizedValue.replace(/[^\d.]/g, '')
    // Converte a numero
    const numValue = parseFloat(cleanValue)
    
    if (isNaN(numValue)) return 0
    return Math.round(numValue * 100) / 100
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let processedValue: string | number = value
    
    if (name === 'importo') {
      // Salva il valore grezzo per il display
      setImportoDisplayValue(value)
      // Aggiorna formData con il valore numerico grezzo per la validazione
      const numValue = parseFloat(value.replace(',', '.')) || 0
      updateField('importo' as keyof CreateIngressoDTO, numValue)
    } else {
      // Per gli altri campi, il valore è già processato dal componente AutocompleteInput
      updateField(name as keyof CreateIngressoDTO, processedValue)
    }

    // Se il campo è già stato toccato, valida in tempo reale
    if (touchedFields.has(name)) {
      // Usa setTimeout per permettere al state di aggiornarsi
      setTimeout(() => {
        validateField(name as keyof CreateIngressoDTO)
      }, 0)
    }
  }

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Formatta il prezzo solo quando il campo perde il focus
    if (name === 'importo') {
      const formattedPrice = formatPrice(value)
      updateField('importo' as keyof CreateIngressoDTO, formattedPrice)
      // Aggiorna anche il valore di display con il formato corretto
      setImportoDisplayValue(formattedPrice === 0 ? '' : formattedPrice.toFixed(2))
    }
    
    setTouchedFields(prev => new Set(prev).add(name))
    markFieldTouched(name as keyof CreateIngressoDTO)
    
    // Valida il campo dopo un breve delay per assicurarci che lo state sia aggiornato
    setTimeout(() => {
      validateField(name as keyof CreateIngressoDTO)
    }, 50)
  }

  const handleClear = () => {
    resetForm()
    setError(null)
    setFieldErrors({})
    setTouchedFields(new Set())
    setImportoDisplayValue('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateAll()) {
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ingressi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Gestisce tutti gli errori 4xx che potrebbero contenere dettagli di validazione
        if (response.status >= 400 && response.status < 500 && errorData.details) {
          const serverErrors: Record<string, FieldError> = {}
          
          // Gestisce il formato degli errori Zod formattati con .format() (status 400)
          if (typeof errorData.details === 'object' && !Array.isArray(errorData.details)) {
            Object.entries(errorData.details).forEach(([field, fieldData]: [string, any]) => {
              // Gli errori Zod formattati hanno la struttura { _errors: ["messaggio"] }
              if (fieldData && fieldData._errors && Array.isArray(fieldData._errors) && fieldData._errors.length > 0) {
                serverErrors[field] = {
                  message: fieldData._errors[0],
                  isValid: false
                }
              }
            })
          }
          // Gestisce gli errori di business rules (status 422) che sono un array di stringhe
          else if (Array.isArray(errorData.details)) {
            // Per ora mostriamo tutti gli errori di business come errore generale
            // In futuro si potrebbe mappare gli errori specifici ai campi
            const businessErrorMessage = errorData.details.join(', ')
            throw new Error(businessErrorMessage)
          }
          
          if (Object.keys(serverErrors).length > 0) {
            setFieldErrors(serverErrors)
            // Marca tutti i campi con errori come toccati per mostrarli
            setTouchedFields(prev => new Set([...Array.from(prev), ...Object.keys(serverErrors)]))
            return
          }
        }
        
        throw new Error(errorData.error || 'Errore durante la creazione')
      }

      setShowSuccessToast(true)
      handleClear()
      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore imprevisto'
      setError(errorMessage)
      onError?.(errorMessage)
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
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
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
                  helpText={shouldShowError('email') ? getErrorMessage('email') : undefined}
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
                  helpText={shouldShowError('ragione_sociale') ? getErrorMessage('ragione_sociale') : undefined}
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
                  formatValue={(value) => value.toUpperCase().replace(/\s/g, '')}
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
                  helpText={shouldShowError('indirizzo') ? getErrorMessage('indirizzo') : "Massimo 500 caratteri"}
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
                  <Form.Control
                    type="text"
                    name="importo"
                    value={importoDisplayValue}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    placeholder="0.00"
                    size="lg"
                    required
                    disabled={loading}
                    isInvalid={shouldShowError('importo')}
                    className={shouldShowError('importo') ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {getErrorMessage('importo')}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Inserisci l'importo con decimali (es. 10.50)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !isFormValid()}
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
        >
          <Toast.Header closeButton={false}>
            <FontAwesomeIcon icon={faCheck} className="me-2" />
            <strong className="me-auto">Successo!</strong>
          </Toast.Header>
          <Toast.Body>
            Ingresso creato con successo!
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  )
}
