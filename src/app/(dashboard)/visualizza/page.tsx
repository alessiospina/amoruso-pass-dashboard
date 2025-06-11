'use client'

import React, { useState, useEffect } from 'react'
import { Card, Table, Row, Col, Spinner, Alert, Button, Form, Modal, Toast, ToastContainer } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faChevronLeft, faChevronRight, faTrash, faEdit, faCheck, faEnvelope, faFilePdf } from '@fortawesome/free-solid-svg-icons'
import { validateCreateIngresso } from '@/validation/ingresso.validation'
import IngressoPDFGenerator from '@/components/PDF/IngressoPDFGenerator'

interface Ingresso {
  id: string
  email: string
  ragione_sociale: string
  targa: string
  partita_iva: string
  indirizzo: string
  importo: number
  created_at: string
  updated_at: string
}

interface PaginatedResponse {
  data: Ingresso[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface FieldError {
  message: string
  isValid: boolean
}

export default function VisualizzaIngressiPage() {
  const [ingressi, setIngressi] = useState<Ingresso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(10)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingIngresso, setEditingIngresso] = useState<Ingresso | null>(null)
  const [editFormData, setEditFormData] = useState({
    email: '',
    ragione_sociale: '',
    targa: '',
    partita_iva: '',
    indirizzo: '',
    importo: 0
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, FieldError>>({})
  const [editTouchedFields, setEditTouchedFields] = useState<Set<string>>(new Set())
  const [editImportoDisplayValue, setEditImportoDisplayValue] = useState<string>('')
  const [showEditSuccessToast, setShowEditSuccessToast] = useState(false)
  
  // Nuovi stati per la modale di conferma email
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false)
  const [updatedIngressoForEmail, setUpdatedIngressoForEmail] = useState<Ingresso | null>(null)
  const [emailSending, setEmailSending] = useState(false)
  
  // Nuovi stati per la modale PDF
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selectedIngressoForPdf, setSelectedIngressoForPdf] = useState<Ingresso | null>(null)
  const [pdfGenerating, setPdfGenerating] = useState(false)

  const fetchIngressi = async (page: number = 1, pageLimit: number = 10) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/ingressi?page=${page}&limit=${pageLimit}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nel caricamento degli ingressi')
      }

      const data: PaginatedResponse = await response.json()
      
      setIngressi(data.data || [])
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
    fetchIngressi(currentPage, limit)
  }, [currentPage, limit])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setCurrentPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo ingresso?')) {
      return
    }

    try {
      setDeletingId(id)
      
      const response = await fetch(`/api/ingressi/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante l\'eliminazione')
      }

      setIngressi(prev => prev.filter(ingresso => ingresso.id !== id))
      setTotal(prev => prev - 1)
      
      if (ingressi.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1)
      } else if (ingressi.length === 1) {
        fetchIngressi(currentPage, limit)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'eliminazione')
    } finally {
      setDeletingId(null)
    }
  }

  // Funzioni di validazione per la modale
  const validateEditField = (name: string, value: any, allData: any) => {
    try {
      const dataToValidate = { ...allData, [name]: value }
      const result = validateCreateIngresso(dataToValidate)
      
      if (result.success) {
        return { message: '', isValid: true }
      } else {
        const fieldError = result.error.issues.find(issue => 
          issue.path.includes(name)
        )
        
        if (fieldError) {
          return { message: fieldError.message, isValid: false }
        } else {
          return { message: '', isValid: true }
        }
      }
    } catch (err) {
      return { message: 'Errore di validazione', isValid: false }
    }
  }

  const isEditFormValid = () => {
    const result = validateCreateIngresso(editFormData)
    return result.success
  }

  const shouldShowEditError = (fieldName: string) => {
    const fieldError = editFieldErrors[fieldName]
    return editTouchedFields.has(fieldName) && fieldError && !fieldError.isValid
  }

  const getEditErrorMessage = (fieldName: string) => {
    const fieldError = editFieldErrors[fieldName]
    return fieldError && !fieldError.isValid ? fieldError.message : ''
  }

  const formatEditPrice = (value: string): number => {
    const normalizedValue = value.replace(',', '.')
    const cleanValue = normalizedValue.replace(/[^\d.]/g, '')
    const numValue = parseFloat(cleanValue)
    
    if (isNaN(numValue)) return 0
    return Math.round(numValue * 100) / 100
  }

  const handleEdit = (ingresso: Ingresso) => {
    setEditingIngresso(ingresso)
    setEditFormData({
      email: ingresso.email,
      ragione_sociale: ingresso.ragione_sociale,
      targa: ingresso.targa,
      partita_iva: ingresso.partita_iva,
      indirizzo: ingresso.indirizzo,
      importo: ingresso.importo
    })
    setEditImportoDisplayValue(ingresso.importo === 0 ? '' : ingresso.importo.toFixed(2))
    setEditError(null)
    setEditFieldErrors({})
    setEditTouchedFields(new Set())
    setShowEditModal(true)
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'importo') {
      setEditImportoDisplayValue(value)
      const numValue = parseFloat(value.replace(',', '.')) || 0
      setEditFormData(prev => ({ ...prev, importo: numValue }))
    } else if (name === 'targa') {
      const processedValue = value.toUpperCase().replace(/\s/g, '')
      setEditFormData(prev => ({ ...prev, [name]: processedValue }))
    } else if (name === 'partita_iva') {
      // Solo numeri per la partita IVA
      const processedValue = value.replace(/\D/g, '')
      setEditFormData(prev => ({ ...prev, [name]: processedValue }))
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleEditFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'importo') {
      const formattedPrice = formatEditPrice(value)
      setEditFormData(prev => ({ ...prev, importo: formattedPrice }))
      setEditImportoDisplayValue(formattedPrice === 0 ? '' : formattedPrice.toFixed(2))
    }
    
    setEditTouchedFields(prev => new Set(prev).add(name))
    
    const fieldError = validateEditField(name, editFormData[name as keyof typeof editFormData], editFormData)
    setEditFieldErrors(prev => ({
      ...prev,
      [name]: fieldError
    }))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingIngresso || !isEditFormValid()) {
      const newErrors: Record<string, FieldError> = {}
      const result = validateCreateIngresso(editFormData)
      
      if (!result.success) {
        result.error.issues.forEach(issue => {
          const fieldName = issue.path[0] as string
          if (fieldName) {
            newErrors[fieldName] = {
              message: issue.message,
              isValid: false
            }
          }
        })
        setEditFieldErrors(newErrors)
        setEditTouchedFields(new Set(['email', 'ragione_sociale', 'targa', 'partita_iva', 'indirizzo', 'importo']))
      }
      return
    }
    
    setEditLoading(true)
    setEditError(null)

    try {
      const response = await fetch(`/api/ingressi/${editingIngresso.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        if (response.status >= 400 && response.status < 500 && errorData.details) {
          const serverErrors: Record<string, FieldError> = {}
          
          if (typeof errorData.details === 'object' && !Array.isArray(errorData.details)) {
            Object.entries(errorData.details).forEach(([field, fieldData]: [string, any]) => {
              if (fieldData && fieldData._errors && Array.isArray(fieldData._errors) && fieldData._errors.length > 0) {
                serverErrors[field] = {
                  message: fieldData._errors[0],
                  isValid: false
                }
              }
            })
          } else if (Array.isArray(errorData.details)) {
            const businessErrorMessage = errorData.details.join(', ')
            throw new Error(businessErrorMessage)
          }
          
          if (Object.keys(serverErrors).length > 0) {
            setEditFieldErrors(serverErrors)
            setEditTouchedFields(prev => new Set([...Array.from(prev), ...Object.keys(serverErrors)]))
            return
          }
        }
        
        throw new Error(errorData.error || 'Errore durante la modifica')
      }

      const updatedIngresso = await response.json()
      
      setIngressi(prev => prev.map(ing => 
        ing.id === editingIngresso.id ? updatedIngresso : ing
      ))
      
      setShowEditModal(false)
      setEditingIngresso(null)
      
      // Mostra modale di conferma per l'invio email
      setUpdatedIngressoForEmail(updatedIngresso)
      setShowEmailConfirmModal(true)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setEditLoading(false)
    }
  }

  const handleCloseEditModal = () => {
    if (!editLoading) {
      setShowEditModal(false)
      setEditingIngresso(null)
      setEditError(null)
      setEditFieldErrors({})
      setEditTouchedFields(new Set())
    }
  }

  // Funzioni per gestire l'email di aggiornamento
  const handleSendUpdateEmail = async () => {
    if (!updatedIngressoForEmail) return

    try {
      setEmailSending(true)

      const response = await fetch('/api/send-update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingressoId: updatedIngressoForEmail.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante l\'invio dell\'email')
      }

      setShowEditSuccessToast(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'invio email')
    } finally {
      setEmailSending(false)
      setShowEmailConfirmModal(false)
      setUpdatedIngressoForEmail(null)
    }
  }

  const handleSkipUpdateEmail = () => {
    setShowEmailConfirmModal(false)
    setUpdatedIngressoForEmail(null)
    setShowEditSuccessToast(true)
  }

  // Funzioni per gestire il PDF
  const handleShowPdf = (ingresso: Ingresso) => {
    setSelectedIngressoForPdf(ingresso)
    setShowPdfModal(true)
  }

  const handleClosePdfModal = () => {
    if (!pdfGenerating) {
      setShowPdfModal(false)
      setSelectedIngressoForPdf(null)
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

  const formatImporto = (importo: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(importo)
  }

  return (
    <div className="animated fadeIn">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1>
                <FontAwesomeIcon icon={faEye} className="me-2" />
                Visualizza Ingressi
              </h1>
              <p className="text-muted">
                Consulta, modifica ed elimina gli ingressi registrati nel sistema
              </p>
            </div>
            <div className="text-muted">
              Totale: {total} ingressi
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Card className="shadow-sm">
            <Card.Header className="d-flex align-items-center justify-content-between bg-primary text-white">
              <div className="d-flex align-items-center">
                <strong>Lista Ingressi</strong>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {error && (
                <Alert variant="danger" className="m-3 mb-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{error}</span>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => fetchIngressi(currentPage, limit)}
                    >
                      Riprova
                    </Button>
                  </div>
                </Alert>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <div className="mt-2">Caricamento ingressi...</div>
                </div>
              ) : (
                <>
                  {ingressi.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <FontAwesomeIcon icon={faEye} size="3x" className="mb-3 opacity-25" />
                      <h5>Nessun ingresso trovato</h5>
                      <p>Non ci sono ancora ingressi da visualizzare.</p>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <Table striped hover className="mb-0">
                          <thead className="table-dark">
                            <tr>
                              <th>Email</th>
                              <th>Ragione Sociale</th>
                              <th>Targa</th>
                              <th>P.IVA</th>
                              <th>Indirizzo</th>
                              <th>Importo</th>
                              <th>Data Creazione</th>
                              <th style={{ width: '150px' }}>Azioni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ingressi.map((ingresso) => (
                              <tr key={ingresso.id}>
                                <td>{ingresso.email}</td>
                                <td>{ingresso.ragione_sociale}</td>
                                <td>
                                  <span className="badge bg-secondary">
                                    {ingresso.targa}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge bg-info">
                                    {ingresso.partita_iva}
                                  </span>
                                </td>
                                <td>
                                  <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }} title={ingresso.indirizzo}>
                                    {ingresso.indirizzo}
                                  </span>
                                </td>
                                <td className="fw-bold text-success">
                                  {formatImporto(ingresso.importo)}
                                </td>
                                <td className="text-muted">
                                  {formatDate(ingresso.created_at)}
                                </td>
                                <td>
                                  <div className="d-flex gap-1">
                                    <Button
                                      variant="outline-success"
                                      size="sm"
                                      disabled={deletingId === ingresso.id}
                                      onClick={() => handleShowPdf(ingresso)}
                                      title="Genera PDF"
                                    >
                                      <FontAwesomeIcon icon={faFilePdf} />
                                    </Button>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      disabled={deletingId === ingresso.id}
                                      onClick={() => handleEdit(ingresso)}
                                      title="Modifica ingresso"
                                    >
                                      <FontAwesomeIcon icon={faEdit} />
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      disabled={deletingId === ingresso.id}
                                      onClick={() => handleDelete(ingresso.id)}
                                      title="Elimina ingresso"
                                    >
                                      {deletingId === ingresso.id ? (
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

                      {/* Paginazione */}
                      <div className="d-flex justify-content-between align-items-center p-3 border-top">
                        <div className="d-flex align-items-center">
                          <span className="me-2">Righe per pagina:</span>
                          <Form.Select
                            size="sm"
                            value={limit}
                            onChange={(e) => handleLimitChange(Number(e.target.value))}
                            style={{ width: 'auto' }}
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </Form.Select>
                        </div>

                        <div className="d-flex align-items-center">
                          <span className="me-3 text-muted">
                            Pagina {currentPage} di {totalPages} ({total} elementi)
                          </span>
                          
                          <div className="btn-group">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              disabled={currentPage === 1}
                              onClick={() => handlePageChange(currentPage - 1)}
                            >
                              <FontAwesomeIcon icon={faChevronLeft} />
                            </Button>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNumber
                              if (totalPages <= 5) {
                                pageNumber = i + 1
                              } else if (currentPage <= 3) {
                                pageNumber = i + 1
                              } else if (currentPage >= totalPages - 2) {
                                pageNumber = totalPages - 4 + i
                              } else {
                                pageNumber = currentPage - 2 + i
                              }
                              
                              return (
                                <Button
                                  key={pageNumber}
                                  variant={currentPage === pageNumber ? "primary" : "outline-primary"}
                                  size="sm"
                                  onClick={() => handlePageChange(pageNumber)}
                                >
                                  {pageNumber}
                                </Button>
                              )
                            })}
                            
                            <Button
                              variant="outline-primary"
                              size="sm"
                              disabled={currentPage === totalPages}
                              onClick={() => handlePageChange(currentPage + 1)}
                            >
                              <FontAwesomeIcon icon={faChevronRight} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modale di Modifica */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Modifica Ingresso
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {editError && (
              <Alert variant="danger">
                {editError}
              </Alert>
            )}
            
            <Row>
              <Col xs={12} lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    onBlur={handleEditFieldBlur}
                    placeholder="Inserisci email"
                    required
                    disabled={editLoading}
                    isInvalid={shouldShowEditError('email')}
                    className={shouldShowEditError('email') ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {getEditErrorMessage('email')}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ragione Sociale *</Form.Label>
                  <Form.Control
                    type="text"
                    name="ragione_sociale"
                    value={editFormData.ragione_sociale}
                    onChange={handleEditInputChange}
                    onBlur={handleEditFieldBlur}
                    placeholder="Inserisci ragione sociale"
                    required
                    disabled={editLoading}
                    isInvalid={shouldShowEditError('ragione_sociale')}
                    className={shouldShowEditError('ragione_sociale') ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {getEditErrorMessage('ragione_sociale')}
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
                    value={editFormData.targa}
                    onChange={handleEditInputChange}
                    onBlur={handleEditFieldBlur}
                    placeholder="Inserisci targa (es. AB123CD)"
                    required
                    disabled={editLoading}
                    style={{ textTransform: 'uppercase' }}
                    isInvalid={shouldShowEditError('targa')}
                    className={shouldShowEditError('targa') ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {getEditErrorMessage('targa')}
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
                    value={editFormData.partita_iva}
                    onChange={handleEditInputChange}
                    onBlur={handleEditFieldBlur}
                    placeholder="Inserisci partita IVA (11 cifre)"
                    required
                    disabled={editLoading}
                    maxLength={11}
                    isInvalid={shouldShowEditError('partita_iva')}
                    className={shouldShowEditError('partita_iva') ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {getEditErrorMessage('partita_iva')}
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
                    value={editFormData.indirizzo}
                    onChange={handleEditInputChange}
                    onBlur={handleEditFieldBlur}
                    placeholder="Inserisci indirizzo completo"
                    required
                    disabled={editLoading}
                    maxLength={500}
                    isInvalid={shouldShowEditError('indirizzo')}
                    className={shouldShowEditError('indirizzo') ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {getEditErrorMessage('indirizzo')}
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
                    value={editImportoDisplayValue}
                    onChange={handleEditInputChange}
                    onBlur={handleEditFieldBlur}
                    placeholder="0.00"
                    required
                    disabled={editLoading}
                    isInvalid={shouldShowEditError('importo')}
                    className={shouldShowEditError('importo') ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {getEditErrorMessage('importo')}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Inserisci l'importo con decimali (es. 10.50)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={handleCloseEditModal}
              disabled={editLoading}
            >
              Annulla
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={editLoading || !isEditFormValid()}
            >
              {editLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Salvando...
                </>
              ) : (
                'Salva Modifiche'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modale di Conferma Email Aggiornamento */}
      <Modal 
        show={showEmailConfirmModal} 
        onHide={() => !emailSending && handleSkipUpdateEmail()} 
        size="md"
        backdrop={emailSending ? 'static' : true}
        keyboard={!emailSending}
      >
        <Modal.Header closeButton={!emailSending}>
          <Modal.Title>
            <FontAwesomeIcon icon={faCheck} className="me-2 text-success" />
            Ingresso Aggiornato
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <FontAwesomeIcon icon={faCheck} size="3x" className="text-success mb-3" />
            <h5>Ingresso modificato con successo!</h5>
          </div>
          
          {updatedIngressoForEmail && (
            <div className="bg-light p-3 rounded mb-3">
              <h6 className="mb-2">Dati aggiornati:</h6>
              <div className="row">
                <div className="col-6">
                  <small className="text-muted">Ragione Sociale:</small><br/>
                  <strong>{updatedIngressoForEmail.ragione_sociale}</strong>
                </div>
                <div className="col-6">
                  <small className="text-muted">Targa:</small><br/>
                  <strong>{updatedIngressoForEmail.targa}</strong>
                </div>
                <div className="col-6 mt-2">
                  <small className="text-muted">Email:</small><br/>
                  <strong>{updatedIngressoForEmail.email}</strong>
                </div>
                <div className="col-6 mt-2">
                  <small className="text-muted">Importo:</small><br/>
                  <strong className="text-success">{formatImporto(updatedIngressoForEmail.importo)}</strong>
                </div>
              </div>
            </div>
          )}

          <Alert variant="info" className="mb-3">
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            <strong>Desideri inviare una notifica email di aggiornamento?</strong>
            <br/>
            <small className="text-muted">
              Verrà inviata una email agli amministratori con i dati aggiornati dell'ingresso.
              L'oggetto conterrà il suffisso [AGGIORNATO] per distinguerla dai nuovi ingressi.
            </small>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleSkipUpdateEmail}
            disabled={emailSending}
          >
            No, grazie
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSendUpdateEmail}
            disabled={emailSending}
          >
            {emailSending ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Invio in corso...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faEdit} className="me-2" />
                Sì, invia email
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modale PDF - Compatibile con Dark Mode */}
      <Modal 
        show={showPdfModal} 
        onHide={handleClosePdfModal} 
        size="lg"
        backdrop={pdfGenerating ? 'static' : true}
        keyboard={!pdfGenerating}
        className="modal-pdf-generator"
        data-bs-theme="auto"
      >
        <Modal.Header closeButton={!pdfGenerating} className="border-bottom">
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon icon={faFilePdf} className="me-2 text-success" />
            <span>Documento PDF - Ingresso Pass</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedIngressoForPdf && (
            <div>
              <div className="text-center mb-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle p-3 mb-3">
                  <FontAwesomeIcon icon={faFilePdf} size="2x" className="text-success" />
                </div>
                <h5 className="mb-2 text-body">Genera PDF per l'ingresso</h5>
                <p className="text-body-secondary mb-0">
                  Scarica o stampa il documento PDF dell'ingresso con tutti i dettagli
                </p>
              </div>
              
              {/* Anteprima dati - Card moderna */}
              <div className="card border shadow-sm mb-4">
                <div className="card-header bg-body-tertiary border-bottom">
                  <h6 className="card-title mb-0 d-flex align-items-center">
                    <FontAwesomeIcon icon={faEye} className="me-2 text-primary" />
                    Anteprima dati che saranno inclusi nel PDF:
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="border-start border-primary border-3 ps-3 mb-3">
                        <small className="text-body-secondary d-block mb-1">Ragione Sociale:</small>
                        <strong className="text-body">{selectedIngressoForPdf.ragione_sociale}</strong>
                      </div>
                      <div className="border-start border-secondary border-3 ps-3 mb-3">
                        <small className="text-body-secondary d-block mb-1">Email:</small>
                        <strong className="text-body">{selectedIngressoForPdf.email}</strong>
                      </div>
                      <div className="border-start border-info border-3 ps-3">
                        <small className="text-body-secondary d-block mb-1">Targa:</small>
                        <span className="badge bg-primary fs-6">{selectedIngressoForPdf.targa}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border-start border-warning border-3 ps-3 mb-3">
                        <small className="text-body-secondary d-block mb-1">Partita IVA:</small>
                        <span className="badge bg-info fs-6">{selectedIngressoForPdf.partita_iva}</span>
                      </div>
                      <div className="border-start border-success border-3 ps-3 mb-3">
                        <small className="text-body-secondary d-block mb-1">Importo:</small>
                        <strong className="text-success fs-5">{formatImporto(selectedIngressoForPdf.importo)}</strong>
                      </div>
                      <div className="border-start border-secondary border-3 ps-3">
                        <small className="text-body-secondary d-block mb-1">Data Creazione:</small>
                        <strong className="text-body">{formatDate(selectedIngressoForPdf.created_at)}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-top">
                    <small className="text-body-secondary d-block mb-1">Indirizzo completo:</small>
                    <strong className="text-body">{selectedIngressoForPdf.indirizzo}</strong>
                  </div>
                </div>
              </div>

              {/* Controlli PDF - Sezione migliorata */}
              <div className="text-center">
                <div className="card border-0 bg-body-secondary bg-opacity-25">
                  <div className="card-body p-4">
                    <h6 className="card-title text-body mb-3">Azioni disponibili</h6>
                    <div className="d-inline-flex gap-3 align-items-center">
                      <IngressoPDFGenerator 
                        ingresso={selectedIngressoForPdf}
                        onGenerating={setPdfGenerating}
                      />
                    </div>
                    
                    {pdfGenerating && (
                      <div className="mt-3 p-3 bg-warning bg-opacity-10 border border-warning rounded">
                        <div className="d-flex align-items-center justify-content-center">
                          <Spinner animation="border" size="sm" className="me-2 text-warning" />
                          <span className="text-body-emphasis fw-medium">Generazione PDF in corso...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Alert informativo moderno */}
              <div className="alert alert-info d-flex align-items-start mt-4" role="alert">
                <div className="flex-shrink-0 me-3">
                  <FontAwesomeIcon icon={faFilePdf} className="text-info" />
                </div>
                <div className="flex-grow-1">
                  <h6 className="alert-heading mb-2">Informazioni sul documento</h6>
                  <ul className="mb-0 ps-3">
                    <li className="mb-1">Il PDF conterrà tutti i dettagli dell'ingresso in formato ufficiale</li>
                    <li className="mb-1">Il documento includerà l'intestazione "SalernoCruises - Nuovo Ingresso (PASS)"</li>
                    <li className="mb-0">Nome file: <code className="text-info">SalernoCruises_Ingresso_{selectedIngressoForPdf.targa}_{new Date().toISOString().split('T')[0]}.pdf</code></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top d-flex justify-content-between align-items-center">
          <small className="text-body-secondary">
            Powered by <strong className="text-primary">CoreUI UI Components</strong>
          </small>
          <Button 
            variant="outline-secondary" 
            onClick={handleClosePdfModal}
            disabled={pdfGenerating}
            className="px-4"
          >
            <span>Chiudi</span>
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast per successo modifica */}
      <ToastContainer 
        position="top-end" 
        className="p-3"
        style={{ zIndex: 1050 }}
      >
        <Toast 
          show={showEditSuccessToast} 
          onClose={() => setShowEditSuccessToast(false)}
          delay={4000}
          autohide
          bg="success"
        >
          <Toast.Header closeButton={false}>
            <FontAwesomeIcon icon={faCheck} className="me-2" />
            <strong className="me-auto">Successo!</strong>
          </Toast.Header>
          <Toast.Body>
            Ingresso modificato con successo! {updatedIngressoForEmail ? 'Email di aggiornamento inviata.' : ''}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}
