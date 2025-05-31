'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// Implementazione semplice di debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

interface AutocompleteInputProps {
  label: string
  name: string
  value: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  size?: 'sm' | 'lg'
  maxLength?: number
  isInvalid?: boolean
  className?: string
  helpText?: string
  style?: React.CSSProperties
  fetchSuggestions: (query: string) => Promise<string[]>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  onSelect?: (value: string) => void
  minQueryLength?: number
  maxSuggestions?: number
  formatValue?: (value: string) => string
}

export default function AutocompleteInput({
  label,
  name,
  value,
  placeholder,
  required = false,
  disabled = false,
  size,
  maxLength,
  isInvalid = false,
  className = '',
  helpText,
  style,
  fetchSuggestions,
  onChange,
  onBlur,
  onSelect,
  minQueryLength = 1,
  maxSuggestions = 10,
  formatValue
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [localValue, setLocalValue] = useState(value)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Funzione debounced per fetch delle suggestions
  const debouncedFetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < minQueryLength) {
        setSuggestions([])
        setShowSuggestions(false)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const results = await fetchSuggestions(query)
        const limitedResults = results.slice(0, maxSuggestions)
        setSuggestions(limitedResults)
        setShowSuggestions(limitedResults.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Errore nel caricamento suggerimenti:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setLoading(false)
      }
    }, 300),
    [fetchSuggestions, minQueryLength, maxSuggestions]
  )

  // Sync con il valore esterno
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Gestisce il cambio del valore
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = formatValue ? formatValue(e.target.value) : e.target.value
    setLocalValue(newValue)
    
    // Crea un nuovo evento con il valore formattato
    const formattedEvent = {
      ...e,
      target: {
        ...e.target,
        value: newValue
      }
    }
    
    onChange(formattedEvent)
    debouncedFetchSuggestions(newValue)
  }

  // Gestisce la selezione di un suggerimento
  const handleSuggestionSelect = (suggestion: string) => {
    setLocalValue(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(-1)
    
    // Crea un evento simulato per onChange
    const syntheticEvent = {
      target: {
        name,
        value: suggestion
      }
    } as React.ChangeEvent<HTMLInputElement>
    
    onChange(syntheticEvent)
    onSelect?.(suggestion)
    
    // Focus sull'input
    inputRef.current?.focus()
  }

  // Gestisce la navigazione con le frecce
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
      
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
      
      default:
        break
    }
  }

  // Gestisce il blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ritarda la chiusura per permettere il click sui suggerimenti
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }, 150)
    
    onBlur(e)
  }

  // Chiude i suggerimenti quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="mb-3 position-relative">
      <label className="form-label">{label} {required && '*'}</label>
      <div className="position-relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`form-control ${size === 'lg' ? 'form-control-lg' : ''} ${isInvalid ? 'is-invalid' : ''} ${className}`}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          style={style}
          autoComplete="off"
        />
        
        {loading && (
          <div 
            className="position-absolute"
            style={{ 
              right: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              zIndex: 10
            }}
          >
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="position-absolute w-100 mt-1"
            style={{ 
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            <div className="list-group">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  type="button"
                  className={`list-group-item list-group-item-action py-2 px-3 ${index === selectedIndex ? 'active' : ''}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  style={{ 
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {helpText && !isInvalid && (
        <div className="form-text text-muted">
          {helpText}
        </div>
      )}
      
      {isInvalid && helpText && (
        <div className="invalid-feedback" style={{ display: 'block' }}>
          {helpText}
        </div>
      )}
    </div>
  )
}
