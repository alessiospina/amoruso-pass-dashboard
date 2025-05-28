'use client'

import React from 'react'
import { Row, Col } from 'react-bootstrap'
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
      <Row>
        <Col xs={12}>
          <IngressoForm onSuccess={handleSuccess} onError={handleError} />
        </Col>
      </Row>
    </div>
  )
}
