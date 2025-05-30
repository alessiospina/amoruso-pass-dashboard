import { useState, useCallback } from 'react'
import { z } from 'zod'

interface FieldError {
  message: string
  isValid: boolean
}

interface UseFormValidationProps<T> {
  schema: z.ZodSchema<T>
  initialData: T
}

interface UseFormValidationReturn<T> {
  data: T
  errors: Record<string, FieldError>
  touchedFields: Set<string>
  updateField: (name: keyof T, value: any) => void
  validateField: (name: keyof T) => void
  validateAll: () => boolean
  resetForm: () => void
  setData: (data: T) => void
  markFieldTouched: (name: keyof T) => void
  shouldShowError: (name: keyof T) => boolean
  getErrorMessage: (name: keyof T) => string
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialData
}: UseFormValidationProps<T>): UseFormValidationReturn<T> {
  const [data, setDataState] = useState<T>(initialData)
  const [errors, setErrors] = useState<Record<string, FieldError>>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  const validateField = useCallback((name: keyof T, value?: any, allData?: T) => {
    try {
      const dataToValidate = allData || { ...data, [name]: value !== undefined ? value : data[name] }
      const result = schema.safeParse(dataToValidate)
      
      if (result.success) {
        return { message: '', isValid: true }
      } else {
        const fieldError = result.error.issues.find(issue => 
          issue.path.includes(name as string)
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
  }, [data, schema])

  const updateField = useCallback((name: keyof T, value: any) => {
    const newData = {
      ...data,
      [name]: value,
    }
    
    setDataState(newData)
    
    // Aggiunge il campo ai touched fields
    setTouchedFields(prev => new Set(prev).add(name as string))
    
    // Valida il campo in tempo reale solo se è stato toccato
    if (touchedFields.has(name as string) || value !== '' && value !== 0) {
      const fieldError = validateField(name, value, newData)
      setErrors(prev => ({
        ...prev,
        [name]: fieldError
      }))
    }
  }, [data, touchedFields, validateField])

  const validateFieldByName = useCallback((name: keyof T) => {
    setTouchedFields(prev => new Set(prev).add(name as string))
    
    const fieldError = validateField(name)
    setErrors(prev => ({
      ...prev,
      [name]: fieldError
    }))
  }, [validateField])

  const validateAll = useCallback(() => {
    const result = schema.safeParse(data)
    
    if (result.success) {
      setErrors({})
      return true
    }
    
    const newErrors: Record<string, FieldError> = {}
    
    result.error.issues.forEach(issue => {
      const fieldName = issue.path[0] as string
      if (fieldName) {
        newErrors[fieldName] = {
          message: issue.message,
          isValid: false
        }
      }
    })
    
    setErrors(newErrors)
    
    // Marca tutti i campi con errori come toccati
    const fieldsWithErrors = Object.keys(newErrors)
    setTouchedFields(prev => new Set([...Array.from(prev), ...fieldsWithErrors]))
    
    return false
  }, [data, schema])

  const resetForm = useCallback(() => {
    setDataState(initialData)
    setErrors({})
    setTouchedFields(new Set())
  }, [initialData])

  const setData = useCallback((newData: T) => {
    setDataState(newData)
  }, [])

  const markFieldTouched = useCallback((name: keyof T) => {
    setTouchedFields(prev => new Set(prev).add(name as string))
  }, [])

  const shouldShowError = useCallback((name: keyof T) => {
    const fieldError = errors[name as string]
    return touchedFields.has(name as string) && fieldError && !fieldError.isValid
  }, [errors, touchedFields])

  const getErrorMessage = useCallback((name: keyof T) => {
    const fieldError = errors[name as string]
    return fieldError && !fieldError.isValid ? fieldError.message : ''
  }, [errors])

  return {
    data,
    errors,
    touchedFields,
    updateField,
    validateField: validateFieldByName,
    validateAll,
    resetForm,
    setData,
    markFieldTouched,
    shouldShowError,
    getErrorMessage
  }
}
