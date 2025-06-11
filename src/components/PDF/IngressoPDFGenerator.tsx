'use client'

import React, { useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Button, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faPrint } from '@fortawesome/free-solid-svg-icons'

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

interface IngressoPDFGeneratorProps {
  ingresso: Ingresso
  onGenerating?: (loading: boolean) => void
}

export default function IngressoPDFGenerator({ ingresso, onGenerating }: IngressoPDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = React.useState(false)
  const documentRef = useRef<HTMLDivElement>(null)

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

  const generatePDF = async (action: 'download' | 'print' = 'download') => {
    if (!documentRef.current) return

    try {
      setIsGenerating(true)
      onGenerating?.(true)

      // Aspetta un momento per assicurarsi che il DOM sia renderizzato
      await new Promise(resolve => setTimeout(resolve, 100))

      const element = documentRef.current
      
      // Configurazione per alta qualità
      const canvas = await html2canvas(element, {
        scale: 2, // Scala per alta risoluzione
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight,
      })

      const imgData = canvas.toDataURL('image/png')
      
      // Calcola le dimensioni per il PDF (A4)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      // Calcola le dimensioni dell'immagine mantenendo l'aspect ratio
      const imgWidth = pdfWidth - 20 // Margini di 10mm su ogni lato
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Se l'immagine è troppo alta, la ridimensiona
      const finalHeight = imgHeight > pdfHeight - 20 ? pdfHeight - 20 : imgHeight
      const finalWidth = imgHeight > pdfHeight - 20 ? (canvas.width * finalHeight) / canvas.height : imgWidth

      pdf.addImage(imgData, 'PNG', 10, 10, finalWidth, finalHeight)

      const fileName = `SalernoCruises_Ingresso_${ingresso.targa}_${new Date().toISOString().split('T')[0]}.pdf`

      if (action === 'download') {
        pdf.save(fileName)
      } else if (action === 'print') {
        // Apre il dialog di stampa
        const pdfBlob = pdf.output('blob')
        const pdfUrl = URL.createObjectURL(pdfBlob)
        const printWindow = window.open(pdfUrl)
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print()
          }
        }
      }
    } catch (error) {
      console.error('Errore nella generazione del PDF:', error)
      alert('Errore nella generazione del PDF. Riprova.')
    } finally {
      setIsGenerating(false)
      onGenerating?.(false)
    }
  }

  return (
    <div className="ingresso-pdf-generator">
      {/* Documento PDF (nascosto durante la visualizzazione normale) */}
      <div 
        ref={documentRef}
        className="pdf-document"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '210mm', // A4 width
          padding: '20mm',
          backgroundColor: 'white',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        <PDFDocument ingresso={ingresso} />
      </div>

      {/* Controlli moderni compatibili con dark mode */}
      <div className="d-flex flex-column flex-sm-row gap-3 align-items-center">
        <Button
          variant="success"
          size="lg"
          onClick={() => generatePDF('download')}
          disabled={isGenerating}
          className="d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
          title="Scarica PDF"
        >
          {isGenerating ? (
            <Spinner as="span" animation="border" size="sm" />
          ) : (
            <FontAwesomeIcon icon={faDownload} />
          )}
          <span className="fw-medium">Scarica</span>
        </Button>
        
        <Button
          variant="outline-info"
          size="lg"
          onClick={() => generatePDF('print')}
          disabled={isGenerating}
          className="d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
          title="Stampa PDF"
        >
          {isGenerating ? (
            <Spinner as="span" animation="border" size="sm" />
          ) : (
            <FontAwesomeIcon icon={faPrint} />
          )}
          <span className="fw-medium">Stampa</span>
        </Button>
      </div>
    </div>
  )
}

// Componente per il layout del documento PDF
function PDFDocument({ ingresso }: { ingresso: Ingresso }) {
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
    <div style={{ color: '#000', lineHeight: '1.6' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #0066cc', paddingBottom: '20px' }}>
        <h1 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '28px', 
          color: '#0066cc',
          fontWeight: 'bold'
        }}>
          SalernoCruises
        </h1>
        <h2 style={{ 
          margin: '0', 
          fontSize: '20px', 
          color: '#333',
          fontWeight: 'normal'
        }}>
          Pass
        </h2>
      </div>

      {/* Informazioni Ingresso - Sezione unica */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ 
          color: '#0066cc', 
          fontSize: '18px', 
          marginBottom: '20px',
          borderBottom: '1px solid #ddd',
          paddingBottom: '5px'
        }}>
          Informazioni Ingresso
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#555', fontSize: '14px' }}>Ragione Sociale:</strong>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>
                {ingresso.ragione_sociale}
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#555', fontSize: '14px' }}>Email:</strong>
              <div style={{ fontSize: '16px', color: '#000' }}>
                {ingresso.email}
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#555', fontSize: '14px' }}>Targa:</strong>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: '#fff',
                backgroundColor: '#0066cc',
                padding: '5px 10px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                {ingresso.targa}
              </div>
            </div>
          </div>
          
          <div>
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#555', fontSize: '14px' }}>Partita IVA:</strong>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: '#000',
                backgroundColor: '#f8f9fa',
                padding: '5px 10px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                {ingresso.partita_iva}
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#555', fontSize: '14px' }}>Totale:</strong>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#28a745'
              }}>
                {formatImporto(ingresso.importo)}
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#555', fontSize: '14px' }}>Data e ora ingresso:</strong>
              <div style={{ fontSize: '16px', color: '#000', fontWeight: 'bold' }}>
                {formatDate(ingresso.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Indirizzo - All'interno della stessa sezione */}
        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
          <strong style={{ color: '#555', fontSize: '14px' }}>Indirizzo:</strong>
          <div style={{ 
            fontSize: '16px', 
            color: '#000',
            backgroundColor: '#f8f9fa',
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
            marginTop: '5px'
          }}>
            {ingresso.indirizzo}
          </div>
        </div>
      </div>

      {/* ID Sistema */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ 
          fontSize: '12px', 
          color: '#666',
          textAlign: 'center',
          borderTop: '1px solid #ddd',
          paddingTop: '15px'
        }}>
          <strong>ID Sistema:</strong> {ingresso.id}
          <br />
          <strong>Documento generato il:</strong> {new Date().toLocaleString('it-IT')}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '40px',
        borderTop: '2px solid #0066cc',
        paddingTop: '20px',
        color: '#0066cc',
        fontSize: '14px'
      }}>
        <div style={{ textAlign: 'left' }}>
          <strong>SalernoCruises © 2025</strong>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong>Powered By Manovalanza</strong>
        </div>
      </div>
    </div>
  )
}
