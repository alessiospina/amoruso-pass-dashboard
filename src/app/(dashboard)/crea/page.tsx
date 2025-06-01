'use client'

import React from 'react'
import { Row, Col } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import IngressoForm from '@/components/Form/IngressoForm'

export default function CreaIngressoPage() {
  const handleSuccess = () => {
    console.log('Ingresso creato con successo!')
  }

  const handleError = (error: string) => {
    console.error('Errore nella creazione:', error)
  }

  return (
    <div className="animated fadeIn">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Crea Nuovo Ingresso
              </h1>
              <p className="text-muted">
                Inserisci i dati per creare un nuovo ingresso nel sistema
              </p>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <IngressoForm onSuccess={handleSuccess} onError={handleError} />
        </Col>
      </Row>
    </div>
  )
}
