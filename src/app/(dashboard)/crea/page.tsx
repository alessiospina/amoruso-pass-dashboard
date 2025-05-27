'use client'

import React, { useState } from 'react'
import { Card, Row, Col, Form, Button, Alert, Toast, ToastContainer } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faTrash, faCheck } from '@fortawesome/free-solid-svg-icons'
import { CreateIngressoDTO } from '@/dto/ingresso.dto'

export default function CreaIngressoPage() {
  const [formData, setFormData] = useState<CreateIngressoDTO>({
    email: '',
    ragione_sociale: '',
    targa: '',
    importo: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.email.trim()) {
      errors.email = 'Email è richiesta'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email non valida'
    }
    
    if (!formData.ragione_sociale.trim()) {
      errors.ragione_sociale = 'Ragione sociale è richiesta'
    }
    
    if (!formData.targa.trim()) {
      errors.targa = 'Targa è richiesta'
    } else if (formData.targa.length < 6) {
      errors.targa = 'Targa troppo corta'
    }
    
    if (formData.importo <= 0) {
      errors.importo = 'Importo deve essere maggiore di 0'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isFormValid = () => {
    return (
      formData.email.trim().length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      formData.ragione_sociale.trim().length > 0 &&
      formData.targa.trim().length >= 6 &&
      formData.importo > 0
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    let processedValue: string | number = value
    
    if (type === 'number') {
      processedValue = parseFloat(value) || 0
    } else if (name === 'targa') {
      // Converte automaticamente la targa in maiuscolo e rimuove spazi
      processedValue = value.toUpperCase().replace(/\s/g, '')
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }))
  }

  const handleClear = () => {
    setFormData({
      email: '',
      ragione_sociale: '',
      targa: '',
      importo: 0,
    })
    setError(null)
    setFieldErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
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
        throw new Error(errorData.error || 'Errore durante la creazione')
      }

      // Mostra toast di successo
      setShowSuccessToast(true)
      handleClear()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="animated fadeIn">
        <Row>
          <Col xs={12}>
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
                          placeholder="Inserisci email"
                          size="lg"
                          required
                          disabled={loading}
                          isInvalid={!!fieldErrors.email}
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.email}
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
                          placeholder="Inserisci ragione sociale"
                          size="lg"
                          required
                          disabled={loading}
                          isInvalid={!!fieldErrors.ragione_sociale}
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.ragione_sociale}
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
                          placeholder="Inserisci targa (es. AB123CD)"
                          size="lg"
                          required
                          disabled={loading}
                          style={{ textTransform: 'uppercase' }}
                          isInvalid={!!fieldErrors.targa}
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.targa}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          La targa verrà automaticamente convertita in maiuscolo
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col xs={12} lg={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Importo (€) *</Form.Label>
                        <Form.Control
                          type="number"
                          name="importo"
                          value={formData.importo}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          size="lg"
                          min="0"
                          step="0.01"
                          required
                          disabled={loading}
                          isInvalid={!!fieldErrors.importo}
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.importo}
                        </Form.Control.Feedback>
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
          </Col>
        </Row>
      </div>

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
          text="white"
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
