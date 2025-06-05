'use client'

import {
  Alert, Button, Col, FormControl, InputGroup, Row,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-regular-svg-icons'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import Link from 'next/link'
import InputGroupText from 'react-bootstrap/InputGroupText'
import { useRouter } from 'next/navigation'
import useDictionary from '@/locales/dictionary-hook'

export default function Login({ callbackUrl }: { callbackUrl: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const dict = useDictionary()

  const handleLogin = async () => {
    console.log('🎯 Login started')
    
    if (!email || !password) {
      setError('Email e password sono obbligatorie')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      console.log('📡 Sending login request...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Importante per i cookie
      })

      console.log('📡 Response status:', response.status)
      const result = await response.json()
      console.log('📡 Response data:', result)

      if (result.success) {
        console.log('✅ Login successful!')
        
        // Determina la URL di redirect
        let redirectUrl = callbackUrl || '/'
        
        // Se callbackUrl è vuoto, usa la root
        if (!redirectUrl || redirectUrl === '/login') {
          redirectUrl = '/'
        }
        
        console.log('🎯 Redirect URL:', redirectUrl)
        
        // Aspetta un momento per assicurarsi che il cookie sia impostato
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Forza il refresh della pagina per aggiornare lo stato di autenticazione
        console.log('🔄 Forcing page refresh and redirect...')
        window.location.href = redirectUrl
        
      } else {
        console.log('❌ Login failed:', result.message)
        setError(result.message || 'Credenziali non valide')
      }
    } catch (err) {
      console.error('💥 Login error:', err)
      setError('Errore di connessione')
    } finally {
      console.log('🏁 Setting submitting to false')
      setSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLogin()
    }
  }

  return (
    <>
      <Alert
        variant="danger"
        show={error !== ''}
        onClose={() => setError('')}
        dismissible
      >
        {error}
      </Alert>
      
      <div>
        <InputGroup className="mb-3">
          <InputGroupText>
            <FontAwesomeIcon icon={faUser} fixedWidth />
          </InputGroupText>
          <FormControl
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={'Email'}
            disabled={submitting}
            onKeyPress={handleKeyPress}
          />
        </InputGroup>

        <InputGroup className="mb-3">
          <InputGroupText>
            <FontAwesomeIcon icon={faLock} fixedWidth />
          </InputGroupText>
          <FormControl
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={dict.login.form.password || 'Password'}
            disabled={submitting}
            onKeyPress={handleKeyPress}
          />
        </InputGroup>

        <Row className="align-items-center">
          <Col xs={6}>
            <Button
              className="px-4"
              variant="primary"
              onClick={handleLogin}
              disabled={submitting}
            >
              {submitting ? 'Accesso...' : dict.login.form.submit}
            </Button>
          </Col>
          <Col xs={6} className="text-end">
            <Link className="px-0" href="#">
              {dict.login.forgot_password}
            </Link>
          </Col>
        </Row>
      </div>
    </>
  )
}
