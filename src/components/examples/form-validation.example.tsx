'use client'

import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import IngressoForm from '@/components/Form/IngressoForm'

export default function FormValidationExample() {
  return (
    <Container fluid className="py-4">
      <Row>
        <Col xs={12}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Esempio Form con Validazione Zod</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">
                Questo form implementa le seguenti funzionalità:
              </p>
              <ul className="text-muted">
                <li>Validazione in tempo reale con Zod</li>
                <li>Bordi rossi per campi invalidi</li>
                <li>Messaggi di errore specifici per campo</li>
                <li>Formattazione automatica del prezzo in decimale</li>
                <li>Conversione automatica della targa in maiuscolo</li>
                <li>Validazione sia client-side che server-side</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col xs={12}>
          <IngressoForm 
            onSuccess={() => console.log('✅ Form inviato con successo!')}
            onError={(error) => console.error('❌ Errore:', error)}
          />
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col xs={12}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Regole di Validazione</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <strong>Email:</strong>
                  <ul className="small text-muted">
                    <li>Campo obbligatorio</li>
                    <li>Formato email valido</li>
                    <li>Massimo 255 caratteri</li>
                  </ul>
                  
                  <strong>Ragione Sociale:</strong>
                  <ul className="small text-muted">
                    <li>Campo obbligatorio</li>
                    <li>Massimo 255 caratteri</li>
                    <li>Viene trimmed automaticamente</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <strong>Targa:</strong>
                  <ul className="small text-muted">
                    <li>Campo obbligatorio</li>
                    <li>Solo lettere maiuscole e numeri</li>
                    <li>Massimo 10 caratteri</li>
                    <li>Conversione automatica in maiuscolo</li>
                  </ul>
                  
                  <strong>Importo:</strong>
                  <ul className="small text-muted">
                    <li>Campo obbligatorio</li>
                    <li>Deve essere positivo</li>
                    <li>Massimo 999999.99</li>
                    <li>Massimo 2 decimali</li>
                    <li>Formattazione automatica</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
