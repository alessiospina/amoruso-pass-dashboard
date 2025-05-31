'use client'

import React, { useState, useEffect } from 'react'
import { 
  Container, Row, Col, Card, Button, Alert, Form, Modal, Badge, 
  Toast, ToastContainer, Table, Spinner, Nav
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope, faSave, faTrash, faCheck, faTimes, faPlus, faEdit, 
  faToggleOn, faToggleOff, faPaperPlane, faExclamationTriangle,
  faServer, faSync
} from '@fortawesome/free-solid-svg-icons'

interface EmailChip {
  email: string
  isValid: boolean
}

interface EmailTemplate {
  id: string
  name: string
  recipients: string
  subject: string
  body: string
  isActive: boolean
  created_at: string
  updated_at: string
}

interface EmailVerification {
  success: boolean
  message: string
  timestamp: string
}

export default function EmailManagementPage() {
  // ==================== STATE MANAGEMENT ====================
  
  // Templates Management
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Configuration & Testing
  const [emailStatus, setEmailStatus] = useState<EmailVerification | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  
  // Form Management
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Form Data
  const [name, setName] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [emailChips, setEmailChips] = useState<EmailChip[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isActive, setIsActive] = useState(true)
  
  // Test Email
  const [testEmail, setTestEmail] = useState('')
  
  // Validation
  const [nameError, setNameError] = useState('')
  const [emailsError, setEmailsError] = useState('')
  const [subjectError, setSubjectError] = useState('')
  const [bodyError, setBodyError] = useState('')

  // ==================== EFFECTS ====================

  useEffect(() => {
    fetchTemplates()
    checkEmailConfiguration()
  }, [])

  // ==================== API CALLS ====================

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/emails?page=1&limit=100')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nel caricamento dei template')
      }

      const data = await response.json()
      setTemplates(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }

  const checkEmailConfiguration = async () => {
    try {
      setConfigLoading(true)
      const response = await fetch('/api/email-test')
      const data = await response.json()
      setEmailStatus(data)
    } catch (error) {
      console.error('Errore nella verifica email:', error)
      setEmailStatus({
        success: false,
        message: 'Errore nella verifica della configurazione email',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setConfigLoading(false)
    }
  }

  // ==================== EMAIL VALIDATION ====================

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase()
    
    if (!trimmedEmail) return
    
    if (emailChips.some(e => e.email === trimmedEmail)) {
      setEmailsError('Email già presente')
      return
    }
    
    const isValid = isValidEmail(trimmedEmail)
    setEmailChips(prev => [...prev, { email: trimmedEmail, isValid }])
    setEmailInput('')
    setEmailsError('')
  }

  const removeEmail = (emailToRemove: string) => {
    setEmailChips(prev => prev.filter(e => e.email !== emailToRemove))
  }

  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      addEmail(emailInput)
    } else if (e.key === 'Backspace' && emailInput === '' && emailChips.length > 0) {
      const lastEmail = emailChips[emailChips.length - 1]
      removeEmail(lastEmail.email)
    }
  }

  const handleEmailInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const emailsFromPaste = pastedText.split(/[,;\s]+/).filter(email => email.trim())
    
    emailsFromPaste.forEach(email => addEmail(email))
  }

  // ==================== FORM VALIDATION ====================

  const validateForm = (): boolean => {
    let isValid = true
    
    if (!name.trim()) {
      setNameError('Nome template è obbligatorio')
      isValid = false
    } else if (name.length > 100) {
      setNameError('Nome template troppo lungo')
      isValid = false
    } else {
      setNameError('')
    }
    
    if (emailChips.length === 0) {
      setEmailsError('Almeno un destinatario è obbligatorio')
      isValid = false
    } else if (emailChips.some(e => !e.isValid)) {
      setEmailsError('Alcune email non sono valide')
      isValid = false
    } else {
      setEmailsError('')
    }
    
    if (!subject.trim()) {
      setSubjectError('Oggetto è obbligatorio')
      isValid = false
    } else if (subject.length > 255) {
      setSubjectError('Oggetto troppo lungo')
      isValid = false
    } else {
      setSubjectError('')
    }
    
    if (!body.trim()) {
      setBodyError('Corpo email è obbligatorio')
      isValid = false
    } else if (body.length > 10000) {
      setBodyError('Corpo email troppo lungo')
      isValid = false
    } else {
      setBodyError('')
    }
    
    return isValid
  }

  // ==================== FORM MANAGEMENT ====================

  const resetForm = () => {
    setName('')
    setEmailInput('')
    setEmailChips([])
    setSubject('')
    setBody('')
    setIsActive(true)
    setNameError('')
    setEmailsError('')
    setSubjectError('')
    setBodyError('')
    setFormError(null)
  }

  const handleCreate = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setName(template.name)
    setEmailChips(
      parseRecipients(template.recipients).map(email => ({
        email,
        isValid: isValidEmail(email)
      }))
    )
    setSubject(template.subject)
    setBody(template.body)
    setIsActive(template.isActive)
    setFormError(null)
    setShowEditModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setFormLoading(true)
    setFormError(null)

    try {
      const emailData = {
        name: name.trim(),
        recipients: emailChips.filter(e => e.isValid).map(e => e.email),
        subject: subject.trim(),
        body: body.trim(),
        isActive,
      }

      const url = editingTemplate ? `/api/emails/${editingTemplate.id}` : '/api/emails'
      const method = editingTemplate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante il salvataggio')
      }

      setSuccessMessage(`Template ${editingTemplate ? 'modificato' : 'creato'} con successo!`)
      setShowSuccessToast(true)
      setShowCreateModal(false)
      setShowEditModal(false)
      setEditingTemplate(null)
      fetchTemplates()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo template?')) return

    try {
      setDeletingId(id)
      
      const response = await fetch(`/api/emails/${id}`, { method: 'DELETE' })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante l\'eliminazione')
      }

      setSuccessMessage('Template eliminato con successo!')
      setShowSuccessToast(true)
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'eliminazione')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/emails/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante l\'aggiornamento')
      }

      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'aggiornamento')
    }
  }

  // ==================== TEST EMAIL ====================

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('Inserisci un indirizzo email')
      return
    }

    // Validazione email semplice
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      alert('Inserisci un indirizzo email valido')
      return
    }

    try {
      setFormLoading(true)
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccessMessage('Email di test inviata con successo!')
        setShowSuccessToast(true)
        setShowTestModal(false)
        setTestEmail('')
      } else {
        alert(`Errore nell'invio: ${data.message}`)
      }
    } catch (error) {
      console.error('Errore nell\'invio email di test:', error)
      alert('Errore nell\'invio email di test')
    } finally {
      setFormLoading(false)
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  const parseRecipients = (recipients: string): string[] => {
    return recipients.split(',').map(email => email.trim()).filter(email => email.length > 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ==================== MAIN RENDER ====================

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1>
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                Gestione Email
              </h1>
              <p className="text-muted">
                Configura template email e testa l'invio automatico per i nuovi ingressi
              </p>
            </div>
            
            {emailStatus && (
              <Badge 
                bg={emailStatus.success ? 'success' : 'danger'} 
                className="fs-6 px-3 py-2"
              >
                <FontAwesomeIcon 
                  icon={emailStatus.success ? faCheck : faTimes} 
                  className="me-1" 
                />
                {emailStatus.success ? 'Sistema Attivo' : 'Sistema Inattivo'}
              </Badge>
            )}
          </div>
        </Col>
      </Row>

      {/* Stato Configurazione Email */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <FontAwesomeIcon icon={faServer} className="me-2" />
              <strong>Stato Configurazione Email</strong>
            </Card.Header>
            <Card.Body>
              {configLoading && (
                <div className="d-flex align-items-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span>Verifica in corso...</span>
                </div>
              )}
              
              {emailStatus && !configLoading && (
                <Alert variant={emailStatus.success ? 'success' : 'danger'}>
                  <FontAwesomeIcon 
                    icon={emailStatus.success ? faCheck : faTimes} 
                    className="me-2" 
                  />
                  {emailStatus.message}
                  <div className="mt-2 small text-muted">
                    Ultima verifica: {new Date(emailStatus.timestamp).toLocaleString('it-IT')}
                  </div>
                </Alert>
              )}

              <div className="d-flex gap-2">
                <Button 
                  variant="outline-primary" 
                  onClick={checkEmailConfiguration}
                  disabled={configLoading}
                >
                  <FontAwesomeIcon icon={faSync} className="me-1" />
                  Verifica Configurazione
                </Button>
                
                <Button 
                  variant="outline-success" 
                  onClick={() => setShowTestModal(true)}
                  disabled={configLoading || !emailStatus?.success}
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="me-1" />
                  Test Email
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Template Email */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex align-items-center justify-content-between bg-success text-white">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                <strong>Template Email</strong>
              </div>
              <Button 
                variant="light" 
                size="sm"
                onClick={handleCreate}
                className="d-flex align-items-center"
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Crea Template
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {error && (
                <Alert variant="danger" className="m-3 mb-0">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                  {error}
                </Alert>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <div className="mt-2">Caricamento template...</div>
                </div>
              ) : (
                <>
                  {templates.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <FontAwesomeIcon icon={faEnvelope} size="3x" className="mb-3 opacity-25" />
                      <h5>Nessun template configurato</h5>
                      <p>Inizia creando il tuo primo template email.</p>
                      <Button variant="success" onClick={handleCreate}>
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Crea Template
                      </Button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table striped hover className="mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>Nome</th>
                            <th>Oggetto</th>
                            <th>Destinatari</th>
                            <th>Stato</th>
                            <th>Data Creazione</th>
                            <th style={{ width: '150px' }}>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {templates.map((template) => (
                            <tr key={template.id}>
                              <td className="fw-bold">{template.name}</td>
                              <td>{template.subject}</td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {parseRecipients(template.recipients).slice(0, 2).map((recipient, index) => (
                                    <Badge key={index} bg="secondary" className="small">
                                      {recipient}
                                    </Badge>
                                  ))}
                                  {parseRecipients(template.recipients).length > 2 && (
                                    <Badge bg="info" className="small">
                                      +{parseRecipients(template.recipients).length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0"
                                  onClick={() => handleToggleActive(template)}
                                >
                                  <FontAwesomeIcon 
                                    icon={template.isActive ? faToggleOn : faToggleOff}
                                    className={template.isActive ? 'text-success' : 'text-muted'}
                                    size="lg"
                                  />
                                </Button>
                              </td>
                              <td className="text-muted small">
                                {formatDate(template.created_at)}
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleEdit(template)}
                                    title="Modifica template"
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    disabled={deletingId === template.id}
                                    onClick={() => handleDelete(template.id)}
                                    title="Elimina template"
                                  >
                                    {deletingId === template.id ? (
                                      <Spinner as="span" animation="border" size="sm" />
                                    ) : (
                                      <FontAwesomeIcon icon={faTrash} />
                                    )}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Creazione/Modifica */}
      <Modal 
        show={showCreateModal || showEditModal} 
        onHide={() => {
          setShowCreateModal(false)
          setShowEditModal(false)
          setEditingTemplate(null)
        }} 
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faEnvelope} className="me-2" />
            {editingTemplate ? 'Modifica Template Email' : 'Crea Template Email'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {formError && (
              <Alert variant="danger">
                {formError}
              </Alert>
            )}

            {/* Nome Template */}
            <Form.Group className="mb-3">
              <Form.Label>Nome Template *</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Inserisci nome per il template email"
                required
                disabled={formLoading}
                isInvalid={!!nameError}
              />
              <Form.Control.Feedback type="invalid">
                {nameError}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Email Recipients */}
            <Form.Group className="mb-3">
              <Form.Label>Destinatari Email *</Form.Label>
              <div className="border rounded p-2" style={{ minHeight: '50px' }}>
                {/* Email chips */}
                <div className="d-flex flex-wrap gap-1 mb-2">
                  {emailChips.map((emailChip, index) => (
                    <Badge 
                      key={index}
                      bg={emailChip.isValid ? 'primary' : 'danger'}
                      className="d-flex align-items-center gap-1 py-1 px-2"
                      style={{ fontSize: '0.85rem' }}
                    >
                      {emailChip.email}
                      <FontAwesomeIcon 
                        icon={faTimes} 
                        className="ms-1" 
                        onClick={() => removeEmail(emailChip.email)}
                        style={{ cursor: 'pointer' }}
                      />
                    </Badge>
                  ))}
                </div>
                
                {/* Input per nuove email */}
                <Form.Control
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailInputKeyDown}
                  onPaste={handleEmailInputPaste}
                  onBlur={() => emailInput && addEmail(emailInput)}
                  placeholder="Digita email e premi Invio, virgola o spazio per aggiungere"
                  disabled={formLoading}
                  className="border-0 bg-transparent"
                  style={{ outline: 'none', boxShadow: 'none' }}
                />
              </div>
              {emailsError && (
                <div className="text-danger small mt-1">{emailsError}</div>
              )}
              <Form.Text className="text-muted">
                Queste email riceveranno l'email quando viene creato un nuovo ingresso. 
                L'email dell'ingresso sarà automaticamente messa in CC.
              </Form.Text>
            </Form.Group>

            {/* Oggetto Email */}
            <Form.Group className="mb-3">
              <Form.Label>Oggetto Email *</Form.Label>
              <Form.Control
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Inserisci oggetto dell'email"
                required
                disabled={formLoading}
                isInvalid={!!subjectError}
              />
              <Form.Control.Feedback type="invalid">
                {subjectError}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Corpo Email */}
            <Form.Group className="mb-3">
              <Form.Label>Corpo Email *</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Scrivi qui il contenuto dell'email..."
                required
                disabled={formLoading}
                isInvalid={!!bodyError}
                style={{ resize: 'vertical' }}
              />
              <Form.Control.Feedback type="invalid">
                {bodyError}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Puoi utilizzare placeholder: {'{'}email{'}'}, {'{'}ragione_sociale{'}'}, {'{'}targa{'}'}, 
                {'{'}partita_iva{'}'}, {'{'}indirizzo{'}'}, {'{'}importo{'}'}, {'{'}created_at{'}'}, {'{'}id{'}'}.
              </Form.Text>
            </Form.Group>

            {/* Stato Attivo */}
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="isActive"
                label="Template attivo"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={formLoading}
              />
              <Form.Text className="text-muted">
                Solo i template attivi verranno utilizzati per l'invio automatico.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowCreateModal(false)
                setShowEditModal(false)
                setEditingTemplate(null)
              }}
              disabled={formLoading}
            >
              Annulla
            </Button>
            <Button 
              variant="success" 
              type="submit"
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="me-2" />
                  {editingTemplate ? 'Salva Modifiche' : 'Crea Template'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Test Email */}
      <Modal show={showTestModal} onHide={() => setShowTestModal(false)} size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Test Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Indirizzo Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="esempio@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Form.Text className="text-muted">
                Verrà inviata una email di test a questo indirizzo
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTestModal(false)}>
            Annulla
          </Button>
          <Button 
            variant="primary" 
            onClick={handleTestEmail}
            disabled={formLoading || !testEmail}
          >
            {formLoading ? 'Invio...' : 'Invia Test'}
          </Button>
        </Modal.Footer>
      </Modal>

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
            {successMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  )
}
