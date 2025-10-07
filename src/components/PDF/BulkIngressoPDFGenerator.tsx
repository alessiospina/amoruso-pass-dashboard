'use client'

import React, { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Button, Spinner, Form, Row, Col, Alert } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilePdf, faCalendar } from '@fortawesome/free-solid-svg-icons'

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

interface BulkIngressoPDFGeneratorProps {
  onClose?: () => void
}

export default function BulkIngressoPDFGenerator({ onClose }: BulkIngressoPDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [foundCount, setFoundCount] = useState<number | null>(null)
  const [ingressi, setIngressi] = useState<Ingresso[]>([])
  const documentRef = useRef<HTMLDivElement>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Rome'
    })
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Rome'
    })
  }

  const formatImporto = (importo: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(importo)
  }

  const fetchIngressiByDateRange = async (start: string, end: string): Promise<Ingresso[]> => {
    const allIngressi: Ingresso[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const response = await fetch(`/api/ingressi?page=${page}&limit=100`)

      if (!response.ok) {
        throw new Error('Errore nel caricamento degli ingressi')
      }

      const data = await response.json()
      allIngressi.push(...data.data)

      hasMore = data.page < data.totalPages
      page++
    }

    // Filtra per range di date con orari precisi
    // Data inizio: 00:00:00
    const startDate = new Date(start)
    startDate.setHours(0, 0, 0, 0)
    const startTime = startDate.getTime()

    // Data fine: 23:59:59
    const endDate = new Date(end)
    endDate.setHours(23, 59, 59, 999)
    const endTime = endDate.getTime()

    return allIngressi.filter(ingresso => {
      const ingressoTime = new Date(ingresso.created_at).getTime()
      return ingressoTime >= startTime && ingressoTime <= endTime
    })
  }

  const generateBulkPDF = async () => {
    if (!startDate || !endDate) {
      setError('Seleziona entrambe le date')
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('La data di inizio deve essere precedente alla data di fine')
      return
    }

    try {
      setIsGenerating(true)
      setError(null)
      setFoundCount(null)

      // Recupera tutti gli ingressi nel range
      const fetchedIngressi = await fetchIngressiByDateRange(startDate, endDate)

      if (fetchedIngressi.length === 0) {
        setError('Nessun ingresso trovato nel periodo selezionato')
        setIsGenerating(false)
        return
      }

      // Ordina per data (più recenti prima)
      const sortedIngressi = [...fetchedIngressi].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setIngressi(sortedIngressi)
      setFoundCount(sortedIngressi.length)

      // Aspetta che il DOM sia renderizzato
      await new Promise(resolve => setTimeout(resolve, 500))

      if (!documentRef.current) return

      // Genera il PDF dall'HTML
      const element = documentRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('l', 'mm', 'a4')

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      // Prima pagina
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      // Aggiungi pagine aggiuntive se necessario
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      // Salva il PDF
      const fileName = `SalernoCruises_Report_${new Date(startDate).toISOString().split('T')[0]}_${new Date(endDate).toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      // Chiudi la modale dopo il successo
      setTimeout(() => {
        onClose?.()
        setIngressi([])
      }, 1000)

    } catch (err) {
      console.error('Errore nella generazione del PDF:', err)
      setError(err instanceof Error ? err.message : 'Errore nella generazione del PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bulk-pdf-generator">
      {/* Documento HTML nascosto per la generazione del PDF */}
      {ingressi.length > 0 && (
        <div
          ref={documentRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '0',
            width: '1100px',
            backgroundColor: 'white',
            padding: '40px',
            fontFamily: 'Arial, sans-serif',
            color: '#000'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'left', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #0066cc' }}>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#0066cc', fontWeight: 'bold' }}>
              SalernoCruises - Report Ingressi (PASS)
            </h1>
            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
              Periodo: {formatDateOnly(startDate)} - {formatDateOnly(endDate)}
            </p>
          </div>

          {/* Tabella */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0066cc', color: 'white' }}>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Data</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Ragione Sociale</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Targa</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>P.IVA</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Indirizzo</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Importo</th>
              </tr>
            </thead>
            <tbody>
              {ingressi.map((ingresso, index) => (
                <tr key={ingresso.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontSize: '10px' }}>
                    {formatDate(ingresso.created_at)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '10px' }}>
                    {ingresso.ragione_sociale}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '10px' }}>
                    {ingresso.email}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }}>
                    {ingresso.targa}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontSize: '10px' }}>
                    {ingresso.partita_iva}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '9px' }}>
                    {ingresso.indirizzo}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#28a745', fontSize: '10px' }}>
                    {formatImporto(ingresso.importo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '2px solid #0066cc',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#0066cc'
          }}>
            <span><strong>SalernoCruises © 2025</strong></span>
            <span>Documento generato il: {new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</span>
            <span><strong>Powered By Manovalanza</strong></span>
          </div>
        </div>
      )}

      {/* Interfaccia utente */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>
              <FontAwesomeIcon icon={faCalendar} className="me-2" />
              Data Inizio *
            </Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isGenerating}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>
              <FontAwesomeIcon icon={faCalendar} className="me-2" />
              Data Fine *
            </Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isGenerating}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {foundCount !== null && (
        <Alert variant="success" className="mb-3">
          Trovati {foundCount} ingressi nel periodo selezionato. PDF generato con successo!
        </Alert>
      )}

      <div className="d-flex justify-content-center">
        <Button
          variant="success"
          size="lg"
          onClick={generateBulkPDF}
          disabled={isGenerating || !startDate || !endDate}
          className="d-flex align-items-center gap-2 px-5 py-3 shadow-sm"
        >
          {isGenerating ? (
            <>
              <Spinner as="span" animation="border" size="sm" />
              <span>Generazione in corso...</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faFilePdf} />
              <span className="fw-medium">Genera Report PDF</span>
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 text-center">
        <small className="text-muted">
          Il PDF conterrà tutti gli ingressi nel periodo selezionato in formato tabella
        </small>
      </div>
    </div>
  )
}