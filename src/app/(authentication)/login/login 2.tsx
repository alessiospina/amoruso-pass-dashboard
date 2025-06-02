'use client'

import {
  Alert, Button, Col, Form, FormControl, InputGroup, Row,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-regular-svg-icons'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import Link from 'next/link'
import InputGroupText from 'react-bootstrap/InputGroupText'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import useDictionary from '@/locales/dictionary-hook'

export default function Login({ callbackUrl }: { callbackUrl: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const dict = useDictionary()

  const login = async (formData: FormData) => {
    setSubmitting(true)
    setError('')

    try {
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      // Prima prova con il nostro sistema JWT
      const jwtResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const jwtResult = await jwtResponse.json()

      if (jwtResult.success) {
        // Login JWT riuscito, reindirizza
        router.push(callbackUrl || '/')
        return
      }

      // Se JWT fallisce, prova con NextAuth come fallback
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (!res) {
        setError('Login fallito')
        return
      }

      const { ok, url, error: err } = res

      if (!ok) {
        if (err) {
          setError(err)
          return
        }

        setError('Credenziali non valide')
        return
      }

      if (url) {
        router.push(url)
      }
    } catch (err) {
      console.error('Errore durante il login:', err)
      setError('Errore di connessione')
    } finally {
      setSubmitting(false)
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
      <Form action={login}>
        <InputGroup className="mb-3">
          <InputGroupText>
            <FontAwesomeIcon
              icon={faUser}
              fixedWidth
            />
          </InputGroupText>
          <FormControl
            name="email"
            type="email"
            required
            disabled={submitting}
            placeholder={dict.login.form.email || 'Email'}
            aria-label="Email"
          />
        </InputGroup>

        <InputGroup className="mb-3">
          <InputGroupText>
            <FontAwesomeIcon
              icon={faLock}
              fixedWidth
            />
          </InputGroupText>
          <FormControl
            type="password"
            name="password"
            required
            disabled={submitting}
            placeholder={dict.login.form.password}
            aria-label="Password"
          />
        </InputGroup>

        <Row className="align-items-center">
          <Col xs={6}>
            <Button
              className="px-4"
              variant="primary"
              type="submit"
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
      </Form>
    </>
  )
}
