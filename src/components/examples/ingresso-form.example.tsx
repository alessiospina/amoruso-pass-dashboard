// Esempio di come utilizzare i Result types nei componenti React
'use client'

import React, { useState } from 'react'
import { useIngressi, IngressoResultHandlers } from '@/hooks/useIngressi'
import { isValidationErrorResult, isBusinessRuleErrorResult } from '@/common/result'

export default function IngressoFormExample() {
  const { createIngresso } = useIngressi()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<any[]>([])

  const handleSubmit = async (formData: any) => {
    setLoading(true)
    setMessage(null)
    setValidationErrors([])

    // Utilizzo del Result pattern
    const result = await createIngresso(formData)
    
    // Gestione tipo-sicura del risultato
    if (result.success) {
      setMessage('Ingresso creato con successo!')
      // result.data contiene l'Ingresso creato (tipizzato)
      console.log('Ingresso creato:', result.data)
    } else {
      // Gestione degli errori specifica per tipo
      if (isValidationErrorResult(result)) {
        setMessage('Errori di validazione nei dati inseriti')
        setValidationErrors(result.validationErrors)
        
        // Esempio: mostra errori specifici per campo
        result.validationErrors.forEach(error => {
          console.log(`Campo ${error.field}: ${error.message}`)
        })
      } else if (isBusinessRuleErrorResult(result)) {
        setMessage('Violazione delle regole business')
        
        // Esempio: mostra errori di business
        result.businessErrors.forEach(error => {
          console.log(`Regola ${error.rule}: ${error.message}`)
        })
      } else {
        // Errore generico
        setMessage(result.error)
      }
    }
    
    setLoading(false)
  }

  // Oppure usa l'helper per gestione semplificata
  const handleSubmitWithHelper = async (formData: any) => {
    setLoading(true)
    
    const result = await createIngresso(formData)
    const handled = IngressoResultHandlers.handleCreateResult(result)
    
    if (handled.success) {
      setMessage(handled.message)
    } else {
      setMessage(handled.message)
      if ('errors' in handled) {
        setValidationErrors(handled.errors || [])
      }
    }
    
    setLoading(false)
  }

  return (
    <div>
      <h3>Esempio Form Ingresso</h3>
      {message && (
        <div className={message.includes('successo') ? 'alert-success' : 'alert-error'}>
          {message}
        </div>
      )}
      
      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h4>Errori di validazione:</h4>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>
                <strong>{error.field}:</strong> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Form content qui... */}
      <button 
        onClick={() => handleSubmit({ /* form data */ })}
        disabled={loading}
      >
        {loading ? 'Creando...' : 'Crea Ingresso'}
      </button>
    </div>
  )
}
