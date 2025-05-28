'use client'

import React, { useState, useEffect } from 'react'
import { Card, Table, Row, Col, Spinner, Alert, Button, Form, Modal, Toast, ToastContainer } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faChevronLeft, faChevronRight, faTrash, faEdit, faCheck } from '@fortawesome/free-solid-svg-icons'
import { validateCreateIngresso } from '@/validation/ingresso.validation'

interface Ingresso {
  id: string
  email: string
  ragione_sociale: string
  targa: string
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
    importo: 0
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, FieldError>>({})
  const [editTouchedFields, setEditTouchedFields] = useState<Set<string>>(new Set())
  const [editImportoDisplayValue, setEditImportoDisplayValue] = useState<string>('')
  const [showEditSuccessToast, setShowEditSuccessToast] = useState(false)

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
        setEditTouchedFields(new Set(['email', 'ragione_sociale', 'targa', 'importo']))
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
            setEditTouchedFields(prev => new Set([...prev, ...Object.keys(serverErrors)]))
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
      setShowEditSuccessToast(true)
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
      <Row>
        <Col xs={12}>
          <Card className="shadow-sm">
            <Card.Header className="d-flex align-items-center justify-content-between bg-primary text-white">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faEye} className="me-2" />
                <strong>Visualizza Ingressi</strong>
              </div>
              <div className="text-white-50">
                Totale: {total} ingressi
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
                              <th>Importo</th>
                              <th>Data Creazione</th>
                              <th>Ultima Modifica</th>
                              <th width="120">Azioni</th>
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
                                <td className="fw-bold text-success">
                                  {formatImporto(ingresso.importo)}
                                </td>
                                <td className="text-muted">
                                  {formatDate(ingresso.created_at)}
                                </td>
                                <td className="text-muted">
                                  {formatDate(ingresso.updated_at)}
                                </td>
                                <td>
                                  <div className="d-flex gap-1">
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
            Ingresso modificato con successo!
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}
