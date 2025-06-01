'use client'

import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Form, Button, Alert, Badge, Toast, ToastContainer, Table, Spinner, Modal } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faSave, faTrash, faCheck, faTimes, faPlus, faEdit, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons'
import { EmailService } from '@/services/email.service'

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

interface PaginatedResponse {
  data: EmailTemplate[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function ImpostaEmailPage() {
  // Lista emails
  const [emails, setEmails] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(10)
  
  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEmail, setEditingEmail] = useState<EmailTemplate | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Form data
  const [name, setName] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [emailChips, setEmailChips] = useState<EmailChip[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isActive, setIsActive] = useState(true)
  
  // Validation states
  const [nameError, setNameError] = useState('')
  const [emailsError, setEmailsError] = useState('')
  const [subjectError, setSubjectError] = useState('')
  const [bodyError, setBodyError] = useState('')

  // Fetch emails
  const fetchEmails = async (page: number = 1, pageLimit: number = 10) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/emails?page=${page}&limit=${pageLimit}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nel caricamento dei template')
      }

      const data: PaginatedResponse = await response.json()
      
      setEmails(data.data || [])
      setCurrentPage(data.page || 1)
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
      setLimit(data.limit || 10)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails(currentPage, limit)
  }, [currentPage, limit])

  // Validazione email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Aggiungi email alla lista
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

  // Rimuovi email dalla lista
  const removeEmail = (emailToRemove: string) => {
    setEmailChips(prev => prev.filter(e => e.email !== emailToRemove))
  }

  // Gestione input email
  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      addEmail(emailInput)
    } else if (e.key === 'Backspace' && emailInput === '' && emailChips.length > 0) {
      const lastEmail = emailChips[emailChips.length - 1]
      removeEmail(lastEmail.email)
    }
  }

  // Gestione paste
  const handleEmailInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const emailsFromPaste = pastedText.split(/[,;\s]+/).filter(email => email.trim())
    
    emailsFromPaste.forEach(email => addEmail(email))
  }

  // Validazione form
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

  // Reset form
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

  // Apri modal creazione
  const handleCreate = () => {
    resetForm()
    setShowCreateModal(true)
  }

  // Apri modal modifica
  const handleEdit = (email: EmailTemplate) => {
    setEditingEmail(email)
    setName(email.name)
    setEmailChips(
      EmailService.parseRecipients(email.recipients).map(email => ({
        email,
        isValid: isValidEmail(email)
      }))
    )
    setSubject(email.subject)
    setBody(email.body)
    setIsActive(email.isActive)
    setFormError(null)
    setShowEditModal(true)
  }

  // Gestione submit
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

      const url = editingEmail ? `/api/emails/${editingEmail.id}` : '/api/emails'
      const method = editingEmail ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante il salvataggio')
      }

      setShowSuccessToast(true)
      setShowCreateModal(false)
      setShowEditModal(false)
      setEditingEmail(null)
      fetchEmails(currentPage, limit)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setFormLoading(false)
    }
  }

  // Elimina template
  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo template?')) return

    try {
      setDeletingId(id)
      
      const response = await fetch(`/api/emails/${id}`, { method: 'DELETE' })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante l\'eliminazione')
      }

      fetchEmails(currentPage, limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'eliminazione')
    } finally {
      setDeletingId(null)
    }
  }

  // Toggle stato attivo
  const handleToggleActive = async (email: EmailTemplate) => {
    try {
      const response = await fetch(`/api/emails/${email.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !email.isActive }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante l\'aggiornamento')
      }

      fetchEmails(currentPage, limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'aggiornamento')
    }
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

  return (
    <div className="animated fadeIn">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1>
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                Imposta Email
              </h1>
              <p className="text-muted">
                Configura e gestisci i template email per le notifiche automatiche
              </p>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Card className="shadow-sm">
            <Card.Header className="d-flex align-items-center justify-content-between bg-success text-white">
              <div className="d-flex align-items-center">
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
                  {emails.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <FontAwesomeIcon icon={faEnvelope} size="3x" className="mb-3 opacity-25" />
                      <h5>Nessun template trovato</h5>
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
                          {emails.map((email) => (
                            <tr key={email.id}>
                              <td className="fw-bold">{email.name}</td>
                              <td>{email.subject}</td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {EmailService.parseRecipients(email.recipients).slice(0, 2).map((recipient, index) => (
                                    <Badge key={index} bg="secondary" className="small">
                                      {recipient}
                                    </Badge>
                                  ))}
                                  {EmailService.parseRecipients(email.recipients).length > 2 && (
                                    <Badge bg="info" className="small">
                                      +{EmailService.parseRecipients(email.recipients).length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0"
                                  onClick={() => handleToggleActive(email)}
                                >
                                  <FontAwesomeIcon 
                                    icon={email.isActive ? faToggleOn : faToggleOff}
                                    className={email.isActive ? 'text-success' : 'text-muted'}
                                    size="lg"
                                  />
                                </Button>
                              </td>
                              <td className="text-muted small">
                                {formatDate(email.created_at)}
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleEdit(email)}
                                    title="Modifica template"
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    disabled={deletingId === email.id}
                                    onClick={() => handleDelete(email.id)}
                                    title="Elimina template"
                                  >
                                    {deletingId === email.id ? (
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
          setEditingEmail(null)
        }} 
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faEnvelope} className="me-2" />
            {editingEmail ? 'Modifica Template Email' : 'Crea Template Email'}
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

            {/* Email Recipients con tema corretto */}
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
                
                {/* Input per nuove email con tema corretto */}
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
                Inserisci una o più email. Puoi separarle con Invio, virgola o spazio.
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
                Puoi utilizzare testo semplice o HTML. Massimo 10.000 caratteri.
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
                Solo i template attivi possono essere utilizzati per l'invio email.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowCreateModal(false)
                setShowEditModal(false)
                setEditingEmail(null)
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
                  {editingEmail ? 'Salva Modifiche' : 'Crea Template'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
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
            Template email {editingEmail ? 'modificato' : 'creato'} con successo!
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}
