'use client'

import React, { useState } from 'react'
import { Card, Row, Col, Form, Button, Alert, Toast, ToastContainer } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faTrash, faCheck } from '@fortawesome/free-solid-svg-icons'
import { validateCreateIngresso } from '@/validation/ingresso.validation'
import { CreateIngressoDTO } from '@/dto/ingresso.dto'

// Schema personalizzato per il nostro use case
const customSchema = {
  safeParse: validateCreateIngresso
}

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
    } else if (name === 'targa') {
      processedValue = value.toUpperCase().replace(/\s/g, '')
      updateField(name as keyof CreateIngressoDTO, processedValue)
    } else if (name === 'partita_iva') {
      // Solo numeri per la partita IVA
      processedValue = value.replace(/\D/g, '')
      updateField(name as keyof CreateIngressoDTO, processedValue)
    } else {
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
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    placeholder="Inserisci email"
                    size="lg"
                    required
                    disabled={loading}
                    isInvalid={shouldShowError('email')}
                    className={shouldShowError('email') ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {getErrorMessage('email')}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ragione Sociale *</Form.Label>
                  <Form.Control
                    type="text"
                    name="ragione_sociale"
                    value={formData.ragione_sociale}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    placeholder="Inserisci ragione sociale"
                    size="lg"
                    required
                    disabled={loading}
                    isInvalid={shouldShowError('ragione_sociale')}
                    className={shouldShowError('ragione_sociale') ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {getErrorMessage('ragione_sociale')}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col xs={12} lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Targa *</Form.Label>
                  <Form.Control
                    type="text"
                    name="targa"
                    value={formData.targa}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    placeholder="Inserisci targa (es. AB123CD)"
                    size="lg"
                    required
                    disabled={loading}
                    style={{ textTransform: 'uppercase' }}
                    isInvalid={shouldShowError('targa')}
                    className={shouldShowError('targa') ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {getErrorMessage('targa')}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    La targa verrà automaticamente convertita in maiuscolo
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col xs={12} lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Partita IVA *</Form.Label>
                  <Form.Control
                    type="text"
                    name="partita_iva"
                    value={formData.partita_iva || ''}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    placeholder="Inserisci partita IVA (11 cifre)"
                    size="lg"
                    required
                    disabled={loading}
                    maxLength={11}
                    isInvalid={shouldShowError('partita_iva')}
                    className={shouldShowError('partita_iva') ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {getErrorMessage('partita_iva')}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Solo numeri, 11 cifre
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Indirizzo *</Form.Label>
                  <Form.Control
                    type="text"
                    name="indirizzo"
                    value={formData.indirizzo || ''}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    placeholder="Inserisci indirizzo completo"
                    size="lg"
                    required
                    disabled={loading}
                    maxLength={500}
                    isInvalid={shouldShowError('indirizzo')}
                    className={shouldShowError('indirizzo') ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {getErrorMessage('indirizzo')}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Massimo 500 caratteri
                  </Form.Text>
                </Form.Group>
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
